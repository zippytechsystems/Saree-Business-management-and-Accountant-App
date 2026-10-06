import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestPayload {
  session_id: string;
  messages: ChatMessage[];
  page_url?: string;
  channel?: 'text' | 'voice';
}

// =========================================================================
// CORS RESOLVER
// =========================================================================
function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || '';
  const configuredOrigins = allowedOriginsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  let allowOrigin = '*';

  if (origin) {
    const isLocalhost =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');
    const isNetlify = origin.endsWith('.netlify.app');
    const isExplicitlyAllowed = configuredOrigins.includes(origin);

    if (isLocalhost || isNetlify || isExplicitlyAllowed) {
      allowOrigin = origin;
    } else if (configuredOrigins.length > 0) {
      allowOrigin = configuredOrigins[0];
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

import {
  formatINR,
  validateAndCleanPhone,
  buildWhatsAppUrl,
  buildKnowledge,
  buildSystemPrompt
} from '../_shared/knowledgeBuilder.ts';


serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  // Safe fallback state (no module-level persistent cache)
  let fallbackMessage =
    'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized consultation and pricing!';
  let whatsappNumber = '';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase service configuration missing in Edge Function');
      return new Response(
        JSON.stringify({
          reply: fallbackMessage,
          whatsapp_url: buildWhatsAppUrl(whatsappNumber, 'Hi Lingaswamy, I would like to get a quote.')
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Parse and Validate Request Payload
    let payload: RequestPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { session_id, messages = [], page_url = '', channel = 'text' } = payload;
    const isVoice = channel === 'voice';

    if (!session_id || typeof session_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Cap conversation history at last 20 messages, max 1000 characters each
    const sanitizedMessages: ChatMessage[] = messages
      .slice(-20)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').trim().slice(0, 1000)
      }))
      .filter((m) => m.content.length > 0);

    if (sanitizedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid messages provided' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1];

    // 2. Fetch fresh database data on EVERY request (NO caching - strictly queried fresh)
    const [
      settingsRes,
      chatbotSettingsRes,
      domainsRes,
      servicesRes,
      packagesRes,
      projectsRes,
      faqsRes,
      serviceAreasRes
    ] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('chatbot_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('domains').select('id, key, name, intro, starting_price, price_label, sort_order, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('services').select('id, domain_id, name, description, type, sort_order, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('packages').select('id, domain_id, name, price, features, is_popular, sort_order, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('projects').select('id, title, domain_id, description, sort_order, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('faqs').select('id, question, answer, sort_order, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('service_areas').select('id, name, notes, sort_order, is_active').eq('is_active', true).order('sort_order')
    ]);

    const settings = settingsRes.data || {};
    const chatbotSettings = chatbotSettingsRes.data || {};
    const domains = domainsRes.data || [];
    const services = servicesRes.data || [];
    const packages = packagesRes.data || [];
    const projects = projectsRes.data || [];
    const faqs = faqsRes.data || [];
    const serviceAreas = serviceAreasRes.data || [];

    // Prioritize live WhatsApp number from settings
    if (settings.whatsapp_number?.trim()) {
      whatsappNumber = settings.whatsapp_number.trim();
    } else if (settings.phone?.trim()) {
      whatsappNumber = settings.phone.trim();
    }

    if (chatbotSettings.fallback_message) {
      fallbackMessage = chatbotSettings.fallback_message;
    }

    // 3. Check if Chatbot is enabled
    if (chatbotSettings.enabled === false) {
      return new Response(
        JSON.stringify({
          reply: fallbackMessage,
          disabled: true,
          whatsapp_url: buildWhatsAppUrl(
            whatsappNumber,
            `Hi Lingaswamy, I visited ZippyTechSystems and would like to ask a question.`
          )
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 4. Rate Limiting (Computed from chat_messages: max 20 messages in last 10 mins per session)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: sessionRecentCount, error: countErr } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .gte('created_at', tenMinutesAgo);

    if (!countErr && typeof sessionRecentCount === 'number' && sessionRecentCount >= 20) {
      const rateLimitReply =
        "You have sent several questions in a short period! To serve you best, please connect directly with founder Lingaswamy on WhatsApp for instant assistance.";
      return new Response(
        JSON.stringify({
          reply: rateLimitReply,
          rate_limited: true,
          whatsapp_url: buildWhatsAppUrl(
            whatsappNumber,
            `Hi Lingaswamy, I reached the chatbot rate limit and would like to ask my question directly.`
          )
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 5. Daily Cap (Computed from chat_messages: role = 'assistant' in last 24h)
    const dailyLimit = chatbotSettings.daily_limit || 500;
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const { count: todayAssistantCount } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'assistant')
      .gte('created_at', startOfToday.toISOString());

    if (
      typeof todayAssistantCount === 'number' &&
      todayAssistantCount >= dailyLimit
    ) {
      return new Response(
        JSON.stringify({
          reply: fallbackMessage,
          daily_capped: true,
          whatsapp_url: buildWhatsAppUrl(
            whatsappNumber,
            `Hi Lingaswamy, I'd like to enquire about your digital services.`
          )
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 6. Upsert Session Record
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      '';

    await supabase.from('chat_sessions').upsert(
      {
        session_id,
        last_message_at: new Date().toISOString(),
        page_url: page_url.slice(0, 255),
        ip_hash: clientIp ? await hashString(clientIp) : ''
      },
      { onConflict: 'session_id' }
    );

    // Save current incoming user message to database
    if (lastUserMessage.role === 'user') {
      await supabase.from('chat_messages').insert({
        session_id,
        role: 'user',
        content: lastUserMessage.content,
        channel: isVoice ? 'voice' : 'text'
      });
    }

    // 7. Verify Anthropic API Key presence
    if (!anthropicApiKey) {
      console.warn('ANTHROPIC_API_KEY secret is not set in Supabase');
      return new Response(
        JSON.stringify({
          reply: fallbackMessage,
          whatsapp_url: buildWhatsAppUrl(
            whatsappNumber,
            `Hi Lingaswamy, I am looking for software development / AI automation services.`
          )
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 8. Build Dynamic System Prompt with Live Database Info (Zero Hardcoded Prices/Services/Contact)
    const knowledgeText = buildKnowledge({
      domains,
      services,
      packages,
      projects,
      faqs,
      serviceAreas,
      settings
    });

    const founderName = settings.founder_name || 'Lingaswamy Maddeboina';
    const systemPrompt = buildSystemPrompt(knowledgeText, {
      channel: isVoice ? 'voice' : 'text',
      founderName,
      whatsappNumber,
      extraInstructions: chatbotSettings.extra_instructions
    });

    // 9. Claude Tool Definition for Lead Capture
    const tools = [
      {
        name: 'save_lead',
        description:
          'Saves a prospective customer lead into the database when the user has provided their name and 10-digit mobile number.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Customer name'
            },
            phone: {
              type: 'string',
              description: 'Customer 10-digit Indian phone number'
            },
            interested_service: {
              type: 'string',
              description:
                'Domain or service the customer is interested in (Web Development, App Development, or AI Automation)'
            },
            notes: {
              type: 'string',
              description: 'Brief summary of the customer enquiry or requirements'
            }
          },
          required: ['name', 'phone']
        }
      }
    ];

    // 10. Call Anthropic Messages API
    const modelToUse =
      chatbotSettings.model ||
      Deno.env.get('CHAT_MODEL') ||
      'claude-haiku-4-5-20251001';

    let claudeMessages: any[] = sanitizedMessages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    let anthropicResponse = await callAnthropic(
      anthropicApiKey,
      modelToUse,
      systemPrompt,
      claudeMessages,
      tools
    );

    let assistantText = '';
    let toolUseBlock = anthropicResponse?.content?.find(
      (b: any) => b.type === 'tool_use' && b.name === 'save_lead'
    );

    // If Claude called save_lead tool
    if (toolUseBlock) {
      const toolInput = toolUseBlock.input || {};
      const rawName = String(toolInput.name || '').trim();
      const rawPhone = String(toolInput.phone || '').trim();
      const interestedService = String(toolInput.interested_service || 'Chatbot Enquiry').trim();
      const notes = String(toolInput.notes || '').trim();

      const validPhone = validateAndCleanPhone(rawPhone);

      let toolResult: any;

      if (!validPhone) {
        toolResult = {
          success: false,
          error: 'Please provide a valid 10-digit Indian mobile number.'
        };
      } else {
        // Save lead in enquiries table
        const { data: leadData, error: leadErr } = await supabase
          .from('enquiries')
          .insert({
            name: rawName || 'Chatbot Lead',
            phone: validPhone,
            service: interestedService,
            message: notes ? `Chatbot Note: ${notes}` : 'Captured via AI Chatbot',
            source: 'chatbot',
            status: 'New'
          })
          .select('id')
          .single();

        if (leadErr) {
          console.error('Lead save error:', leadErr);
          toolResult = {
            success: false,
            error: 'Failed to record lead in database.'
          };
        } else {
          // Link lead to chat session
          if (leadData?.id) {
            await supabase
              .from('chat_sessions')
              .update({ lead_id: leadData.id })
              .eq('session_id', session_id);
          }
          toolResult = {
            success: true,
            message: `Lead recorded successfully for ${rawName}. Tell the customer that Lingaswamy has received their enquiry and will reach out shortly.`
          };
        }
      }

      // Feed tool result back to Claude for closing response
      claudeMessages.push({
        role: 'assistant',
        content: anthropicResponse.content
      });

      claudeMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult)
          }
        ]
      });

      const followUpResponse = await callAnthropic(
        anthropicApiKey,
        modelToUse,
        systemPrompt,
        claudeMessages,
        tools
      );

      assistantText = extractTextFromContent(followUpResponse?.content);
    } else {
      assistantText = extractTextFromContent(anthropicResponse?.content);
    }

    if (!assistantText) {
      assistantText = fallbackMessage;
    }

    // 11. Save Assistant Reply to chat_messages with channel
    await supabase.from('chat_messages').insert({
      session_id,
      role: 'assistant',
      content: assistantText,
      channel: isVoice ? 'voice' : 'text'
    });

    // 12. Create WhatsApp Handoff URL with summary
    const conversationSummary = `Hi Lingaswamy, I was using the AI Chatbot on your website regarding: ${lastUserMessage.content.slice(0, 80)}`;
    const finalWhatsAppUrl = buildWhatsAppUrl(whatsappNumber, conversationSummary);

    return new Response(
      JSON.stringify({
        reply: assistantText,
        whatsapp_url: finalWhatsAppUrl
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    // Edge Function must NEVER return stack traces
    console.error('Edge Function runtime error:', err);

    return new Response(
      JSON.stringify({
        reply: fallbackMessage,
        fallback: true,
        whatsapp_url: buildWhatsAppUrl(
          whatsappNumber,
          'Hi Lingaswamy, I visited ZippyTechSystems and would like to ask a question.'
        )
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});

// Helper: Call Anthropic API
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: any[],
  tools: any[]
): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 450,
      system: systemPrompt,
      messages,
      tools
    })
  });

  if (!resp.ok) {
    const errorBody = await resp.text();
    console.error(`Anthropic API error [${resp.status}]:`, errorBody);
    throw new Error(`Anthropic API request failed with status ${resp.status}`);
  }

  return await resp.json();
}

// Helper: Extract text from Anthropic response content blocks
function extractTextFromContent(contentBlocks: any[]): string {
  if (!Array.isArray(contentBlocks)) return '';
  return contentBlocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

// Helper: Fast SHA-256 for IP anonymization
async function hashString(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
