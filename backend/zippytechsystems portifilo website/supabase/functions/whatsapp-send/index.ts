import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const phoneNumberId = Deno.env.get('WA_PHONE_NUMBER_ID') || '';
    const accessToken = Deno.env.get('WA_ACCESS_TOKEN') || '';

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase server configuration missing' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const { contactId, phone, message, templateId, templateName, templateLanguage = 'en', templateVariables = [] } = body;

    if (!contactId && !phone) {
      return new Response(JSON.stringify({ error: 'Either contactId or phone is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 1. Resolve contact details
    let targetPhone = phone ? String(phone).replace(/\D/g, '') : '';
    let targetContactId = contactId;
    let contactRecord: any = null;

    if (contactId) {
      const { data: c } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();
      if (c) {
        contactRecord = c;
        targetPhone = c.phone;
      }
    } else if (targetPhone) {
      const { data: c } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('phone', targetPhone)
        .maybeSingle();
      if (c) {
        contactRecord = c;
        targetContactId = c.id;
      }
    }

    if (!targetPhone) {
      return new Response(JSON.stringify({ error: 'Recipient phone number could not be determined' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 2. Check 24-hour Customer Service Window
    const lastMsgTime = contactRecord?.last_customer_message_at
      ? new Date(contactRecord.last_customer_message_at).getTime()
      : 0;
    const isWindowOpen = lastMsgTime > 0 && Date.now() - lastMsgTime < 24 * 60 * 60 * 1000;

    // If window is closed and message is free-form text, Meta will reject it. Require template outside window.
    if (!isWindowOpen && !templateId && !templateName) {
      return new Response(
        JSON.stringify({
          error: 'The 24-hour customer service window is closed. Meta rules require an approved template message to initiate contact outside this window.',
          windowClosed: true
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Construct Meta API Payload
    let metaPayload: any = null;
    let messageContent = message || '';

    if (templateId || templateName) {
      let resolvedTemplateName = templateName;
      let resolvedLang = templateLanguage;

      if (templateId && !resolvedTemplateName) {
        const { data: tmpl } = await supabase
          .from('whatsapp_templates')
          .select('name, language, body')
          .eq('id', templateId)
          .maybeSingle();
        if (tmpl) {
          resolvedTemplateName = tmpl.name;
          resolvedLang = tmpl.language || templateLanguage;
          messageContent = tmpl.body;
          // Replace {{1}}, {{2}} with variables for local transcript preview
          templateVariables.forEach((v: string, idx: number) => {
            messageContent = messageContent.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), v);
          });
        }
      }

      metaPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: targetPhone,
        type: 'template',
        template: {
          name: resolvedTemplateName,
          language: { code: resolvedLang },
          components: templateVariables.length > 0
            ? [
                {
                  type: 'body',
                  parameters: templateVariables.map((val: string) => ({
                    type: 'text',
                    text: String(val)
                  }))
                }
              ]
            : []
        }
      };
    } else {
      metaPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: targetPhone,
        type: 'text',
        text: { preview_url: false, body: message }
      };
    }

    // 4. Send via Meta Graph API if credentials are set
    let waMessageId: string | null = null;
    let sendError: string | null = null;

    if (phoneNumberId && accessToken) {
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      const metaRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        console.error('[whatsapp-send] Meta API call failed:', JSON.stringify(metaData));
        sendError = metaData.error?.message || 'Meta API call failed';
        return new Response(JSON.stringify({ error: sendError }), {
          status: 400,
          headers: corsHeaders
        });
      }

      waMessageId = metaData.messages?.[0]?.id || null;
    } else {
      console.warn('[whatsapp-send] WA_PHONE_NUMBER_ID or WA_ACCESS_TOKEN not set in secrets. Message logged locally.');
    }

    // 5. Insert into whatsapp_messages table
    const { data: insertedMsg, error: insertErr } = await supabase
      .from('whatsapp_messages')
      .insert({
        contact_id: targetContactId,
        wa_message_id: waMessageId,
        direction: 'outbound',
        source: 'admin',
        type: templateId || templateName ? 'template' : 'text',
        content: messageContent,
        raw_payload: metaPayload,
        status: sendError ? 'failed' : 'sent',
        error: sendError
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        success: true,
        data: insertedMsg,
        waMessageId
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[whatsapp-send] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
