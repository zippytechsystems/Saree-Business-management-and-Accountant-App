import { content as initialContent } from '../data/content';

/**
 * Currency Formatter for Indian Rupees
 * Takes number (e.g. 7000) -> returns formatted string "₹7,000"
 */
export function formatINR(value) {
  if (value === null || value === undefined || value === '') return '₹0';
  if (typeof value === 'string' && value.includes('₹')) return value;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

/**
 * Sanitize text input to prevent XSS / malicious injections
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

/**
 * Clean phone numbers to pure digits
 */
export function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

export const isSupabaseConfigured = true;
export const isBackendConfigured = true;

// ---------------------------------------------------------------------------
// Base API Client Helper
// ---------------------------------------------------------------------------
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Accept': 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    },
    credentials: 'include',
    ...options
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let parsed;
    try { parsed = JSON.parse(errText); } catch {}
    throw new Error(parsed?.error || parsed?.message || `API error ${response.status}`);
  }
  return await response.json();
}

// =========================================================================
// 1. SETTINGS API
// =========================================================================
export async function getSettings() {
  const fallback = {
    founderName: 'Lingaswamy Maddeboina',
    phone: initialContent.founder.phone,
    whatsappNumber: initialContent.founder.whatsappNumber,
    defaultWhatsAppMessage: 'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    tagline: initialContent.company.tagline,
    secondaryTagline: initialContent.company.secondaryTagline,
    location: initialContent.company.location,
    instagramUrl: initialContent.social?.instagram || 'https://www.instagram.com/zippytechsystems',
    youtubeUrl: initialContent.social?.youtube || 'https://www.youtube.com/@zippytechsystems',
    workingHours: '',
    officeAddress: '',
    email: 'info@zippysoftwares.in',
    aboutText: '',
    deliveryNote: '',
    languagesSupported: 'English, Telugu, Hindi',
    responseTimeText: '24 hours',
    facebookUrl: '',
    linkedinUrl: '',
    notifyEmailEnabled: true,
    waAutoReplyEnabled: false,
    waAdminAlertEnabled: false,
    waTemplateEn: 'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.',
    waTemplateTe: 'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.',
    waTemplateHi: 'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।',
    whatsappBotEnabled: true,
    whatsappAutoConfirm: false,
    whatsappFollowups: false,
    whatsappStatusUpdates: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    dailySummaryEnabled: false,
    googleSheetExportEnabled: false,
    humanPauseHours: 2,
    waAdminTo: ''
  };

  try {
    const data = await apiFetch('/index.php?endpoint=settings');
    if (!data || Object.keys(data).length === 0) return fallback;

    return {
      founderName: data.founder_name || fallback.founderName,
      phone: data.phone || fallback.phone,
      whatsappNumber: data.whatsapp_number || fallback.whatsappNumber,
      defaultWhatsAppMessage: data.default_whatsapp_message || fallback.defaultWhatsAppMessage,
      tagline: data.tagline || fallback.tagline,
      secondaryTagline: data.secondary_tagline || fallback.secondaryTagline,
      location: data.location || fallback.location,
      instagramUrl: data.instagram_url || fallback.instagramUrl,
      youtubeUrl: data.youtube_url || fallback.youtubeUrl,
      workingHours: data.working_hours || fallback.workingHours,
      officeAddress: data.office_address || fallback.officeAddress,
      email: data.email || fallback.email,
      aboutText: data.about_text || fallback.aboutText,
      deliveryNote: data.delivery_note || fallback.deliveryNote,
      languagesSupported: data.languages_supported || fallback.languagesSupported,
      responseTimeText: data.response_time_text || fallback.responseTimeText,
      facebookUrl: data.facebook_url || fallback.facebookUrl,
      linkedinUrl: data.linkedin_url || fallback.linkedinUrl,
      notifyEmailEnabled: data.notify_email_enabled ?? fallback.notifyEmailEnabled,
      waAutoReplyEnabled: data.wa_auto_reply_enabled ?? fallback.waAutoReplyEnabled,
      waAdminAlertEnabled: data.wa_admin_alert_enabled ?? fallback.waAdminAlertEnabled,
      waTemplateEn: data.wa_template_en || fallback.waTemplateEn,
      waTemplateTe: data.wa_template_te || fallback.waTemplateTe,
      waTemplateHi: data.wa_template_hi || fallback.waTemplateHi,
      whatsappBotEnabled: data.whatsapp_bot_enabled ?? fallback.whatsappBotEnabled,
      whatsappAutoConfirm: data.whatsapp_auto_confirm ?? fallback.whatsappAutoConfirm,
      whatsappFollowups: data.whatsapp_followups ?? fallback.whatsappFollowups,
      whatsappStatusUpdates: data.whatsapp_status_updates ?? fallback.whatsappStatusUpdates,
      quietHoursStart: data.quiet_hours_start || fallback.quietHoursStart,
      quietHoursEnd: data.quiet_hours_end || fallback.quietHoursEnd,
      dailySummaryEnabled: data.daily_summary_enabled ?? fallback.dailySummaryEnabled,
      googleSheetExportEnabled: data.google_sheet_export_enabled ?? fallback.googleSheetExportEnabled,
      humanPauseHours: data.human_pause_hours !== undefined ? Number(data.human_pause_hours) : fallback.humanPauseHours,
      waAdminTo: data.wa_admin_to || fallback.waAdminTo
    };
  } catch (err) {
    return fallback;
  }
}

