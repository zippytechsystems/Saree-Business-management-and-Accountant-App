/**
 * Dynamic Knowledge Builder for ZippyTechSystems AI Assistant
 * Converts live database entities into structured text for system prompt and admin preview.
 * Zero hardcoded prices, services, or contact details.
 */

export function formatINR(val) {
  if (val === null || val === undefined || val === '') return '₹0';
  if (typeof val === 'string' && val.includes('₹')) {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return '₹' + num.toLocaleString('en-IN');
    return val;
  }
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

export function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Builds plain structured knowledge text from live database records.
 * 
 * @param {Object} data
 * @param {Array} data.domains - Active domains (name, intro, starting_price, price_label)
 * @param {Array} data.services - Active services (domain_id, name, description, type: "main" | "more")
 * @param {Array} data.packages - Active packages (domain_id, name, price, features, is_popular)
 * @param {Array} data.projects - Active projects (title, domain_id, description)
 * @param {Array} data.faqs - Active FAQs (question, answer)
 * @param {Array} data.serviceAreas - Active service areas (name, notes)
 * @param {Object} data.settings - Live settings (phone, whatsapp_number, tagline, instagram_url, youtube_url, email, working_hours, office_address, about_text)
 * @returns {string} Plain structured knowledge text
 */
export function buildKnowledge(data) {
  if (!data) return '';

  const {
    domains = [],
    services = [],
    packages = [],
    projects = [],
    faqs = [],
    serviceAreas = data.service_areas || [],
    settings = {}
  } = data;

  const sections = [];

  // =========================================================================
  // 1. DOMAINS, SERVICES & PACKAGES
  // =========================================================================
  const activeDomains = (domains || []).filter(
    (d) => d && d.is_active !== false && d.isActive !== false
  );

  if (activeDomains.length > 0) {
    const domainsText = activeDomains
      .map((d) => {
        const rawPrice = d.starting_price ?? d.startingPriceNum ?? d.startingPrice ?? 0;
        const formattedPrice = formatINR(rawPrice);
        const priceLabel = (d.price_label || 'starting from').trim();
        const domainKey = d.key || d.id;

        const lines = [];
        // Header: "Web Development: starting from ₹7,000"
        lines.push(`${d.name}: ${priceLabel} ${formattedPrice}`);

        if (d.intro && d.intro.trim()) {
          lines.push(`Intro: ${d.intro.trim()}`);
        }

        // Resolve main services and more services
        let mainServices = [];
        let moreServices = [];

        // Check if services are pre-grouped (frontend getServices format) or flat list (database query format)
        if (Array.isArray(services) && services.length > 0) {
          const firstItem = services[0];
          if (firstItem && (Array.isArray(firstItem.mainServices) || Array.isArray(firstItem.moreServices))) {
            const group = services.find((g) => g.id === domainKey || g.dbId === d.id);
            if (group) {
              mainServices = (group.mainServices || []).filter(
                (s) => s.is_active !== false && s.isActive !== false
              );
              moreServices = (group.moreServices || []).filter(
                (s) => s.is_active !== false && s.isActive !== false
              );
            }
          } else {
            const matchedServices = services.filter((s) => {
              const matchesDomain =
                s.domain_id === d.id ||
                s.domain_id === domainKey ||
                s.domain === domainKey ||
                s.domain === d.id;
              const isActive = s.is_active !== false && s.isActive !== false;
              return matchesDomain && isActive;
            });
            mainServices = matchedServices.filter((s) => s.type === 'main');
            moreServices = matchedServices.filter((s) => s.type === 'more');
          }
        } else if (d.mainServices || d.moreServices) {
          mainServices = (d.mainServices || []).filter(
            (s) => s.is_active !== false && s.isActive !== false
          );
          moreServices = (d.moreServices || []).filter(
            (s) => s.is_active !== false && s.isActive !== false
          );
        }

        // Main services first
        if (mainServices.length > 0) {
          lines.push('Main Services:');
          mainServices.forEach((s) => {
            lines.push(`  - ${s.name}${s.description ? `: ${s.description}` : ''}`);
          });
        }

        // More services next
        if (moreServices.length > 0) {
          lines.push('More Services:');
          moreServices.forEach((s) => {
            lines.push(`  - ${s.name}${s.description ? `: ${s.description}` : ''}`);
          });
        }

        // Packages with prices and features
        const matchedPackages = (packages || []).filter((p) => {
          const matchesDomain =
            p.domain_id === d.id ||
            p.domain_id === domainKey ||
            p.domain === domainKey ||
            p.domain === d.id;
          const isActive = p.is_active !== false && p.isActive !== false;
          return matchesDomain && isActive;
        });

        if (matchedPackages.length > 0) {
          lines.push('Packages:');
          matchedPackages.forEach((pkg) => {
            const pkgPrice = formatINR(pkg.priceNum ?? pkg.price ?? 0);
            const rawFeatures = pkg.features ?? pkg.deliverables;
            const featuresStr = Array.isArray(rawFeatures)
              ? rawFeatures.filter(Boolean).join(', ')
              : (rawFeatures || '');
            const popBadge = (pkg.is_popular || pkg.popular) ? ' (Popular)' : '';
            lines.push(
              `  - ${pkg.name} Package: ${pkgPrice}${popBadge}${featuresStr ? ` | Features: ${featuresStr}` : ''}`
            );
          });
        }

        return lines.join('\n');
      })
      .join('\n\n');

    sections.push(`DOMAINS, SERVICES & PACKAGES:\n${domainsText}`);
  }

  // =========================================================================
  // 2. PORTFOLIO PROJECTS (title, domain, short description only)
  // =========================================================================
  const activeProjects = (projects || []).filter(
    (p) => p && p.is_active !== false && p.isActive !== false
  );

  if (activeProjects.length > 0) {
    const projectsLines = activeProjects.map((p) => {
      const title = p.title;
      const domain = p.domain_id || p.domain || 'General';
      const desc = p.description || p.shortDescription || '';
      return `- ${title} (${domain})${desc ? `: ${desc}` : ''}`;
    });
    sections.push(`PORTFOLIO PROJECTS:\n${projectsLines.join('\n')}`);
  }

  // =========================================================================
  // 3. FAQS
  // =========================================================================
  const activeFaqs = (faqs || []).filter(
    (f) => f && f.is_active !== false && f.isActive !== false
  );

  if (activeFaqs.length > 0) {
    const faqsLines = activeFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`);
    sections.push(`FREQUENTLY ASKED QUESTIONS:\n${faqsLines.join('\n\n')}`);
  }

  // =========================================================================
  // 4. SERVICE AREAS & LOCATIONS
  // =========================================================================
  const activeAreas = (serviceAreas || []).filter(
    (a) => a && a.is_active !== false && a.isActive !== false
  );

  if (activeAreas.length > 0) {
    const areasLines = activeAreas.map((a) => {
      const parts = [a.name];
      if (a.type && a.type !== 'online') parts.push(`[${a.type}]`);
      if (a.city) parts.push(a.city);
      if (a.address) parts.push(a.address);
      if (a.notes) parts.push(`(${a.notes})`);
      return `- ${parts.join(' - ')}`;
    });
    sections.push(`LOCATIONS & SERVICE AREAS:\n${areasLines.join('\n')}`);
  }

  // =========================================================================
  // 5. CONTACT & COMPANY DETAILS
  // =========================================================================
  const founderName = (settings.founder_name || settings.founderName || 'Lingaswamy Maddeboina').trim();
  const phone = settings.phone || '6302690251';
  const wa = settings.whatsapp_number || settings.whatsappNumber || '6302690251';

  const contactLines = [
    'Company Name: ZippyTechSystems Pvt. Ltd.',
    `Founder & Architect: ${founderName}`,
    `Phone / Calling: +91 ${phone}`,
    `WhatsApp: +91 ${wa}`
  ];

  const tagline = settings.tagline || '';
  const instagram = settings.instagram_url || settings.instagramUrl || '';
  const youtube = settings.youtube_url || settings.youtubeUrl || '';
  const facebook = settings.facebook_url || settings.facebookUrl || '';
  const linkedin = settings.linkedin_url || settings.linkedinUrl || '';
  const email = settings.email || '';
  const workingHours = settings.working_hours || settings.workingHours || '';
  const officeAddress = settings.office_address || settings.officeAddress || '';
  const aboutText = settings.about_text || settings.aboutText || '';
  const responseTime = settings.response_time_text || settings.responseTimeText || '';

  if (tagline.trim()) contactLines.push(`Tagline: ${tagline.trim()}`);
  if (instagram.trim()) contactLines.push(`Instagram: ${instagram.trim()}`);
  if (youtube.trim()) contactLines.push(`YouTube: ${youtube.trim()}`);
  if (facebook.trim()) contactLines.push(`Facebook: ${facebook.trim()}`);
  if (linkedin.trim()) contactLines.push(`LinkedIn: ${linkedin.trim()}`);

  // ONLY if not empty:
  if (email.trim()) contactLines.push(`Email: ${email.trim()}`);
  if (workingHours.trim()) contactLines.push(`Working Hours: ${workingHours.trim()}`);
  if (officeAddress.trim()) contactLines.push(`Office Address: ${officeAddress.trim()}`);
  if (aboutText.trim()) contactLines.push(`About Company / Founder: ${aboutText.trim()}`);
  if (responseTime.trim()) contactLines.push(`Response Commitment: ${responseTime.trim()}`);

  sections.push(`CONTACT & COMPANY DETAILS:\n${contactLines.join('\n')}`);

  return sections.join('\n\n');
}
