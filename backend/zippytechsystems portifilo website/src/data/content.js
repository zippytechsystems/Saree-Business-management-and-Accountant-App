/**
 * =========================================================================
 * ZippyTechSystems Pvt. Ltd. — Central Content Configuration
 * =========================================================================
 * All website text, services, prices, projects, founder info, and contact
 * data are managed in this single file. You can easily edit any details
 * here without modifying components.
 */

export const content = {
  // Company Information
  company: {
    name: 'ZippyTechSystems Pvt. Ltd.',
    shortName: 'ZippyTechSystems',
    legalName: 'ZippyTechSystems Pvt. Ltd.',
    tagline: 'Build • Automate • Grow',
    secondaryTagline: 'Smart Technology for a Stronger Tomorrow',
    headline: 'Websites, apps and AI for your business',
    subheadline:
      'Low budget, high value digital solutions for small and mid-size businesses in India. Fast delivery, rock-solid security, affordable pricing, and dedicated full support.',
    positioning:
      'Low budget, high value digital solutions for small and mid-size businesses in India.',
    location: 'Hyderabad, Telangana, India',
    yearFounded: '2024',
    currenciesAccepted: 'INR',
    priceRange: '₹6,000 - ₹50,000'
  },

  // Founder & Direct Contact
  founder: {
    name: 'Lingaswamy',
    role: 'Founder & Solutions Architect',
    bio: 'Experienced engineer passionate about democratizing modern software for Indian entrepreneurs. Speaks directly with clients — no middlemen, no corporate jargon.',
    phone: '9542439498',
    phoneFormatted: '+91 95424 39498',
    whatsappNumber: '919542439498',
    whatsappLink: 'https://wa.me/919542439498',
    email: 'contact@zippytechsystems.com'
  },

  // Trust Points (Displayed prominently across Hero, About, and Footer)
  trustPoints: [
    {
      id: 'fast-delivery',
      title: 'Fast Delivery',
      shortText: 'Rapid turnaround in 48h to 7 days',
      description:
        'Get your business online without frustrating delays. We ship production-ready solutions on strict timelines.',
      icon: 'Zap'
    },
    {
      id: 'reliable-secure',
      title: 'Reliable & Secure',
      shortText: '100% bug-tested, SSL encrypted & modern code',
      description:
        'Rock-solid architecture with 99.9% uptime, data privacy compliance, and clean, future-proof code.',
      icon: 'ShieldCheck'
    },
    {
      id: 'affordable-pricing',
      title: 'Affordable Pricing',
      shortText: 'Transparent INR rates from ₹6,000',
      description:
        'Honest pricing specifically calibrated for Indian SMBs. No hidden setup charges, no bloated agency retainers.',
      icon: 'BadgePercent'
    },
    {
      id: 'full-support',
      title: 'Full Support',
      shortText: 'Direct WhatsApp assistance & maintenance',
      description:
        'Post-launch handholding, regular updates, bug fixes, and continuous technical advisory directly from founder Lingaswamy.',
      icon: 'Headphones'
    }
  ],

  // Brand Theme Colors
  brandColors: {
    navy: '#0b1b4a',
    blue: '#1d5cf0', // Web Domain
    green: '#12a150', // App Domain
    purple: '#7a2fd0', // AI Domain
    yellow: '#ffe500', // Highlight / Primary CTA
    lightBg: '#f6f9ff'
  },

  // Services with Domain Colors & Starting Prices in INR
  services: [
    {
      id: 'web-development',
      slug: 'web-development',
      domain: 'web',
      domainLabel: 'Web Development',
      badgeColor: '#1d5cf0',
      gradient: 'linear-gradient(135deg, #1d5cf0 0%, #4f87ff 100%)',
      startingPrice: '₹7,000',
      startingPriceNum: 7000,
      priceNote: 'Starting price for standard business websites',
      summary:
        'High-speed, SEO-ready websites and online stores designed to turn visitors into paying customers.',
      primaryOfferings: [
        'Business websites and landing pages',
        'Services/products showcase websites',
        'E-commerce business websites',
        'Custom domain and hosting setup'
      ],
      allOfferings: [
        'Business websites and landing pages',
        'Services/products showcase websites',
        'E-commerce business websites with UPI payment gateway',
        'Custom domain, SSL certificate & high-speed cloud hosting',
        'Portfolio, restaurant, clinic and school websites',
        'Online booking and appointment scheduling sites',
        'Website redesign and modernization',
        'Search Engine Optimization (SEO) & Google My Business sync',
        'Payment gateway integration (Razorpay, PhonePe, Cashfree, UPI)',
        'Ongoing maintenance, regular backups & speed optimization'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in Web Development services starting from ₹7,000 for my business. Please share details and portfolio examples.",
      icon: 'Globe'
    },
    {
      id: 'app-development',
      slug: 'app-development',
      domain: 'app',
      domainLabel: 'App Development',
      badgeColor: '#12a150',
      gradient: 'linear-gradient(135deg, #12a150 0%, #34d399 100%)',
      startingPrice: '₹10,000',
      startingPriceNum: 10000,
      priceNote: 'Starting price for custom business applications',
      summary:
        'Tailor-made mobile & desktop applications for daily business accounting, billing, inventory, and staff operations.',
      primaryOfferings: [
        'Business management app',
        'Business accountant app',
        'E-commerce business app',
        'Staff management app'
      ],
      allOfferings: [
        'Custom business management app (ERP/CRM)',
        'Business accountant & bookkeeping app (Daily khata, GST ledger)',
        'E-commerce mobile app with customer cart & notifications',
        'Staff attendance, salary & roster management app',
        'Billing, POS (Point of Sale) & Barcode inventory tracking',
        'Customer database and credit (Udhar/Ledger) tracking',
        'Android and iOS cross-platform compatibility',
        'Offline-ready local sync with cloud database backup',
        'Google Play Store and Apple App Store publishing support',
        'Dedicated technical support and version upgrades'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in App Development services starting from ₹10,000 for my business. I'd like to discuss my app requirements.",
      icon: 'Smartphone'
    },
    {
      id: 'ai-automation',
      slug: 'ai-automation',
      domain: 'ai',
      domainLabel: 'AI Automation',
      badgeColor: '#7a2fd0',
      gradient: 'linear-gradient(135deg, #7a2fd0 0%, #a855f7 100%)',
      startingPrice: '₹6,000',
      startingPriceNum: 6000,
      priceNote: 'Starting price for workflow & chatbot automations',
      summary:
        'Automate routine tasks, answer inquiries 24/7 on WhatsApp, and capture qualified leads on autopilot.',
      primaryOfferings: [
        'AI chatbot (24x7 support)',
        'WhatsApp automation',
        'Lead management automation',
        'Follow-up reminders'
      ],
      allOfferings: [
        'AI chatbot (24x7 intelligent customer support)',
        'WhatsApp Business API automation & instant auto-responders',
        'Automated lead capture & CRM/Google Sheets sync',
        'Smart follow-up reminders & payment collection alerts',
        'Customer support ticket automation',
        'Automated invoice generation & PDF dispatch via WhatsApp',
        'Voice AI assistants for phone & website inquiries',
        'Google Sheets, Zoho, Excel & CRM integrations',
        'Custom workflow triggers (Email to WhatsApp, Webhook pipelines)',
        'Setup, prompt tuning & monthly performance maintenance'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in AI Automation solutions starting from ₹6,000 for my business. I want to automate customer inquiries and workflows.",
      icon: 'Cpu'
    }
  ],

  // Portfolio / Projects with Domain Tags & Easily Editable Data
  projects: [
    {
      id: 'saree-business-management-app',
      title: 'Saree Business Management & Accountant App',
      domain: 'app',
      domainLabel: 'App Development',
      domainColor: '#12a150',
      clientCategory: 'Textiles & Wholesale Retail',
      shortDescription:
        'Comprehensive mobile app managing saree stock catalog, wholesale & retail sales, barcode scanning, customer udhar ledger, and automated GST billing.',
      fullDescription:
        'Built for textile business owners in India to replace messy paper ledgers. Enables barcode creation, multi-price tier wholesale billing, daily sales cashbook tracking, and one-click WhatsApp invoice dispatch.',
      technologies: ['React Native', 'Android', 'Cloud Firestore', 'Offline-First DB', 'PDF Engine'],
      deliverables: ['Android APK', 'Cloud Admin Web Panel', 'Thermal Printer Integration', 'Play Store Release'],
      metrics: '40% Time Saved in Daily Bookkeeping',
      image: '/projects/saree-app.svg',
      linkText: 'Request Demo',
      featured: true
    },
    {
      id: 'clinic-appointment-booking-portal',
      title: 'Multispecialty Clinic & Doctor Appointment Portal',
      domain: 'web',
      domainLabel: 'Web Development',
      domainColor: '#1d5cf0',
      clientCategory: 'Healthcare & Medical',
      shortDescription:
        'Fast, mobile-friendly clinic website featuring instant slot booking, doctor profiles, patient intake forms, and automated WhatsApp appointment reminders.',
      fullDescription:
        'Engineered for maximum local SEO visibility and zero-friction mobile booking. Patients select specialists, choose time slots, and receive instant confirmation via SMS and WhatsApp.',
      technologies: ['React', 'Vite', 'Tailwind CSS', 'WhatsApp Business API', 'Google Maps API'],
      deliverables: ['Custom Domain Setup', 'Online Appointment Engine', 'Staff Reception Dashboard', 'Local SEO'],
      metrics: '3x Increase in Online Bookings',
      image: '/projects/clinic-web.svg',
      linkText: 'View Case Study',
      featured: true
    },
    {
      id: 'whatsapp-ai-lead-qualification-bot',
      title: '24/7 WhatsApp AI Customer Support & Lead Bot',
      domain: 'ai',
      domainLabel: 'AI Automation',
      domainColor: '#7a2fd0',
      clientCategory: 'Real Estate & Coaching',
      shortDescription:
        'Smart conversational AI running 24/7 on WhatsApp that answers service queries, qualifies customer budgets, and synchronizes leads directly to Google Sheets.',
      fullDescription:
        'Handles 100+ simultaneous conversations without missing a single lead. Understands mixed English & regional phrasing, answers pricing questions, and alerts sales reps when hot leads arrive.',
      technologies: ['WhatsApp Cloud API', 'OpenAI / Gemini', 'Node.js', 'Google Sheets Integration'],
      deliverables: ['WhatsApp Bot Workflow', 'Live Google Sheets Sync', 'Instant Admin SMS Alerts'],
      metrics: '100% Instant Response Rate',
      image: '/projects/whatsapp-ai.svg',
      linkText: 'Test Live Bot',
      featured: true
    },
    {
      id: 'fashion-ecommerce-store',
      title: 'Boutique E-Commerce Store with UPI Instant Checkout',
      domain: 'web',
      domainLabel: 'Web Development',
      domainColor: '#1d5cf0',
      clientCategory: 'Fashion & Retail',
      shortDescription:
        'Ultra-fast storefront with zero-lag product browsing, size filters, direct UPI payment (PhonePe/GPay), and automated order tracking via WhatsApp.',
      fullDescription:
        'Built to deliver sub-second load times on mobile 4G networks. Features categorized catalog filtering, shopping cart, coupon codes, and automated dispatch alerts.',
      technologies: ['Next.js / React', 'Razorpay & UPI', 'Cloud Storage', 'SEO Schema'],
      deliverables: ['E-Commerce Web Store', 'Payment Gateway Integration', 'Inventory Management Panel'],
      metrics: '2.4x Higher Mobile Checkout Rate',
      image: '/projects/ecommerce-web.svg',
      linkText: 'Explore Store',
      featured: false
    },
    {
      id: 'staff-attendance-payroll-app',
      title: 'Staff Management & Geo-Fenced Attendance App',
      domain: 'app',
      domainLabel: 'App Development',
      domainColor: '#12a150',
      clientCategory: 'SME Operations & Manufacturing',
      shortDescription:
        'Mobile app allowing shop and factory staff to check in with selfie and GPS verification, log overtime, submit leave requests, and calculate monthly salary.',
      fullDescription:
        'Replaces physical biometric fingerprint hardware with secure GPS geo-fenced smartphone punches. Owners get real-time attendance dashboards and 1-click payslip generation.',
      technologies: ['Flutter / React Native', 'GPS Geolocation', 'Cloud Database', 'Automated PDF Payslips'],
      deliverables: ['Android App for Staff', 'Manager Web Portal', 'Attendance Export to Excel'],
      metrics: 'Zero Paperwork for 50+ Staff',
      image: '/projects/staff-app.svg',
      linkText: 'Request App Demo',
      featured: false
    },
    {
      id: 'automated-invoicing-followup-system',
      title: 'Automated Invoice Generation & WhatsApp Reminders',
      domain: 'ai',
      domainLabel: 'AI Automation',
      domainColor: '#7a2fd0',
      clientCategory: 'B2B Services & Trading',
      shortDescription:
        'Automated workflow connecting order forms to instant branded PDF invoice creation and automated WhatsApp payment reminders on overdue dates.',
      fullDescription:
        'Eliminates manual invoice drafting and tedious payment chasing. Generates professional GST-compliant PDF bills, sends them automatically to customers upon order confirmation, and triggers gentle reminders.',
      technologies: ['Cloud Functions', 'PDF Generator', 'WhatsApp Business API', 'CRM Webhooks'],
      deliverables: ['Automated Billing Pipeline', 'Custom Invoice Template', 'Payment Status Dashboard'],
      metrics: '95% Faster Payment Follow-ups',
      image: '/projects/invoice-ai.svg',
      linkText: 'See How It Works',
      featured: false
    }
  ],

  // Why Choose Us / Value Proposition
  whyChooseUs: [
    {
      id: 'low-budget-high-value',
      title: 'Low Budget, High Value',
      description:
        'We believe premium digital infrastructure shouldn’t cost lakhs. Our lean engineering model delivers enterprise-grade software at prices accessible to every small business in India.',
      icon: 'TrendingUp'
    },
    {
      id: 'rapid-turnaround',
      title: 'Fast & Predictable Delivery',
      description:
        'No endless back-and-forth or multi-month delays. We operate with sprint milestones, delivering live websites in 3 to 7 days and apps in 2 to 3 weeks.',
      icon: 'Clock'
    },
    {
      id: 'direct-founder-access',
      title: 'Direct Access to Lingaswamy',
      description:
        'You communicate directly with the technical founder. No non-technical account managers or missed requirements — just direct, practical execution.',
      icon: 'UserCheck'
    },
    {
      id: 'end-to-end-solution',
      title: 'Complete 360° Tech Partner',
      description:
        'From website creation to mobile apps, domain setup, payment gateways, and WhatsApp AI automations, we handle everything under one roof.',
      icon: 'Layers'
    }
  ],

  // Company Story & Mission
  about: {
    missionTitle: 'Smart Technology for a Stronger Tomorrow',
    missionStatement:
      'Our mission is simple: eliminate technical barriers for Indian small and mid-sized enterprises. By combining modern web design, scalable mobile applications, and intelligent AI automations, we empower business owners to compete with industry giants without draining their capital.',
    story: [
      'ZippyTechSystems was established by Lingaswamy after witnessing countless local shop owners, clinics, and businesses struggle with overpriced software agencies and clunky outdated tools.',
      'Most small business owners in India either get stuck with rigid templates that break easily or are quoted exorbitant fees by metropolitan agencies. We bridge this gap by offering clean, custom, low-budget, high-value digital solutions.',
      'Whether you need a sleek ₹7,000 showcase website, a ₹10,000 custom inventory app, or a ₹6,000 24/7 WhatsApp AI bot, we build with precision, transparency, and lifelong commitment to your growth.'
    ],
    milestones: [
      { number: '100+', label: 'Happy Inquiries & Clients' },
      { number: '₹6k', label: 'Starting Price in INR' },
      { number: '48h', label: 'Fastest Deployment Time' },
      { number: '99.9%', label: 'Uptime & Reliability' }
    ]
  },

  // Navigation Links
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/#services' },
    { label: 'Portfolio', path: '/projects' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ],

  // Footer Navigation
  footerLinks: {
    services: [
      { label: 'Web Development (from ₹7,000)', path: '/services/web-development' },
      { label: 'App Development (from ₹10,000)', path: '/services/app-development' },
      { label: 'AI Automation (from ₹6,000)', path: '/services/ai-automation' }
    ],
    quickLinks: [
      { label: 'Home', path: '/' },
      { label: 'All Services', path: '/#services' },
      { label: 'Portfolio & Projects', path: '/projects' },
      { label: 'About Founder Lingaswamy', path: '/about' },
      { label: 'Get in Touch', path: '/contact' }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' }
    ]
  }
};

/**
 * Helper to build custom WhatsApp URL with prefilled text
 */
export function buildWhatsAppUrl(message) {
  const base = `https://wa.me/${content.founder.whatsappNumber}`;
  const text = encodeURIComponent(message || "Hi Lingaswamy, I'd like to discuss a project with ZippyTechSystems.");
  return `${base}?text=${text}`;
}

/**
 * Helper to build enquiry form WhatsApp URL
 */
export function buildEnquiryWhatsAppUrl({ name, phone, service, message }) {
  const text = `*New Project Enquiry — ZippyTechSystems*
-----------------------------
👤 *Name:* ${name || 'N/A'}
📱 *Phone:* ${phone || 'N/A'}
🛠️ *Service Needed:* ${service || 'General Enquiry'}
💬 *Project Details:* ${message || 'I would like more information and a price quote.'}
-----------------------------
(Sent from zippytechsystems.com portfolio website)`;

  return buildWhatsAppUrl(text);
}
