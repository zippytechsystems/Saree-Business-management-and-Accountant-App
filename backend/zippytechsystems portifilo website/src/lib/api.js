import { supabase, isSupabaseConfigured } from './supabase';
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
  return str
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Clean phone numbers to pure digits
 */
export function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
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
    email: '',
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

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return fallback;

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
    console.warn('api.getSettings fallback:', err);
    return fallback;
  }
}

export async function updateSettingsApi(settingsData) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

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
      wa_admin_to: cleanPhone(settingsData.waAdminTo || ''),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...payload });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateSettingsApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 2. DOMAINS & STARTING PRICES API
// =========================================================================
export async function getDomains() {
  const fallback = [
    { id: 'web', key: 'web', name: 'Web Development', starting_price: 7000, price_label: 'Starting from', color: '#1d5cf0', intro: 'A modern, high-speed website that brings local customers to your door 24/7.' },
    { id: 'app', key: 'app', name: 'App Development', starting_price: 10000, price_label: 'Starting from', color: '#12a150', intro: 'Custom billing, accounts, and inventory apps for retail and wholesale shops.' },
    { id: 'ai', key: 'ai', name: 'AI Automation', starting_price: 6000, price_label: 'Starting from', color: '#7a2fd0', intro: 'Never lose another customer enquiry with 24/7 WhatsApp and voice agents.' }
  ];

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    return data.map((d) => ({
      ...d,
      starting_price: Number(d.starting_price) || 0
    }));
  } catch (err) {
    console.warn('api.getDomains fallback:', err);
    return fallback;
  }
}

