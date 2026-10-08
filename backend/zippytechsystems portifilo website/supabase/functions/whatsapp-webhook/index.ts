import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  formatINR,
  validateAndCleanPhone,
  buildWhatsAppUrl,
  buildKnowledge,
  buildSystemPrompt
} from '../_shared/knowledgeBuilder.ts';

// =========================================================================
// HMAC-SHA256 SIGNATURE VERIFICATION
// =========================================================================
async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined
): Promise<boolean> {
  if (!appSecret) {
    // If WA_APP_SECRET is not yet set in environment, allow with warning
    console.warn('[WA-Webhook] WA_APP_SECRET not set; skipping signature verification.');
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signatureHeader.slice(7).toLowerCase();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const actualHash = Array.from(new Uint8Array(signedBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return actualHash === expectedSignature;
}

// =========================================================================
// META GRAPH API SENDER HELPERS
// =========================================================================
async function sendWhatsAppApi(
  phoneNumberId: string,
  accessToken: string,
  payload: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[WA-Webhook] Meta API Error:', JSON.stringify(data));
      return { success: false, error: data.error?.message || 'Meta API call failed' };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[WA-Webhook] Meta API fetch exception:', err);
    return { success: false, error: err.message };
  }
}

async function markWhatsAppMessageAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
) {
  try {
    await sendWhatsAppApi(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
  } catch (e) {
    console.warn('[WA-Webhook] Failed to mark message as read:', e);
  }
}

async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
) {
  return await sendWhatsAppApi(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text }
  });
}

async function sendLanguageSelectionButtons(
  phoneNumberId: string,
  accessToken: string,
  to: string
) {
  return await sendWhatsAppApi(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: 'Hello! Please choose your language / దయచేసి మీ భాషను ఎంచుకోండి / कृपया अपनी भाषा चुनें'
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'lang_en', title: 'English' } },
          { type: 'reply', reply: { id: 'lang_te', title: 'తెలుగు' } },
          { type: 'reply', reply: { id: 'lang_hi', title: 'हिन्दी' } }
        ]
      }
    }
  });
}

