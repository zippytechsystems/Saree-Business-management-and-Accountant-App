import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface EnquiryPayload {
  id?: string | number;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  selected_services?: string[] | any;
  notes?: string;
  source?: string;
  whatsapp_opt_in?: boolean;
  honeypot?: string;
  created_at?: string;
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

// HTML escape helper
function escapeHtml(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  // Supabase Service Role client for DB logging & settings lookup
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let enquiry: EnquiryPayload | null = null;

  try {
    const body = await req.json();
    enquiry = body.enquiry || body;

    if (!enquiry || !enquiry.name || !enquiry.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required enquiry details (name, phone).' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Anti-spam honeypot detection
    if (enquiry.honeypot && String(enquiry.honeypot).trim() !== '') {
      console.warn('Spam detected via honeypot field. Dropping enquiry notification.');
      return new Response(JSON.stringify({ success: true, spam: true }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Retrieve settings for notifications
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const responseTimeText = settings?.response_time_text || '24 hours';
    const notifyEmailEnabled = settings?.notify_email_enabled ?? true;

    // Transactional Email Configuration (Resend)
    const emailApiKey = Deno.env.get('EMAIL_API_KEY');
    const adminNotifyEmail =
      Deno.env.get('ADMIN_NOTIFY_EMAIL') ||
      settings?.email ||
      'lingaswamymaddeboina@gmail.com';
    const emailFrom =
      Deno.env.get('EMAIL_FROM') ||
      'ZippyTechSystems <onboarding@resend.dev>';

    const cleanPhone = String(enquiry.phone).replace(/\D/g, '');
    const cleanServices = Array.isArray(enquiry.selected_services)
      ? enquiry.selected_services
      : typeof enquiry.selected_services === 'string'
      ? [enquiry.selected_services]
      : [];

    // -------------------------------------------------------------------------
    // 1. ADMIN EMAIL ALERT VIA RESEND
    // -------------------------------------------------------------------------
    if (emailApiKey && notifyEmailEnabled) {
      try {
        const servicesListHtml =
          cleanServices.length > 0
            ? cleanServices
                .map(
                  (s: string) =>
                    `<li style="margin-bottom: 4px; color: #1e293b;">${escapeHtml(s)}</li>`
                )
                .join('')
            : `<li style="color: #64748b;">${escapeHtml(enquiry.service || 'General Enquiry')}</li>`;

        const adminHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0b1b4a; padding: 24px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">New Customer Enquiry Received</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">ZippyTechSystems Pvt. Ltd. Lead Management</p>
            </div>
            
            <div style="padding: 24px;">
              <div style="background: #f8fafc; border-left: 4px solid #1d5cf0; padding: 14px 18px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${escapeHtml(enquiry.name)}</div>
                <div style="font-size: 14px; color: #475569; margin-top: 4px;">
                  <strong>Phone:</strong> <a href="tel:+91${cleanPhone}" style="color: #1d5cf0; text-decoration: none;">+91 ${cleanPhone}</a>
                  ${enquiry.email ? ` | <strong>Email:</strong> <a href="mailto:${escapeHtml(enquiry.email)}" style="color: #1d5cf0; text-decoration: none;">${escapeHtml(enquiry.email)}</a>` : ''}
                </div>
                <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                  <strong>Source:</strong> ${escapeHtml(enquiry.source || 'contact')} | <strong>Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Selected Services & Scope</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                  ${servicesListHtml}
                </ul>
              </div>

              ${
                enquiry.notes || enquiry.message
                  ? `
                <div style="margin-bottom: 24px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Project Requirements / Message</h4>
                  <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 14px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(enquiry.notes || enquiry.message)}</div>
                </div>
              `
                  : ''
              }

              <!-- Direct Action Buttons -->
              <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
                <a href="tel:+91${cleanPhone}" style="display: inline-block; background: #12a150; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  📞 Call Client Now
                </a>
                <a href="https://wa.me/91${cleanPhone}" style="display: inline-block; background: #1d5cf0; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  💬 Open WhatsApp Chat
                </a>
              </div>
            </div>

            <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              24-Hour Response Target: Please contact this customer within ${escapeHtml(responseTimeText)}.
            </div>
          </div>
        `;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${emailApiKey}`
          },
          body: JSON.stringify({
            from: emailFrom,
            to: adminNotifyEmail,
            subject: `New Lead: ${enquiry.name} (${enquiry.service || 'Website Enquiry'})`,
            html: adminHtml
          })
        });

        if (res.ok) {
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'email_admin',
            recipient: adminNotifyEmail,
            status: 'sent'
          });
        } else {
          const errText = await res.text();
          console.error('Resend admin email error:', errText);
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'email_admin',
            recipient: adminNotifyEmail,
            status: 'failed',
            error_message: errText
          });
        }
      } catch (err: any) {
        console.error('Failed to dispatch admin email:', err);
        await supabase.from('notification_log').insert({
          enquiry_id: enquiry.id || null,
          channel: 'email_admin',
          recipient: adminNotifyEmail,
          status: 'failed',
          error_message: err.message
        });
      }
    } else {
      await supabase.from('notification_log').insert({
        enquiry_id: enquiry.id || null,
        channel: 'email_admin',
        recipient: adminNotifyEmail,
        status: 'skipped',
        error_message: !emailApiKey ? 'EMAIL_API_KEY secret not configured' : 'notify_email_enabled is false'
      });
    }

    // -------------------------------------------------------------------------
    // 2. CUSTOMER CONFIRMATION EMAIL VIA RESEND (IF EMAIL GIVEN)
    // -------------------------------------------------------------------------
    if (emailApiKey && enquiry.email && enquiry.email.includes('@')) {
      try {
        const customerHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0b1b4a; padding: 24px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">ZippyTechSystems Pvt. Ltd.</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Build • Automate • Grow</p>
            </div>
            
            <div style="padding: 24px;">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${escapeHtml(enquiry.name)},</h3>
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Thank you for contacting ZippyTechSystems! We have received your enquiry regarding <strong>${escapeHtml(enquiry.service || 'our digital solutions')}</strong>.
              </p>

              <div style="background: #eff6ff; border-left: 4px solid #1d5cf0; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e3a8a;">
                  We have received your enquiry. We will contact you within ${escapeHtml(responseTimeText)}.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Our founder <strong>Lingaswamy</strong> will review your requirements and reach out to you directly with personalized recommendations and transparent pricing for your business.
              </p>

              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">NEED IMMEDIATE ASSISTANCE?</div>
                <div style="font-size: 14px; color: #1e293b;">
                  You can reach founder Lingaswamy directly anytime on WhatsApp at 
                  <a href="https://wa.me/916302690251" style="color: #12a150; font-weight: 600; text-decoration: none;">+91 63026 90251</a>.
                </div>
              </div>
            </div>

            <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} ZippyTechSystems Pvt. Ltd. | Hyderabad, Telangana, India
            </div>
          </div>
        `;

        const resCust = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${emailApiKey}`
          },
          body: JSON.stringify({
            from: emailFrom,
            to: enquiry.email,
            subject: `We received your enquiry - ZippyTechSystems Pvt. Ltd.`,
            html: customerHtml
          })
        });

        if (resCust.ok) {
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'email_customer',
            recipient: enquiry.email,
            status: 'sent'
          });
        } else {
          const errCust = await resCust.text();
          console.error('Resend customer confirmation email error:', errCust);
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'email_customer',
            recipient: enquiry.email,
            status: 'failed',
            error_message: errCust
          });
        }
      } catch (err: any) {
        console.error('Customer email confirmation dispatch error:', err);
      }
    }

    // -------------------------------------------------------------------------
    // 3. WHATSAPP BUSINESS AUTOMATION & ALERTS (LEVEL 2 - OPTIONAL)
    // -------------------------------------------------------------------------
    const waPhoneId = Deno.env.get('WA_PHONE_NUMBER_ID');
    const waAccessToken = Deno.env.get('WA_ACCESS_TOKEN');
    const rawWaAdminTo = Deno.env.get('WA_ADMIN_TO') || settings?.wa_admin_to || '';
    const cleanWaAdminTo = String(rawWaAdminTo).replace(/\D/g, '');
    
    // Safety check: WA_ADMIN_TO must NOT be the bot's own business number (6302690251)
    const isBotBusinessNumber = cleanWaAdminTo.endsWith('6302690251');
    const validWaAdminTo = (!isBotBusinessNumber && cleanWaAdminTo.length >= 10)
      ? (cleanWaAdminTo.startsWith('91') ? cleanWaAdminTo : `91${cleanWaAdminTo}`)
      : null;

    // A. Customer WhatsApp Auto-Confirmation (Queued to automation runner)
    if (enquiry.whatsapp_opt_in && cleanPhone.length === 10) {
      try {
        const fullCustomerPhone = `91${cleanPhone}`;
        // Upsert customer into whatsapp_contacts
        const { data: contact } = await supabase
          .from('whatsapp_contacts')
          .upsert(
            {
              phone: fullCustomerPhone,
              name: enquiry.name,
              opted_out: false,
              opt_in_source: 'website_form',
              status: 'active',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'phone' }
          )
          .select('id')
          .maybeSingle();

        // If automatic WhatsApp confirmation is enabled in settings, queue it
        if (settings?.whatsapp_auto_confirm) {
          await supabase.from('whatsapp_automation_queue').insert({
            kind: 'enquiry_confirmation',
            enquiry_id: enquiry.id || null,
            contact_id: contact?.id || null,
            payload: {
              name: enquiry.name,
              phone: fullCustomerPhone,
              service: enquiry.service || 'Digital Solutions',
              responseTimeText
            },
            run_at: new Date().toISOString(),
            status: 'pending'
          });
        }
      } catch (waQueueErr) {
        console.error('Failed to register/queue customer WhatsApp automation:', waQueueErr);
      }
    }

    // B. Admin WhatsApp Alert (Optional, OFF by default, skipped silently if WA_ADMIN_TO is empty/invalid/bot-number)
    if (settings?.wa_admin_alert_enabled && validWaAdminTo && waPhoneId && waAccessToken) {
      try {
        const waAlertBody = `🔔 New Lead: ${enquiry.name} (${enquiry.phone})\nService: ${enquiry.service || 'General'}\nSource: ${enquiry.source || 'Website'}\nRequirements: ${enquiry.notes || enquiry.message || 'None'}`;
        
        const adminWaRes = await fetch(
          `https://graph.facebook.com/v19.0/${waPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${waAccessToken}`
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: validWaAdminTo,
              type: 'text',
              text: {
                body: waAlertBody
              }
            })
          }
        );

        if (adminWaRes.ok) {
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'wa_admin',
            recipient: validWaAdminTo,
            status: 'sent'
          });
        } else {
          const errData = await adminWaRes.json().catch(() => ({}));
          const errMsg = JSON.stringify(errData);
          console.warn('Admin WhatsApp alert failed (may be outside 24h window):', errMsg);
          await supabase.from('notification_log').insert({
            enquiry_id: enquiry.id || null,
            channel: 'wa_admin',
            recipient: validWaAdminTo,
            status: 'failed',
            error_message: errMsg
          });
        }
      } catch (adminWaErr: any) {
        console.error('Admin WhatsApp alert error:', adminWaErr);
        await supabase.from('notification_log').insert({
          enquiry_id: enquiry.id || null,
          channel: 'wa_admin',
          recipient: validWaAdminTo,
          status: 'failed',
          error_message: adminWaErr.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enquiry received. We will contact you within ${responseTimeText}.`
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('notify-enquiry top-level handler error:', err);
    // Never fail customer submission on notification service fault
    return new Response(
      JSON.stringify({
        success: true,
        warning: 'Notification processing completed with fallbacks',
        error: err.message
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