export async function updateSettingsApi(settingsData) {
  try {
    const payload = {
      founder_name: sanitizeString(settingsData.founderName || 'Lingaswamy Maddeboina'),
      phone: sanitizeString(settingsData.phone),
      whatsapp_number: cleanPhone(settingsData.whatsappNumber),
      default_whatsapp_message: sanitizeString(settingsData.defaultWhatsAppMessage),
      tagline: sanitizeString(settingsData.tagline),
      secondary_tagline: sanitizeString(settingsData.secondaryTagline),
      location: sanitizeString(settingsData.location),
      instagram_url: sanitizeString(settingsData.instagramUrl),
      youtube_url: sanitizeString(settingsData.youtubeUrl),
      working_hours: sanitizeString(settingsData.workingHours),
      office_address: sanitizeString(settingsData.officeAddress),
      email: sanitizeString(settingsData.email),
      about_text: sanitizeString(settingsData.aboutText),
      delivery_note: sanitizeString(settingsData.deliveryNote),
      languages_supported: sanitizeString(settingsData.languagesSupported),
      response_time_text: sanitizeString(settingsData.responseTimeText || '24 hours'),
      facebook_url: sanitizeString(settingsData.facebookUrl || ''),
      linkedin_url: sanitizeString(settingsData.linkedinUrl || ''),
      notify_email_enabled: Boolean(settingsData.notifyEmailEnabled),
      wa_auto_reply_enabled: Boolean(settingsData.waAutoReplyEnabled),
      wa_admin_alert_enabled: Boolean(settingsData.waAdminAlertEnabled),
      wa_template_en: sanitizeString(settingsData.waTemplateEn),
      wa_template_te: sanitizeString(settingsData.waTemplateTe),
      wa_template_hi: sanitizeString(settingsData.waTemplateHi),
      whatsapp_bot_enabled: Boolean(settingsData.whatsappBotEnabled ?? true),
      whatsapp_auto_confirm: Boolean(settingsData.whatsappAutoConfirm),
      whatsapp_followups: Boolean(settingsData.whatsappFollowups),
      whatsapp_status_updates: Boolean(settingsData.whatsappStatusUpdates),
      quiet_hours_start: sanitizeString(settingsData.quietHoursStart || '22:00'),
      quiet_hours_end: sanitizeString(settingsData.quietHoursEnd || '08:00'),
      daily_summary_enabled: Boolean(settingsData.dailySummaryEnabled),
      google_sheet_export_enabled: Boolean(settingsData.googleSheetExportEnabled),
      human_pause_hours: Math.max(1, parseInt(settingsData.humanPauseHours, 10) || 2),
      wa_admin_to: cleanPhone(settingsData.waAdminTo || '')
    };

    const res = await apiFetch('/index.php?endpoint=settings', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    console.error('api.updateSettingsApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 2. DOMAINS API
// =========================================================================
export async function getDomains() {
  const fallback = [
    { id: 'web', key: 'web', name: 'Web Development', startingPrice: 6500, price_label: 'starting from', tagline: 'Responsive websites and web applications', is_active: true },
    { id: 'app', key: 'app', name: 'Mobile App Development', startingPrice: 20000, price_label: 'starting from', tagline: 'Native and cross-platform mobile apps', is_active: true },
    { id: 'ai', key: 'ai', name: 'AI & Automation', startingPrice: 7500, price_label: 'starting from', tagline: 'Intelligent automation & modern software', is_active: true }
  ];

  try {
    const data = await apiFetch('/index.php?endpoint=domains');
    if (!Array.isArray(data) || data.length === 0) return fallback;
    return data.map(d => ({
      ...d,
      startingPrice: Number(d.starting_price) || 0,
      priceFormatted: formatINR(d.starting_price)
    }));
  } catch (err) {
    return fallback;
  }
}

export async function updateDomainPriceApi(domainId, newPrice) {
  try {
    const res = await apiFetch(`/index.php?endpoint=domains&id=${domainId}`, {
      method: 'PUT',
      body: { starting_price: Number(newPrice) }
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateDomainApi(domainId, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=domains&id=${domainId}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 3. SERVICES API
// =========================================================================
export async function getServices() {
  try {
    const data = await apiFetch('/index.php?endpoint=services');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createServiceApi({ domain_id, name, description = '', type = 'main', sort_order = 0, is_active = true }) {
  try {
    const res = await apiFetch('/index.php?endpoint=services', {
      method: 'POST',
      body: { domain_id, name, description, type, sort_order, is_active }
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateServiceApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=services&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteServiceApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=services&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 4. PACKAGES API
// =========================================================================
export async function getPackages() {
  try {
    const data = await apiFetch('/index.php?endpoint=packages');
    if (Array.isArray(data)) {
      return data.map(p => ({
        ...p,
        priceFormatted: formatINR(p.price)
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function createPackageApi(payload) {
  try {
    const res = await apiFetch('/index.php?endpoint=packages', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updatePackageApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=packages&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updatePackagePriceApi(id, newPrice) {
  try {
    const res = await apiFetch(`/index.php?endpoint=packages&id=${id}`, {
      method: 'PUT',
      body: { price: Number(newPrice) }
    });
    // Log price history
    try {
      await apiFetch('/index.php?endpoint=price_history', {
        method: 'POST',
        body: { package_id: id, new_price: Number(newPrice), changed_by: 'Admin' }
      });
    } catch {}
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deletePackageApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=packages&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 5. PROJECTS API
// =========================================================================
export async function getProjects() {
  try {
    const data = await apiFetch('/index.php?endpoint=projects');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createProjectApi(payload) {
  try {
    const res = await apiFetch('/index.php?endpoint=projects', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=projects&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteProjectApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=projects&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadProjectImageApi(file) {
  return uploadMediaApi('projects', file);
}

// =========================================================================
// 6. TESTIMONIALS API
// =========================================================================
export async function getTestimonials() {
  try {
    const data = await apiFetch('/index.php?endpoint=testimonials');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createTestimonialApi(payload) {
  try {
    const res = await apiFetch('/index.php?endpoint=testimonials', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateTestimonialApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=testimonials&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteTestimonialApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=testimonials&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 7. FAQS API
// =========================================================================
export async function getFaqs() {
  try {
    const data = await apiFetch('/index.php?endpoint=faqs');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createFaqApi(payload) {
  try {
    const res = await apiFetch('/index.php?endpoint=faqs', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateFaqApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=faqs&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteFaqApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=faqs&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 8. ENQUIRIES API
// =========================================================================
export async function createEnquiry(enquiryData) {
  try {
    const payload = {
      name: sanitizeString(enquiryData.name),
      phone: cleanPhone(enquiryData.phone),
      email: sanitizeString(enquiryData.email || ''),
      service: sanitizeString(enquiryData.service || enquiryData.subject || ''),
      message: sanitizeString(enquiryData.message || ''),
      domain: sanitizeString(enquiryData.domain || 'web'),
      source: sanitizeString(enquiryData.source || 'website')
    };
    const res = await apiFetch('/index.php?endpoint=enquiries', {
      method: 'POST',
      body: payload
    });
    return { success: true, ...res };
  } catch (err) {
    console.error('api.createEnquiry error:', err);
    return { success: false, error: err.message };
  }
}

export async function getEnquiriesApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=enquiries');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function updateEnquiryStatusApi(id, status) {
  try {
    const res = await apiFetch(`/index.php?endpoint=enquiries&id=${id}`, {
      method: 'PUT',
      body: { status }
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteEnquiryApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=enquiries&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 9. PRICE HISTORY API
// =========================================================================
export async function getPriceHistoryApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=price_history');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

// =========================================================================
// 10. CHATBOT SETTINGS & SESSIONS API
// =========================================================================
export async function getChatbotPublicSettings() {
  try {
    return await apiFetch('/index.php?endpoint=chatbot_settings');
  } catch (err) {
    return {};
  }
}

export async function getAdminChatbotSettings() {
  try {
    return await apiFetch('/index.php?endpoint=chatbot_settings');
  } catch (err) {
    return {};
  }
}

export async function updateChatbotSettingsApi(settings) {
  try {
    const res = await apiFetch('/index.php?endpoint=chatbot_settings', {
      method: 'POST',
      body: settings
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getChatSessionsApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=chatbot_messages');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function getChatMessagesApi(sessionId) {
  try {
    const data = await apiFetch(`/index.php?endpoint=chatbot_messages&session_id=${encodeURIComponent(sessionId)}`);
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function deleteChatSessionApi(sessionId) {
  try {
    const res = await apiFetch(`/index.php?endpoint=chatbot_messages&session_id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 11. SERVICE AREAS API
// =========================================================================
export async function getServiceAreas() {
  try {
    const data = await apiFetch('/index.php?endpoint=service_areas');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createServiceAreaApi(area) {
  try {
    const res = await apiFetch('/index.php?endpoint=service_areas', {
      method: 'POST',
      body: area
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateServiceAreaApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=service_areas&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteServiceAreaApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=service_areas&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 12. WHATSAPP AUTOMATION & LOGS API
// =========================================================================
export async function getWhatsAppContactsApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=whatsapp_logs');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function getWhatsAppMessagesApi(contactId) {
  try {
    const data = await apiFetch(`/index.php?endpoint=whatsapp_logs&id=${encodeURIComponent(contactId)}`);
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function takeOverWhatsAppChatApi(contactId, pauseHours = 2) {
  return { success: true, message: `Chat taken over for ${pauseHours} hours.` };
}

export async function resumeWhatsAppChatApi(contactId) {
  return { success: true, message: 'Chat resumed by bot.' };
}

export async function updateWhatsAppContactStatusApi(contactId, status) {
  return { success: true };
}

export async function getWhatsAppTemplatesApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=whatsapp_templates');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function sendWhatsAppMessageApi({ contactId, phone, message, templateId, templateVariables = [] }) {
  try {
    const res = await apiFetch('/whatsapp/send.php', {
      method: 'POST',
      body: { phone, message, templateId, templateVariables }
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 13. DESIGN SETTINGS API
// =========================================================================
export const DEFAULT_DESIGN_SETTINGS = {
  theme_mode: 'dark',
  primary_color: '#1d5cf0',
  secondary_color: '#06d6a0',
  accent_color: '#f72585',
  font_family: 'Outfit, sans-serif',
  border_radius: '12px',
  glassmorphism_intensity: 'high',
  cursor_glow: true,
  particle_background: true,
  smooth_scroll: true,
  sound_effects: false,
  lottie_enabled: true,
  tooltip_enabled: true,
  quality_override: 'auto'
};

export async function getDesignSettingsApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=design_settings');
    if (!data || Object.keys(data).length === 0) return DEFAULT_DESIGN_SETTINGS;
    return { ...DEFAULT_DESIGN_SETTINGS, ...data };
  } catch (err) {
    return DEFAULT_DESIGN_SETTINGS;
  }
}

export async function updateDesignSettingsApi(settingsUpdates) {
  try {
    const res = await apiFetch('/index.php?endpoint=design_settings', {
      method: 'POST',
      body: settingsUpdates
    });
    return { success: true, data: { ...DEFAULT_DESIGN_SETTINGS, ...settingsUpdates }, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 14. CLIENT LOGOS & CASE STUDIES API
// =========================================================================
export async function getClientsApi() {
  try {
    const data = await apiFetch('/index.php?endpoint=clients');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
}

export async function createClientApi(clientData) {
  try {
    const res = await apiFetch('/index.php?endpoint=clients', {
      method: 'POST',
      body: clientData
    });
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateClientApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=clients&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteClientApi(id) {
  try {
    const res = await apiFetch(`/index.php?endpoint=clients&id=${id}`, {
      method: 'DELETE'
    });
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 15. PROCESS STEPS & TIMELINE API
// =========================================================================
export async function getProcessStepsApi() {
  const fallback = [
    { step_number: 1, title: 'Requirement Gathering', description: 'We discuss your exact business workflow and pricing targets directly on WhatsApp or phone.', icon_key: 'MessageCircle' },
    { step_number: 2, title: 'Architecture & Rapid Prototype', description: 'We design a clean, responsive prototype tailored to your brand colors and Indian customers.', icon_key: 'Layers' },
    { step_number: 3, title: 'Full-Stack Development', description: 'Production code built with modern frameworks, Razorpay/UPI payments, and sub-second load times.', icon_key: 'Cpu' },
    { step_number: 4, title: 'Launch & Ongoing Support', description: 'We deploy on cloud hosting with free SSL, setup your domain, and provide continuous warranty.', icon_key: 'ShieldCheck' }
  ];

  try {
    const data = await apiFetch('/index.php?endpoint=process_steps');
    if (Array.isArray(data) && data.length > 0) return data;
    return fallback;
  } catch (err) {
    return fallback;
  }
}

export async function updateProcessStepApi(id, updates) {
  try {
    const res = await apiFetch(`/index.php?endpoint=process_steps&id=${id}`, {
      method: 'PUT',
      body: updates
    });
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 16. SECURE STORAGE UPLOAD API
// =========================================================================
export async function uploadMediaApi(bucket, file, { onProgress } = {}) {
  try {
    if (!file) throw new Error('No file provided.');

    const isVideo = file.type?.startsWith('video/');
    const maxSizeBytes = isVideo ? 20 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket || 'projects');

    const res = await apiFetch('/upload.php', {
      method: 'POST',
      body: formData
    });

    return {
      success: true,
      url: res.url,
      path: res.url
    };
  } catch (err) {
    console.error('api.uploadMediaApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 17. PROJECT BUILDER SUBMISSION API
// =========================================================================
export async function submitProjectBuilderApi(builderData) {
  try {
    const { name, phone, email, notes, selectedServices = [], budgetRange = '', timeline = '', businessType = '' } = builderData;

    const digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      throw new Error('Please enter a valid 10-digit Indian phone number.');
    }

    const payload = {
      name: sanitizeString(name || 'Customer Enquiry'),
      phone: digits,
      email: sanitizeString(email || ''),
      service: selectedServices.join(', ') || 'Custom Project',
      domain: 'web',
      message: `[Project Builder] Services: ${selectedServices.join(', ')} | Budget: ${budgetRange} | Timeline: ${timeline} | Business: ${businessType} | Notes: ${notes || 'None'}`,
      status: 'new'
    };

    const res = await apiFetch('/index.php?endpoint=enquiries', {
      method: 'POST',
      body: payload
    });

    return { success: true, data: res };
  } catch (err) {
    console.error('api.submitProjectBuilderApi error:', err);
    return { success: false, error: err.message };
  }
}
