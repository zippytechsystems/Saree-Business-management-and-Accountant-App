import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID') || '';
const WA_ACCESS_TOKEN = Deno.env.get('WA_ACCESS_TOKEN') || '';

function isQuietHours(startStr: string, endStr: string): boolean {
  try {
    const now = new Date();
    // Get current time in Asia/Kolkata (IST)
    const istTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [currH, currM] = istTimeStr.split(':').map(Number);
    const currentMins = currH * 60 + currM;

    const [startH, startM] = (startStr || '22:00').split(':').map(Number);
    const startMins = startH * 60 + startM;

    const [endH, endM] = (endStr || '08:00').split(':').map(Number);
    const endMins = endH * 60 + endM;

    if (startMins > endMins) {
      // Overnight (e.g. 22:00 to 08:00)
      return currentMins >= startMins || currentMins < endMins;
    } else {
      return currentMins >= startMins && currentMins < endMins;
    }
  } catch (e) {
    console.error('Quiet hours check failed, defaulting to false:', e);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch settings for toggles and quiet hours
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const quietStart = settings?.quiet_hours_start || '22:00';
    const quietEnd = settings?.quiet_hours_end || '08:00';
    const inQuietHours = isQuietHours(quietStart, quietEnd);

    if (inQuietHours) {
      console.log(`Quiet hours active (${quietStart} - ${quietEnd} IST). Deferring non-critical automations.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Quiet hours active (${quietStart} - ${quietEnd} IST). Queue execution postponed.`,
          quiet_hours: true
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp credentials (WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN) not set in environment.'
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Fetch pending queue items
    const nowIso = new Date().toISOString();
    const { data: queueItems, error: fetchErr } = await supabase
      .from('whatsapp_automation_queue')
      .select('*, whatsapp_contacts(*), whatsapp_templates(*)')
      .eq('status', 'pending')
      .lte('run_at', nowIso)
      .order('run_at', { ascending: true })
      .limit(20);

    if (fetchErr) {
      throw fetchErr;
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'Queue is empty' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    for (const item of queueItems) {
      processedCount++;
      const contact = item.whatsapp_contacts;
      const payload = item.payload || {};
      const recipientPhone = payload.phone || contact?.phone;

      // Check opt-out
      if (contact?.opted_out) {
        await supabase
          .from('whatsapp_automation_queue')
          .update({ status: 'cancelled', error: 'Contact has opted out' })
          .eq('id', item.id);
        continue;
      }

      if (!recipientPhone) {
        await supabase
          .from('whatsapp_automation_queue')
          .update({ status: 'failed', error: 'No recipient phone number' })
          .eq('id', item.id);
        failCount++;
        continue;
      }

      const cleanPhone = String(recipientPhone).replace(/\D/g, '');
      const to = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      // Mark processing
      await supabase
        .from('whatsapp_automation_queue')
        .update({
          status: 'processing',
          attempts: (item.attempts || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      try {
        let metaBody: any = null;
        let loggedContent = '';
        const lang = contact?.language || 'en';

        if (item.kind === 'enquiry_confirmation') {
          // Send official template: enquiry_confirmation
          const customerName = payload.name || contact?.name || 'Customer';
          const serviceName = payload.service || 'Digital Solutions';
          loggedContent = `Hi ${customerName}, thank you for contacting ZippyTechSystems Pvt. Ltd. We have received your enquiry for ${serviceName} and will contact you within 24 hours.`;

          metaBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
              name: 'enquiry_confirmation',
              language: { code: lang },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: customerName },
                    { type: 'text', text: serviceName }
                  ]
                }
              ]
            }
          };
        } else if (item.kind === 'follow_up') {
          const customerName = payload.name || contact?.name || 'Customer';
          const serviceName = payload.service || 'your project';
          loggedContent = `Hi ${customerName}, this is Lingaswamy from ZippyTechSystems. Following up on your enquiry for ${serviceName}. Would you like to schedule a quick call today?`;

          metaBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
              name: 'follow_up',
              language: { code: lang },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: customerName },
                    { type: 'text', text: serviceName }
                  ]
                }
              ]
            }
          };
        } else if (item.kind === 'status_update') {
          const customerName = payload.name || contact?.name || 'Customer';
          loggedContent = `Hi ${customerName}, thank you for choosing ZippyTechSystems. Your project consultation is confirmed.`;

          metaBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
              name: 'thank_you',
              language: { code: lang },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: customerName }]
                }
              ]
            }
          };
        } else {
          // Custom / generic notification fallback
          loggedContent = payload.message || 'Notification from ZippyTechSystems';
          metaBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: loggedContent }
          };
        }

        // Send via Meta Graph API
        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${WA_ACCESS_TOKEN}`
            },
            body: JSON.stringify(metaBody)
          }
        );

        const metaData = await metaRes.json();

        if (metaRes.ok && metaData.messages?.[0]?.id) {
          const waMsgId = metaData.messages[0].id;

          // Record in whatsapp_messages
          if (contact?.id) {
            await supabase.from('whatsapp_messages').insert({
              contact_id: contact.id,
              wa_message_id: waMsgId,
              direction: 'outbound',
              source: 'automation',
              type: metaBody.type || 'template',
              content: loggedContent,
              raw_payload: metaData,
              status: 'sent'
            });
          }

          // Mark queue item as sent
          await supabase
            .from('whatsapp_automation_queue')
            .update({
              status: 'sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          successCount++;
        } else {
          const errMsg = JSON.stringify(metaData?.error || metaData);
          console.error(`Meta API error sending queue item ${item.id}:`, errMsg);

          const maxAttempts = item.max_attempts || 3;
          const currentAttempts = (item.attempts || 0) + 1;
          const newStatus = currentAttempts >= maxAttempts ? 'failed' : 'pending';

          await supabase
            .from('whatsapp_automation_queue')
            .update({
              status: newStatus,
              error: errMsg,
              run_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // retry in 15 min
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          failCount++;
        }
      } catch (sendErr: any) {
        console.error(`Error processing queue item ${item.id}:`, sendErr);
        await supabase
          .from('whatsapp_automation_queue')
          .update({
            status: 'failed',
            error: sendErr.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        sent: successCount,
        failed: failCount
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    console.error('Automation runner error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