export async function updateDomainPriceApi(domainId, newPrice) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const numericPrice = Math.max(0, Number(newPrice) || 0);
    const { error } = await supabase
      .from('domains')
      .update({
        starting_price: numericPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', domainId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateDomainPriceApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateDomainApi(domainId, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('domains')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', domainId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateDomainApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 3. SERVICES API
// =========================================================================
export async function getServices() {
  const fallback = initialContent.services;
  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const [{ data: domainsData }, { data: servicesData, error: sErr }] = await Promise.all([
      supabase.from('domains').select('*').order('sort_order', { ascending: true }),
      supabase.from('services').select('*').order('sort_order', { ascending: true })
    ]);

    if (sErr || !servicesData || servicesData.length === 0) return fallback;

    const domainsList = domainsData && domainsData.length > 0 ? domainsData : [
      { id: 'web', key: 'web', name: 'Web Development', starting_price: 7000, color: '#1d5cf0' },
      { id: 'app', key: 'app', name: 'App Development', starting_price: 10000, color: '#12a150' },
      { id: 'ai', key: 'ai', name: 'AI Automation', starting_price: 6000, color: '#7a2fd0' }
    ];

    return domainsList.map((d) => {
      const matchingServices = servicesData.filter(
        (s) => s.domain_id === d.id || s.domain_id === d.key
      );

      const mainServices = matchingServices
        .filter((s) => s.type === 'main')
        .map((s) => ({ id: s.id, title: s.name, desc: s.description, isActive: s.is_active }));

      const moreServices = matchingServices
        .filter((s) => s.type === 'more')
        .map((s) => ({ id: s.id, title: s.name, desc: s.description, isActive: s.is_active }));

      const baseFallback = fallback.find((fb) => fb.domain === d.key) || {};

      return {
        id: d.id,
        slug: d.key === 'web' ? 'web-development' : d.key === 'app' ? 'app-development' : 'ai-automation',
        domain: d.key,
        domainLabel: d.name,
        startingPrice: formatINR(d.starting_price),
        startingPriceNum: Number(d.starting_price) || 0,
        badgeColor: d.color,
        gradient: baseFallback.gradient || 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
        introLine: d.intro || baseFallback.introLine,
        conceptCopy: baseFallback.conceptCopy || '',
        whatsappMessage: baseFallback.whatsappMessage || '',
        mainServices: mainServices.length > 0 ? mainServices : baseFallback.mainServices || [],
        moreServices: moreServices.length > 0 ? moreServices : baseFallback.moreServices || []
      };
    });
  } catch (err) {
    console.warn('api.getServices fallback:', err);
    return fallback;
  }
}

export async function createServiceApi({ domain_id, name, description = '', type = 'main', sort_order = 0, is_active = true }) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { data, error } = await supabase
      .from('services')
      .insert([
        {
          domain_id,
          name: sanitizeString(name),
          description: sanitizeString(description),
          type,
          sort_order,
          is_active
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createServiceApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateServiceApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.name) payload.name = sanitizeString(payload.name);
    if (payload.description) payload.description = sanitizeString(payload.description);

    const { error } = await supabase.from('services').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateServiceApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteServiceApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteServiceApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 4. PACKAGES API
// =========================================================================
export async function getPackages() {
  const fallback = initialContent.packages || [];
  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    return data.map((pkg) => ({
      id: pkg.id,
      domain: pkg.domain_id,
      name: pkg.name,
      price: formatINR(pkg.price),
      priceNum: Number(pkg.price) || 0,
      tagline: pkg.tagline || '',
      deliverables: Array.isArray(pkg.features) ? pkg.features : [],
      popular: Boolean(pkg.is_popular),
      isActive: pkg.is_active
    }));
  } catch (err) {
    console.warn('api.getPackages fallback:', err);
    return fallback;
  }
}

export async function createPackageApi(payload) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const featuresArray = Array.isArray(payload.deliverables)
      ? payload.deliverables
      : typeof payload.deliverables === 'string'
      ? payload.deliverables.split('\n').map((f) => f.trim()).filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from('packages')
      .insert([
        {
          domain_id: payload.domain,
          name: sanitizeString(payload.name),
          price: Math.max(0, Number(payload.priceNum || payload.price) || 0),
          features: featuresArray,
          is_popular: Boolean(payload.popular),
          sort_order: payload.sort_order || 0,
          is_active: payload.isActive !== false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createPackageApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updatePackageApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.domain) payload.domain_id = updates.domain;
    if (updates.name) payload.name = sanitizeString(updates.name);
    if (updates.price !== undefined || updates.priceNum !== undefined) {
      payload.price = Math.max(0, Number(updates.priceNum ?? updates.price) || 0);
    }
    if (updates.deliverables !== undefined) {
      payload.features = Array.isArray(updates.deliverables)
        ? updates.deliverables
        : typeof updates.deliverables === 'string'
        ? updates.deliverables.split('\n').map((f) => f.trim()).filter(Boolean)
        : [];
    }
    if (updates.popular !== undefined) payload.is_popular = Boolean(updates.popular);
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

    const { error } = await supabase.from('packages').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updatePackageApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updatePackagePriceApi(id, newPrice) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const numericPrice = Math.max(0, Number(newPrice) || 0);
    const { error } = await supabase
      .from('packages')
      .update({ price: numericPrice, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updatePackagePriceApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deletePackageApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deletePackageApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 5. PROJECTS API
// =========================================================================
export async function getProjects() {
  const fallback = initialContent.projects;
  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    return data.map((p) => ({
      id: p.id,
      title: p.title,
      domain: p.domain_id,
      clientCategory: p.client_category,
      shortDescription: p.description,
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      metrics: p.metrics || '',
      link: p.link || 'https://wa.me/916302690251',
      image: p.image_url || '/projects/clinic-web.svg',
      isActive: p.is_active
    }));
  } catch (err) {
    console.warn('api.getProjects fallback:', err);
    return fallback;
  }
}

export async function createProjectApi(payload) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const techArray = Array.isArray(payload.technologies)
      ? payload.technologies
      : typeof payload.technologies === 'string'
      ? payload.technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title: sanitizeString(payload.title),
          domain_id: payload.domain || 'web',
          client_category: sanitizeString(payload.clientCategory || 'Business Solutions'),
          description: sanitizeString(payload.shortDescription || payload.description),
          technologies: techArray,
          metrics: sanitizeString(payload.metrics || ''),
          link: payload.link || 'https://wa.me/916302690251',
          image_url: payload.image || payload.image_url || '/projects/clinic-web.svg',
          is_active: payload.isActive !== false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createProjectApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateProjectApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.title) payload.title = sanitizeString(updates.title);
    if (updates.domain) payload.domain_id = updates.domain;
    if (updates.clientCategory) payload.client_category = sanitizeString(updates.clientCategory);
    if (updates.shortDescription || updates.description) {
      payload.description = sanitizeString(updates.shortDescription || updates.description);
    }
    if (updates.technologies) {
      payload.technologies = Array.isArray(updates.technologies)
        ? updates.technologies
        : String(updates.technologies).split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (updates.metrics !== undefined) payload.metrics = sanitizeString(updates.metrics);
    if (updates.link !== undefined) payload.link = updates.link;
    if (updates.image || updates.image_url) payload.image_url = updates.image || updates.image_url;
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

    const { error } = await supabase.from('projects').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateProjectApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteProjectApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteProjectApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadProjectImageApi(file) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage is not configured. Falling back to local placeholder.');
  }

  // 1. File size validation (limit to 2 MB)
  const MAX_SIZE_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`);
  }

  // 2. MIME type validation (images only)
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only image files (JPEG, PNG, WebP, SVG) are allowed.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `projects/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('portfolio-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// =========================================================================
// 6. TESTIMONIALS API
// =========================================================================
export async function getTestimonials() {
  const fallback = initialContent.testimonials || [];
  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    return data.map((t) => ({
      id: t.id,
      clientName: t.client_name,
      roleOrCompany: t.business,
      domain: t.domain_id || 'web',
      rating: t.rating || 5,
      content: t.message,
      isActive: t.is_active
    }));
  } catch (err) {
    console.warn('api.getTestimonials fallback:', err);
    return fallback;
  }
}

export async function createTestimonialApi(payload) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert([
        {
          client_name: sanitizeString(payload.clientName),
          business: sanitizeString(payload.roleOrCompany || payload.business),
          domain_id: payload.domain || 'web',
          rating: Math.min(5, Math.max(1, Number(payload.rating) || 5)),
          message: sanitizeString(payload.content || payload.message),
          is_active: payload.isActive !== false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createTestimonialApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateTestimonialApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.clientName) payload.client_name = sanitizeString(updates.clientName);
    if (updates.roleOrCompany || updates.business) {
      payload.business = sanitizeString(updates.roleOrCompany || updates.business);
    }
    if (updates.domain) payload.domain_id = updates.domain;
    if (updates.rating) payload.rating = Math.min(5, Math.max(1, Number(updates.rating) || 5));
    if (updates.content || updates.message) {
      payload.message = sanitizeString(updates.content || updates.message);
    }
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

    const { error } = await supabase.from('testimonials').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateTestimonialApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteTestimonialApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteTestimonialApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 7. FAQS API
// =========================================================================
export async function getFaqs() {
  const fallback = initialContent.faqs || [];
  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    return data.map((f) => ({
      id: f.id,
      category: f.category || 'General',
      question: f.question,
      answer: f.answer,
      isActive: f.is_active
    }));
  } catch (err) {
    console.warn('api.getFaqs fallback:', err);
    return fallback;
  }
}

export async function createFaqApi(payload) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { data, error } = await supabase
      .from('faqs')
      .insert([
        {
          category: sanitizeString(payload.category || 'General'),
          question: sanitizeString(payload.question),
          answer: sanitizeString(payload.answer),
          is_active: payload.isActive !== false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createFaqApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateFaqApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.category) payload.category = sanitizeString(updates.category);
    if (updates.question) payload.question = sanitizeString(updates.question);
    if (updates.answer) payload.answer = sanitizeString(updates.answer);
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

    const { error } = await supabase.from('faqs').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateFaqApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteFaqApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteFaqApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 8. ENQUIRIES API (Contact & Quote Form Submissions)
// =========================================================================
export async function createEnquiry(enquiryData) {
  // Anti-spam honeypot detection
  if (enquiryData.honeypot && String(enquiryData.honeypot).trim() !== '') {
    return { success: true, spam: true };
  }

  const name = sanitizeString(enquiryData.name);
  const phone = cleanPhone(enquiryData.phone);
  const email = sanitizeString(enquiryData.email || '');
  const service = sanitizeString(enquiryData.service || 'General Enquiry');
  const message = sanitizeString(enquiryData.message || '');
  const notes = sanitizeString(enquiryData.notes || '');
  const selectedServices = Array.isArray(enquiryData.selectedServices)
    ? enquiryData.selectedServices
    : Array.isArray(enquiryData.selected_services)
    ? enquiryData.selected_services
    : [];
  const whatsappOptIn = Boolean(enquiryData.whatsappOptIn ?? enquiryData.whatsapp_opt_in);
  const allowedSources = ['contact', 'quote', 'project', 'callback', 'chatbot'];
  const source = allowedSources.includes(enquiryData.source) ? enquiryData.source : 'contact';

  if (!name || phone.length < 10) {
    return { success: false, error: 'Name and a valid 10-digit mobile number are required.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: true, offline: true };
  }

  try {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([
        {
          name,
          phone,
          email,
          service,
          message,
          selected_services: selectedServices,
          notes,
          whatsapp_opt_in: whatsappOptIn,
          status: 'New',
          source
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Trigger transactional email & WhatsApp alert in background (non-blocking)
    try {
      supabase.functions
        .invoke('notify-enquiry', {
          body: {
            enquiry: {
              id: data?.id,
              name,
              phone,
              email,
              service,
              message,
              selected_services: selectedServices,
              notes,
              source,
              whatsapp_opt_in: whatsappOptIn
            }
          }
        })
        .catch((e) => console.warn('Background notify-enquiry dispatch warning:', e));
    } catch (bgErr) {
      console.warn('Background notification error:', bgErr);
    }

    return { success: true, data };
  } catch (err) {
    console.warn('api.createEnquiry database save fallback:', err);
    return { success: true, offline: true, error: err.message };
  }
}

export async function getEnquiriesApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    
    // Add computed 24-hour overdue indicator
    return data.map((item) => {
      const createdTime = new Date(item.created_at).getTime();
      const ageHours = (Date.now() - createdTime) / (1000 * 60 * 60);
      const isOverdue = item.status === 'New' && ageHours >= 24;
      return {
        ...item,
        email: item.email || '',
        selected_services: Array.isArray(item.selected_services) ? item.selected_services : [],
        notes: item.notes || '',
        whatsapp_opt_in: Boolean(item.whatsapp_opt_in),
        ageHours: Math.round(ageHours),
        isOverdue
      };
    });
  } catch (err) {
    console.warn('api.getEnquiriesApi error:', err);
    return [];
  }
}

export async function updateEnquiryStatusApi(id, status) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateEnquiryStatusApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteEnquiryApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteEnquiryApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 9. PRICE HISTORY API
// =========================================================================
export async function getPriceHistoryApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.warn('api.getPriceHistoryApi error:', err);
    return [];
  }
}

// =========================================================================
// 10. CHATBOT SETTINGS & PUBLIC VIEW API
// =========================================================================
export async function getChatbotPublicSettings() {
  const fallback = {
    enabled: true,
    welcomeMessage: 'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    quickReplies: [
      'Website services',
      'App for my shop',
      'AI chatbot / WhatsApp automation',
      'Prices',
      'Talk to Lingaswamy'
    ],
    voiceEnabled: true,
    voiceDefaultLang: 'en-IN',
    voiceRate: 1.0,
    voiceNameEn: 'en-IN-NeerjaNeural',
    voiceNameTe: 'te-IN-ShrutiNeural',
    voiceNameHi: 'hi-IN-SwaraNeural'
  };

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    // Read from secure view chatbot_public (granted to anon)
    const { data, error } = await supabase
      .from('chatbot_public')
      .select('enabled, welcome_message, quick_replies, voice_enabled, voice_default_lang, voice_rate, voice_name_en, voice_name_te, voice_name_hi')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return fallback;

    return {
      enabled: data.enabled ?? true,
      welcomeMessage: data.welcome_message || fallback.welcomeMessage,
      quickReplies: Array.isArray(data.quick_replies) ? data.quick_replies : fallback.quickReplies,
      voiceEnabled: data.voice_enabled ?? true,
      voiceDefaultLang: data.voice_default_lang || 'en-IN',
      voiceRate: data.voice_rate ? Number(data.voice_rate) : 1.0,
      voiceNameEn: data.voice_name_en || 'en-IN-NeerjaNeural',
      voiceNameTe: data.voice_name_te || 'te-IN-ShrutiNeural',
      voiceNameHi: data.voice_name_hi || 'hi-IN-SwaraNeural'
    };
  } catch (err) {
    console.warn('api.getChatbotPublicSettings fallback:', err);
    return fallback;
  }
}

export async function getAdminChatbotSettings() {
  const fallback = {
    enabled: true,
    welcomeMessage: 'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    fallbackMessage: 'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized consultation and pricing!',
    quickReplies: [
      'Website services',
      'App for my shop',
      'AI chatbot / WhatsApp automation',
      'Prices',
      'Talk to Lingaswamy'
    ],
    extraInstructions: '',
    model: 'claude-haiku-4-5-20251001',
    dailyLimit: 500,
    voiceEnabled: true,
    voiceDefaultLang: 'en-IN',
    voiceRate: 1.0,
    voiceNameEn: 'en-IN-NeerjaNeural',
    voiceNameTe: 'te-IN-ShrutiNeural',
    voiceNameHi: 'hi-IN-SwaraNeural'
  };

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('chatbot_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return fallback;

    return {
      enabled: data.enabled ?? true,
      welcomeMessage: data.welcome_message || fallback.welcomeMessage,
      fallbackMessage: data.fallback_message || fallback.fallbackMessage,
      quickReplies: Array.isArray(data.quick_replies) ? data.quick_replies : fallback.quickReplies,
      extraInstructions: data.extra_instructions || '',
      model: data.model || fallback.model,
      dailyLimit: data.daily_limit || fallback.dailyLimit,
      voiceEnabled: data.voice_enabled ?? true,
      voiceDefaultLang: data.voice_default_lang || 'en-IN',
      voiceRate: data.voice_rate ? Number(data.voice_rate) : 1.0,
      voiceNameEn: data.voice_name_en || 'en-IN-NeerjaNeural',
      voiceNameTe: data.voice_name_te || 'te-IN-ShrutiNeural',
      voiceNameHi: data.voice_name_hi || 'hi-IN-SwaraNeural'
    };
  } catch (err) {
    console.error('api.getAdminChatbotSettings error:', err);
    return fallback;
  }
}

export async function updateChatbotSettingsApi(settings) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = {
      enabled: Boolean(settings.enabled),
      welcome_message: sanitizeString(settings.welcomeMessage),
      fallback_message: sanitizeString(settings.fallbackMessage),
      quick_replies: Array.isArray(settings.quickReplies) ? settings.quickReplies : [],
      extra_instructions: sanitizeString(settings.extraInstructions),
      model: sanitizeString(settings.model) || 'claude-haiku-4-5-20251001',
      daily_limit: Math.max(1, parseInt(settings.dailyLimit, 10) || 500),
      voice_enabled: Boolean(settings.voiceEnabled),
      voice_default_lang: sanitizeString(settings.voiceDefaultLang) || 'en-IN',
      voice_rate: Number(settings.voiceRate) || 1.0,
      voice_name_en: sanitizeString(settings.voiceNameEn) || 'en-IN-NeerjaNeural',
      voice_name_te: sanitizeString(settings.voiceNameTe) || 'te-IN-ShrutiNeural',
      voice_name_hi: sanitizeString(settings.voiceNameHi) || 'hi-IN-SwaraNeural',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('chatbot_settings')
      .upsert({ id: 1, ...payload });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateChatbotSettingsApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 11. SERVICE AREAS API
// =========================================================================
export async function getServiceAreas() {
  const fallback = [
    { id: '1', name: 'Online (all India)', notes: 'Remote delivery across India', sort_order: 0, is_active: true }
  ];

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return fallback;
    return data;
  } catch (err) {
    console.warn('api.getServiceAreas fallback:', err);
    return fallback;
  }
}

export async function createServiceAreaApi(area) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, data: { id: Date.now().toString(), ...area } };
  }

  try {
    const { data, error } = await supabase
      .from('service_areas')
      .insert({
        name: sanitizeString(area.name),
        type: ['office', 'service_area', 'online'].includes(area.type) ? area.type : 'online',
        address: sanitizeString(area.address || ''),
        city: sanitizeString(area.city || ''),
        state: sanitizeString(area.state || 'Telangana'),
        map_link: sanitizeString(area.map_link || area.mapLink || ''),
        notes: sanitizeString(area.notes || ''),
        sort_order: parseInt(area.sort_order, 10) || 0,
        is_active: area.is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.createServiceAreaApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateServiceAreaApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const payload = {};
    if (updates.name !== undefined) payload.name = sanitizeString(updates.name);
    if (updates.type !== undefined) payload.type = ['office', 'service_area', 'online'].includes(updates.type) ? updates.type : 'online';
    if (updates.address !== undefined) payload.address = sanitizeString(updates.address);
    if (updates.city !== undefined) payload.city = sanitizeString(updates.city);
    if (updates.state !== undefined) payload.state = sanitizeString(updates.state);
    if (updates.map_link !== undefined || updates.mapLink !== undefined) {
      payload.map_link = sanitizeString(updates.map_link || updates.mapLink || '');
    }
    if (updates.notes !== undefined) payload.notes = sanitizeString(updates.notes);
    if (updates.sort_order !== undefined) payload.sort_order = parseInt(updates.sort_order, 10) || 0;
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('service_areas')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateServiceAreaApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteServiceAreaApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('service_areas').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteServiceAreaApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 12. CHAT SESSIONS & CONVERSATIONS API (ADMIN)
// =========================================================================
export async function getChatSessionsApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, enquiries(id, name, phone, service, status)')
      .order('last_message_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('api.getChatSessionsApi error:', err);
    return [];
  }
}

export async function getChatMessagesApi(sessionId) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return [];

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('api.getChatMessagesApi error:', err);
    return [];
  }
}

export async function deleteChatSessionApi(sessionId) {
  if (!isSupabaseConfigured || !supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.deleteChatSessionApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 13. WHATSAPP CHAT & AUTOMATION API (ADMIN LIVE INBOX & TAKE-OVER)
// =========================================================================
export async function getWhatsAppContactsApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .order('last_customer_message_at', { ascending: false, nullsFirst: false });

    if (error || !data) return [];

    const now = Date.now();
    return data.map((c) => {
      const lastMsgTime = c.last_customer_message_at ? new Date(c.last_customer_message_at).getTime() : 0;
      const windowExpiresAt = lastMsgTime ? lastMsgTime + 24 * 60 * 60 * 1000 : 0;
      const isWindowOpen = lastMsgTime > 0 && windowExpiresAt > now;
      const windowRemainingMs = isWindowOpen ? windowExpiresAt - now : 0;
      const pausedUntilTime = c.ai_paused_until ? new Date(c.ai_paused_until).getTime() : 0;
      const isPaused = pausedUntilTime > now;

      return {
        ...c,
        isWindowOpen,
        windowExpiresAt: windowExpiresAt ? new Date(windowExpiresAt).toISOString() : null,
        windowRemainingMs,
        isPaused,
        pausedUntilTime
      };
    });
  } catch (err) {
    console.error('api.getWhatsAppContactsApi error:', err);
    return [];
  }
}

export async function getWhatsAppMessagesApi(contactId) {
  if (!isSupabaseConfigured || !supabase || !contactId) return [];

  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('api.getWhatsAppMessagesApi error:', err);
    return [];
  }
}

export async function takeOverWhatsAppChatApi(contactId, pauseHours = 2) {
  if (!isSupabaseConfigured || !supabase || !contactId) return { success: true };

  try {
    const pauseUntil = new Date(Date.now() + Math.max(1, Number(pauseHours)) * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('whatsapp_contacts')
      .update({
        ai_paused_until: pauseUntil,
        status: 'needs_human',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (error) throw error;
    return { success: true, ai_paused_until: pauseUntil };
  } catch (err) {
    console.error('api.takeOverWhatsAppChatApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function resumeWhatsAppChatApi(contactId) {
  if (!isSupabaseConfigured || !supabase || !contactId) return { success: true };

  try {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .update({
        ai_paused_until: null,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.resumeWhatsAppChatApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateWhatsAppContactStatusApi(contactId, status) {
  if (!isSupabaseConfigured || !supabase || !contactId) return { success: true };

  try {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'active') {
      updates.ai_paused_until = null;
      updates.opted_out = false;
    } else if (status === 'opted_out') {
      updates.opted_out = true;
    }

    const { error } = await supabase
      .from('whatsapp_contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('api.updateWhatsAppContactStatusApi error:', err);
    return { success: false, error: err.message };
  }
}

export async function getWhatsAppTemplatesApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('api.getWhatsAppTemplatesApi error:', err);
    return [];
  }
}

export async function sendWhatsAppMessageApi({ contactId, phone, message, templateId, templateVariables = [] }) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not connected.' };
  }

  try {
    // 1. Invoke whatsapp-send Edge Function
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        contactId,
        phone,
        message,
        templateId,
        templateVariables
      }
    });

    if (error) {
      console.warn('Edge function whatsapp-send error, inserting local record fallback:', error);
      // If function is not yet deployed, insert outbound message record for UI transparency
      const { data: insertedMsg, error: insertErr } = await supabase
        .from('whatsapp_messages')
        .insert({
          contact_id: contactId,
          direction: 'outbound',
          source: 'admin',
          type: templateId ? 'template' : 'text',
          content: message || `Template #${templateId}`,
          status: 'sent'
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return { success: true, localOnly: true, data: insertedMsg };
    }

    return { success: true, data };
  } catch (err) {
    console.error('api.sendWhatsAppMessageApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 12. DESIGN SETTINGS & DYNAMIC MOTION API (PHASE 2)
// =========================================================================

export const DEFAULT_DESIGN_SETTINGS = {
  hero_style: 'mesh',
  video_background_url: '',
  video_poster_url: '',
  particles_enabled: true,
  cursor_effect_enabled: true,
  magnetic_buttons_enabled: true,
  parallax_enabled: true,
  horizontal_portfolio_enabled: true,
  lottie_enabled: true,
  tooltip_enabled: true,
  quality_override: 'auto'
};

export async function getDesignSettingsApi() {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_DESIGN_SETTINGS;

  try {
    const { data, error } = await supabase
      .from('design_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_DESIGN_SETTINGS;
    }
    return { ...DEFAULT_DESIGN_SETTINGS, ...data };
  } catch (err) {
    console.warn('api.getDesignSettingsApi warning:', err);
    return DEFAULT_DESIGN_SETTINGS;
  }
}

export async function updateDesignSettingsApi(settingsUpdates) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not connected.' };
  }

  try {
    const payload = {
      ...settingsUpdates,
      id: 1,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('design_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('api.updateDesignSettingsApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 13. CLIENT LOGOS & CASE STUDIES API
// =========================================================================

export async function getClientsApi() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('api.getClientsApi error:', err);
    return [];
  }
}

export async function createClientApi(clientData) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Database not connected.' };

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateClientApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Database not connected.' };

  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteClientApi(id) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Database not connected.' };

  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 14. PROCESS STEPS & TIMELINE API
// =========================================================================

export async function getProcessStepsApi() {
  const fallback = [
    { step_number: 1, title: 'Requirement Gathering', description: 'We discuss your exact business workflow and pricing targets directly on WhatsApp or phone.', icon_key: 'MessageCircle' },
    { step_number: 2, title: 'Architecture & Rapid Prototype', description: 'We design a clean, responsive prototype tailored to your brand colors and Indian customers.', icon_key: 'Layers' },
    { step_number: 3, title: 'Full-Stack Development', description: 'Production code built with modern frameworks, Razorpay/UPI payments, and sub-second load times.', icon_key: 'Cpu' },
    { step_number: 4, title: 'Launch & Ongoing Support', description: 'We deploy on cloud hosting with free SSL, setup your domain, and provide continuous warranty.', icon_key: 'ShieldCheck' }
  ];

  if (!isSupabaseConfigured || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('process_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_number', { ascending: true });

    if (error || !data || data.length === 0) return fallback;
    return data;
  } catch (err) {
    return fallback;
  }
}

export async function updateProcessStepApi(id, updates) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Database not connected.' };

  try {
    const { data, error } = await supabase
      .from('process_steps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 15. SECURE STORAGE UPLOAD API (Validations & Client Compression)
// =========================================================================

export async function uploadMediaApi(bucket, file, { onProgress } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not connected.' };
  }

  try {
    // 1. Validate file existence
    if (!file) throw new Error('No file provided.');

    // 2. Validate file size
    const isVideo = file.type.startsWith('video/');
    const maxSizeBytes = isVideo ? 20 * 1024 * 1024 : 2 * 1024 * 1024; // 20MB for video, 2MB for images

    if (file.size > maxSizeBytes) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is ${isVideo ? '20 MB' : '2 MB'}.`);
    }

    // 3. Validate MIME type
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];
    if (!allowedMime.includes(file.type)) {
      throw new Error(`Unsupported format (${file.type}). Allowed: PNG, JPEG, WebP, SVG, MP4, WebM.`);
    }

    // 4. Generate clean unique path
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData?.publicUrl || '',
      path: filePath
    };
  } catch (err) {
    console.error('api.uploadMediaApi error:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 16. PROJECT BUILDER SUBMISSION API
// =========================================================================

export async function submitProjectBuilderApi(builderData) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not connected. Please contact us directly on WhatsApp.' };
  }

  try {
    const { name, phone, email, notes, selectedServices = [], budgetRange = '', timeline = '', businessType = '' } = builderData;

    // Validate phone
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
      notes: sanitizeString(notes || ''),
      source: 'project-builder',
      status: 'New',
      selected_services: selectedServices,
      budget_range: budgetRange,
      timeline: timeline,
      business_type: businessType,
      created_at: new Date().toISOString()
    };

    const { data: enquiryRecord, error: insertErr } = await supabase
      .from('enquiries')
      .insert(payload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Trigger email notification if Edge Function is active
    try {
      await supabase.functions.invoke('notify-enquiry', {
        body: { enquiry: enquiryRecord }
      });
    } catch (e) {
      console.warn('notify-enquiry invocation error (non-fatal):', e);
    }

    return { success: true, data: enquiryRecord };
  } catch (err) {
    console.error('api.submitProjectBuilderApi error:', err);
    return { success: false, error: err.message };
  }
}