// =========================================================================
// MAIN WEBHOOK HANDLER
// =========================================================================
serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. GET: Meta Verification Handshake
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expectedToken = Deno.env.get('WA_VERIFY_TOKEN');

    if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
      console.log('[WA-Webhook] Verification handshake successful');
      return new Response(challenge, { status: 200 });
    }

    console.warn('[WA-Webhook] Verification handshake failed. Token mismatch or invalid mode.');
    return new Response('Forbidden', { status: 403 });
  }

  // 2. Reject Non-POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 3. POST: Inbound Messages & Coexistence Echoes
  const signature = req.headers.get('x-hub-signature-256');
  const rawBody = await req.text();
  const appSecret = Deno.env.get('WA_APP_SECRET');

  const isValidSignature = await verifyMetaSignature(rawBody, signature, appSecret);
  if (!isValidSignature) {
    console.error('[WA-Webhook] Invalid HMAC-SHA256 signature from Meta');
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error('[WA-Webhook] Failed to parse JSON body:', err);
    return new Response('Bad Request', { status: 400 });
  }

  // 4. Initialize Supabase Client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
  const phoneNumberId = Deno.env.get('WA_PHONE_NUMBER_ID') || '';
  const accessToken = Deno.env.get('WA_ACCESS_TOKEN') || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('[WA-Webhook] Missing Supabase configuration');
    return new Response('Server configuration error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Execute processing asynchronously to respond fast to Meta (200 OK)
  // while ensuring database persistence and reply dispatch
  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value || {};

        // -------------------------------------------------------------
        // A. COEXISTENCE HANDLING: Phone App Message Echoes
        // (change.field === 'smb_message_echoes' or val.message_echoes)
        // -------------------------------------------------------------
        const isEchoEvent =
          change.field === 'smb_message_echoes' ||
          change.field === 'message_echoes' ||
          Array.isArray(val.message_echoes) ||
          Array.isArray(val.smb_message_echoes);

        const echoList = val.message_echoes || val.smb_message_echoes || (isEchoEvent && val.messages ? val.messages : []);

        if (isEchoEvent && Array.isArray(echoList) && echoList.length > 0) {
          for (const echo of echoList) {
            const recipientPhone = echo.to || echo.recipient_id;
            const echoMsgId = echo.id;
            const echoText = echo.text?.body || (echo.type === 'interactive' ? '[Interactive Reply]' : `[${echo.type || 'message'}]`);

            if (!recipientPhone) continue;

            // Clean recipient phone
            const cleanedRecipient = recipientPhone.replace(/\D/g, '');

            // 1. Find or create contact
            let contactId: number | null = null;
            const { data: existingContact } = await supabase
              .from('whatsapp_contacts')
              .select('id, name')
              .eq('phone', cleanedRecipient)
              .maybeSingle();

            if (existingContact) {
              contactId = existingContact.id;
            } else {
              const { data: newContact } = await supabase
                .from('whatsapp_contacts')
                .insert({
                  phone: cleanedRecipient,
                  status: 'needs_human',
                  opt_in_source: 'whatsapp'
                })
                .select('id')
                .single();
              if (newContact) contactId = newContact.id;
            }

            // 2. Insert message as outbound, source = 'app'
            if (contactId) {
              await supabase.from('whatsapp_messages').upsert(
                {
                  contact_id: contactId,
                  wa_message_id: echoMsgId,
                  direction: 'outbound',
                  source: 'app',
                  type: 'text',
                  content: echoText,
                  raw_payload: echo,
                  status: 'sent'
                },
                { onConflict: 'wa_message_id' }
              );

              // 3. Read configured pause hours from settings
              const { data: settingsRow } = await supabase
                .from('settings')
                .select('human_pause_hours')
                .eq('id', 1)
                .maybeSingle();

              const pauseHours = Math.max(1, Number(settingsRow?.human_pause_hours) || 2);
              const pausedUntil = new Date(Date.now() + pauseHours * 60 * 60 * 1000).toISOString();

              // 4. Pause the AI for this contact
              await supabase
                .from('whatsapp_contacts')
                .update({
                  ai_paused_until: pausedUntil,
                  status: 'needs_human',
                  updated_at: new Date().toISOString()
                })
                .eq('id', contactId);

              console.log(
                `[WA-Webhook] Coexistence echo: Founder replied from phone app. AI paused for ${cleanedRecipient} for ${pauseHours} hours (until ${pausedUntil}).`
              );
            }
          }
          // Echo handled; skip generating an AI response
          continue;
        }

        // -------------------------------------------------------------
        // B. MESSAGE STATUS UPDATES (sent, delivered, read, failed)
        // -------------------------------------------------------------
        if (Array.isArray(val.statuses)) {
          for (const statusObj of val.statuses) {
            const waId = statusObj.id;
            const newStatus = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
            const errorDetails = statusObj.errors ? JSON.stringify(statusObj.errors) : null;

            await supabase
              .from('whatsapp_messages')
              .update({
                status: newStatus,
                error: errorDetails
              })
              .eq('wa_message_id', waId);
          }
        }

        // -------------------------------------------------------------
        // C. INBOUND MESSAGES FROM CUSTOMERS
        // -------------------------------------------------------------
        if (Array.isArray(val.messages)) {
          for (const message of val.messages) {
            const customerPhone = message.from?.replace(/\D/g, '');
            const waMessageId = message.id;
            const profileName = val.contacts?.[0]?.profile?.name || '';
            const msgType = message.type;

            if (!customerPhone || !waMessageId) continue;

            // 1. Deduplication check: Has this message already been processed?
            const { data: existingMsg } = await supabase
              .from('whatsapp_messages')
              .select('id')
              .eq('wa_message_id', waMessageId)
              .maybeSingle();

            if (existingMsg) {
              console.log(`[WA-Webhook] Message ${waMessageId} already processed. Skipping duplicate.`);
              continue;
            }

            // 2. Fetch or create contact in whatsapp_contacts
            let contact: any = null;
            let isNewContact = false;

            const { data: foundContact } = await supabase
              .from('whatsapp_contacts')
              .select('*')
              .eq('phone', customerPhone)
              .maybeSingle();

            if (foundContact) {
              contact = foundContact;
              // Update last message timestamp and name if newly available
              await supabase
                .from('whatsapp_contacts')
                .update({
                  last_customer_message_at: new Date().toISOString(),
                  name: profileName || foundContact.name,
                  updated_at: new Date().toISOString()
                })
                .eq('id', foundContact.id);
            } else {
              isNewContact = true;
              const { data: createdContact } = await supabase
                .from('whatsapp_contacts')
                .insert({
                  phone: customerPhone,
                  name: profileName,
                  language: 'en',
                  status: 'active',
                  opted_out: false,
                  opt_in_source: 'whatsapp',
                  last_customer_message_at: new Date().toISOString()
                })
                .select('*')
                .single();
              contact = createdContact;
            }

            // 3. Mark message as read on WhatsApp
            if (phoneNumberId && accessToken) {
              markWhatsAppMessageAsRead(phoneNumberId, accessToken, waMessageId);
            }

            // 4. Resolve message text content
            let userText = '';
            let isButtonReply = false;
            let selectedButtonId = '';

            if (msgType === 'text') {
              userText = message.text?.body?.trim() || '';
            } else if (msgType === 'interactive') {
              if (message.interactive?.type === 'button_reply') {
                isButtonReply = true;
                selectedButtonId = message.interactive.button_reply?.id || '';
                userText = message.interactive.button_reply?.title || '';
              } else if (message.interactive?.type === 'list_reply') {
                userText = message.interactive.list_reply?.title || '';
              }
            } else {
              // Media or unsupported type (audio, image, document, location, etc.)
              userText = `[Customer sent ${msgType || 'media'}]`;
            }

            // 5. Save incoming message to whatsapp_messages
            await supabase.from('whatsapp_messages').insert({
              contact_id: contact.id,
              wa_message_id: waMessageId,
              direction: 'inbound',
              source: 'customer',
              type: msgType || 'text',
              content: userText,
              raw_payload: message,
              status: 'received'
            });

            // 6. Handle Opt-out / Unsubscribe
            const normalizedText = userText.toLowerCase().trim();
            if (['stop', 'unsubscribe', 'ఆపండి', 'रोकें', 'cancel'].includes(normalizedText)) {
              await supabase
                .from('whatsapp_contacts')
                .update({
                  opted_out: true,
                  status: 'opted_out',
                  updated_at: new Date().toISOString()
                })
                .eq('id', contact.id);

              const optOutReply = 'You have successfully opted out. We will not send you automated messages. To resume chatting, send "START" anytime.';
              if (phoneNumberId && accessToken) {
                await sendTextMessage(phoneNumberId, accessToken, customerPhone, optOutReply);
                await supabase.from('whatsapp_messages').insert({
                  contact_id: contact.id,
                  direction: 'outbound',
                  source: 'bot',
                  type: 'text',
                  content: optOutReply,
                  status: 'sent'
                });
              }
              continue;
            }

            // 7. Check Guardrails: Opted Out, Needs Human, AI Paused, or Bot Disabled
            const nowTime = Date.now();
            const pausedUntilTime = contact.ai_paused_until ? new Date(contact.ai_paused_until).getTime() : 0;
            const isPaused = pausedUntilTime > nowTime;

            if (contact.opted_out) {
              console.log(`[WA-Webhook] Contact ${customerPhone} is opted out. AI reply suppressed.`);
              continue;
            }

            if (contact.status === 'needs_human') {
              console.log(`[WA-Webhook] Contact ${customerPhone} status is needs_human. AI reply suppressed.`);
              continue;
            }

            if (isPaused) {
              console.log(
                `[WA-Webhook] AI paused for ${customerPhone} until ${contact.ai_paused_until}. AI reply suppressed.`
              );
              continue;
            }

            // Fetch live settings to verify if WhatsApp Bot is enabled
            const { data: liveSettings } = await supabase
              .from('settings')
              .select('*')
              .eq('id', 1)
              .maybeSingle();

            if (liveSettings && liveSettings.whatsapp_bot_enabled === false) {
              console.log('[WA-Webhook] whatsapp_bot_enabled is false in settings. AI reply suppressed.');
              continue;
            }

            // 8. First-time Contact: Send Trilingual Greeting with Quick Reply Buttons
            if (isNewContact && (!isButtonReply || !selectedButtonId.startsWith('lang_'))) {
              if (phoneNumberId && accessToken) {
                const buttonRes = await sendLanguageSelectionButtons(phoneNumberId, accessToken, customerPhone);
                const buttonMsgId = buttonRes.data?.messages?.[0]?.id || null;

                await supabase.from('whatsapp_messages').insert({
                  contact_id: contact.id,
                  wa_message_id: buttonMsgId,
                  direction: 'outbound',
                  source: 'bot',
                  type: 'interactive',
                  content: 'Hello! Please choose your language / దయచేసి మీ భాషను ఎంచుకోండి / कृपया अपनी भाषा चुनें',
                  status: 'sent'
                });
              }
              continue;
            }

            // 9. Handle Language Selection Button Reply
            if (isButtonReply && selectedButtonId.startsWith('lang_')) {
              let chosenLang: 'en' | 'te' | 'hi' = 'en';
              let langWelcome = '';

              if (selectedButtonId === 'lang_te') {
                chosenLang = 'te';
                langWelcome = 'నమస్కారం! భాష తెలుగుగా మార్చబడింది. ZippyTechSystems వెబ్ డెవలప్‌మెంట్, మొబైల్ యాప్‌లు మరియు AI ఆటోమేషన్ సేవలు అందిస్తుంది. మీకు ఏ వివరాలు కావాలి?';
              } else if (selectedButtonId === 'lang_hi') {
                chosenLang = 'hi';
                langWelcome = 'नमस्ते! भाषा हिन्दी सेट कर दी गई है। ZippyTechSystems वेब डेवलपमेंट, मोबाइल ऐप्स और AI ऑटोमेशन समाधान प्रदान करता है। आज आपकी क्या सहायता कर सकता हूँ?';
              } else {
                chosenLang = 'en';
                langWelcome = 'Welcome to ZippyTechSystems! How can I help you today? Ask me about our Web Development, App Development, AI Automation services, or package pricing.';
              }

              await supabase
                .from('whatsapp_contacts')
                .update({ language: chosenLang, updated_at: new Date().toISOString() })
                .eq('id', contact.id);

              if (phoneNumberId && accessToken) {
                const replyRes = await sendTextMessage(phoneNumberId, accessToken, customerPhone, langWelcome);
                const replyMsgId = replyRes.data?.messages?.[0]?.id || null;

                await supabase.from('whatsapp_messages').insert({
                  contact_id: contact.id,
                  wa_message_id: replyMsgId,
                  direction: 'outbound',
                  source: 'bot',
                  type: 'text',
                  content: langWelcome,
                  status: 'sent'
                });
              }
              continue;
            }

            // 10. Handle Unsupported Media Types (Graceful fallback)
            if (msgType !== 'text' && msgType !== 'interactive') {
              const mediaNote = 'Thank you for sharing. Our AI handles text messages. Founder Lingaswamy will review your attachment and reply directly.';
              if (phoneNumberId && accessToken) {
                await sendTextMessage(phoneNumberId, accessToken, customerPhone, mediaNote);
                await supabase.from('whatsapp_messages').insert({
                  contact_id: contact.id,
                  direction: 'outbound',
                  source: 'bot',
                  type: 'text',
                  content: mediaNote,
                  status: 'sent'
                });
              }
              continue;
            }

            // 11. Generate AI Response via Claude & Shared Knowledge Module
            if (!anthropicApiKey) {
              console.warn('[WA-Webhook] ANTHROPIC_API_KEY is not set. Sending fallback contact text.');
              const fallbackReply = `Hi! Thanks for messaging ZippyTechSystems. Founder Lingaswamy will contact you shortly on WhatsApp.`;
              if (phoneNumberId && accessToken) {
                await sendTextMessage(phoneNumberId, accessToken, customerPhone, fallbackReply);
              }
              continue;
            }

            // A. Fetch Fresh Database Knowledge (Live on every request, zero hardcoded prices)
            const [
              { data: domains },
              { data: services },
              { data: packages },
              { data: projects },
              { data: faqs },
              { data: serviceAreas },
              { data: chatbotSettings }
            ] = await Promise.all([
              supabase.from('domains').select('*').order('sort_order', { ascending: true }),
              supabase.from('services').select('*').order('sort_order', { ascending: true }),
              supabase.from('packages').select('*').order('sort_order', { ascending: true }),
              supabase.from('projects').select('*').order('sort_order', { ascending: true }),
              supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
              supabase.from('service_areas').select('*').order('sort_order', { ascending: true }),
              supabase.from('chatbot_settings').select('*').eq('id', 1).maybeSingle()
            ]);

            const knowledgeText = buildKnowledge({
              domains: domains || [],
              services: services || [],
              packages: packages || [],
              projects: projects || [],
              faqs: faqs || [],
              serviceAreas: serviceAreas || [],
              settings: liveSettings || {}
            });

            const founderName = liveSettings?.founder_name || 'Lingaswamy Maddeboina';
            const businessWa = liveSettings?.whatsapp_number || '6302690251';

            const userLang = contact.language || 'en';
            const langInstruction =
              userLang === 'te'
                ? 'CRITICAL: The customer preferred language is TELUGU (తెలుగు). Reply strictly in conversational Telugu using Telugu script.'
                : userLang === 'hi'
                ? 'CRITICAL: The customer preferred language is HINDI (हिन्दी). Reply strictly in conversational Hindi using Devanagari script.'
                : 'Reply in clear, professional, friendly English.';

            const systemPrompt = buildSystemPrompt(knowledgeText, {
              channel: 'whatsapp',
              founderName,
              whatsappNumber: businessWa,
              extraInstructions: `${langInstruction}\n${chatbotSettings?.extra_instructions || ''}`
            });

            // B. Fetch Recent Chat History from whatsapp_messages (last 8 messages)
            const { data: recentMessages } = await supabase
              .from('whatsapp_messages')
              .select('direction, content')
              .eq('contact_id', contact.id)
              .order('created_at', { ascending: true })
              .limit(8);

            const claudeMessages: any[] = (recentMessages || []).map((m: any) => ({
              role: m.direction === 'inbound' ? 'user' : 'assistant',
              content: m.content
            }));

            // Ensure last message is the current userText
            if (
              claudeMessages.length === 0 ||
              claudeMessages[claudeMessages.length - 1].role !== 'user'
            ) {
              claudeMessages.push({ role: 'user', content: userText });
            }

            // C. Tool definition: save_lead
            const tools = [
              {
                name: 'save_lead',
                description:
                  'Saves a prospective customer lead into the database when the customer has expressed interest in a quote, project, or callback, or has provided their name.',
                input_schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Customer name' },
                    interested_service: {
                      type: 'string',
                      description: 'Interested service or domain (Web Development, App Development, or AI Automation)'
                    },
                    notes: { type: 'string', description: 'Brief summary of what the customer is asking for' }
                  },
                  required: ['name']
                }
              }
            ];

            const modelToUse = chatbotSettings?.model || 'claude-haiku-4-5-20251001';

            // D. Call Anthropic API
            const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                model: modelToUse,
                max_tokens: 350,
                temperature: 0.3,
                system: systemPrompt,
                messages: claudeMessages,
                tools
              })
            });

            if (!anthropicRes.ok) {
              const errBody = await anthropicRes.text();
              console.error('[WA-Webhook] Anthropic API Error:', errBody);
              continue;
            }

            const anthropicData = await anthropicRes.json();
            let assistantReply = '';
            let toolUseBlock: any = null;

            for (const block of anthropicData.content || []) {
              if (block.type === 'text') {
                assistantReply += block.text;
              } else if (block.type === 'tool_use' && block.name === 'save_lead') {
                toolUseBlock = block;
              }
            }

            // E. Handle Tool Call: save_lead
            if (toolUseBlock) {
              const leadInput = toolUseBlock.input || {};
              const leadName = leadInput.name || contact.name || 'WhatsApp Customer';
              const leadService = leadInput.interested_service || 'WhatsApp Enquiry';
              const leadNotes = leadInput.notes || userText;

              // Check 7-day deduplication window for this phone number
              const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
              const { data: existingLead } = await supabase
                .from('enquiries')
                .select('id, notes')
                .eq('phone', customerPhone)
                .gte('created_at', sevenDaysAgo)
                .maybeSingle();

              let savedEnquiryId: number | null = null;
              if (existingLead) {
                // Update existing lead notes
                await supabase
                  .from('enquiries')
                  .update({
                    service: leadService,
                    notes: `${existingLead.notes || ''} | [WA Follow-up]: ${leadNotes}`.trim(),
                    status: 'New'
                  })
                  .eq('id', existingLead.id);
                savedEnquiryId = existingLead.id;
              } else {
                // Insert new enquiry
                const { data: newEnquiry } = await supabase
                  .from('enquiries')
                  .insert({
                    name: leadName,
                    phone: customerPhone,
                    service: leadService,
                    notes: leadNotes,
                    source: 'whatsapp',
                    whatsapp_opt_in: true,
                    status: 'New'
                  })
                  .select('id')
                  .single();
                if (newEnquiry) savedEnquiryId = newEnquiry.id;
              }

              // Update contact name if provided
              if (leadName && leadName !== 'WhatsApp Customer') {
                await supabase
                  .from('whatsapp_contacts')
                  .update({ name: leadName })
                  .eq('id', contact.id);
              }

              // Trigger background notify-enquiry
              try {
                supabase.functions.invoke('notify-enquiry', {
                  body: {
                    enquiry: {
                      id: savedEnquiryId,
                      name: leadName,
                      phone: customerPhone,
                      service: leadService,
                      notes: leadNotes,
                      source: 'whatsapp'
                    }
                  }
                }).catch((e: any) => console.warn('[WA-Webhook] Background notify-enquiry dispatch:', e));
              } catch (bgErr) {
                console.warn('[WA-Webhook] Background alert dispatch error:', bgErr);
              }

              // Second turn with Claude to produce conversational confirmation
              const secondTurnMessages = [
                ...claudeMessages,
                { role: 'assistant', content: anthropicData.content },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: toolUseBlock.id,
                      content: JSON.stringify({ success: true, enquiry_id: savedEnquiryId })
                    }
                  ]
                }
              ];

              const secondRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'x-api-key': anthropicApiKey,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelToUse,
                  max_tokens: 250,
                  temperature: 0.3,
                  system: systemPrompt,
                  messages: secondTurnMessages
                })
              });

              if (secondRes.ok) {
                const secondData = await secondRes.json();
                assistantReply = secondData.content
                  ?.filter((b: any) => b.type === 'text')
                  .map((b: any) => b.text)
                  .join('') || assistantReply;
              }
            }

            // F. Send Claude reply back to WhatsApp
            if (assistantReply.trim() && phoneNumberId && accessToken) {
              const sendRes = await sendTextMessage(
                phoneNumberId,
                accessToken,
                customerPhone,
                assistantReply.trim()
              );

              const outWaMsgId = sendRes.data?.messages?.[0]?.id || null;

              await supabase.from('whatsapp_messages').insert({
                contact_id: contact.id,
                wa_message_id: outWaMsgId,
                direction: 'outbound',
                source: 'bot',
                type: 'text',
                content: assistantReply.trim(),
                status: 'sent'
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[WA-Webhook] Error during webhook processing:', err);
  }

  // Meta expects an immediate 200 HTTP response
  return new Response('EVENT_RECEIVED', { status: 200 });
});
