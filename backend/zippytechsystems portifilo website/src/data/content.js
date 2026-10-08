/**
 * =========================================================================
 * ZippyTechSystems Pvt. Ltd. — Central Content Configuration
 * =========================================================================
 * All website text, services, prices, copy, and projects live in this single file.
 * Structured with i18n readiness so a Telugu version (e.g. content.te) can be
 * integrated seamlessly without touching any component logic.
 */

export const content = {
  // Localization Meta
  locale: 'en',
  supportedLocales: ['en', 'te'],

  // Company Information
  company: {
    name: 'ZippyTechSystems Pvt. Ltd.',
    shortName: 'ZippyTechSystems',
    legalName: 'ZippyTechSystems Pvt. Ltd.',
    tagline: 'Build • Automate • Grow',
    secondaryTagline: 'Smart Technology for a Stronger Tomorrow',
    headline: 'Websites, apps and AI for your business',
    subheadline:
      'Low budget, high value digital solutions for small and mid-size businesses in India. Fast delivery, reliable and secure, affordable pricing, full support.',
    positioning:
      'Low budget, high value digital solutions for small and mid-size businesses in India.',
    location: 'Hyderabad, Telangana, India',
    yearFounded: '2024',
    currenciesAccepted: 'INR',
    priceRange: '₹6,500 - ₹50,000'
  },

  // Founder & Direct Contact Person
  founder: {
    name: 'Lingaswamy Maddeboina',
    role: 'Founder & Solutions Architect',
    bio: 'Direct technical guidance without middlemen or inflated agency fees. Experienced in building practical web platforms, business accounting apps, and AI automations for growing Indian enterprises.',
    phone: '6302690251',
    phoneFormatted: '+91 63026 90251',
    phoneCall: '+916302690251',
    whatsappNumber: '916302690251',
    whatsappLink: 'https://wa.me/916302690251',
    email: 'contact@zippysoftwares.in'
  },

  // Social Media Links (Muted, optional-looking)
  social: {
    instagram: 'https://www.instagram.com/zippytechsystems',
    youtube: 'https://www.youtube.com/@zippytechsystems'
  },

  // Trust Points (Used for Bento Grid and Hero pillars with zero fabricated stats)
  trustPoints: [
    {
      id: 'fast-delivery',
      title: 'Fast Delivery',
      shortText: 'Rapid turnaround without delays',
      description: 'Get your business live quickly without frustrating delays. We ship clean, tested code on clear schedules.',
      icon: 'Zap'
    },
    {
      id: 'reliable-secure',
      title: 'Reliable and Secure',
      shortText: 'Bug-tested code & cloud protection',
      description: 'Built on rock-solid architecture with SSL security, automated cloud backups, and data protection.',
      icon: 'ShieldCheck'
    },
    {
      id: 'affordable-pricing',
      title: 'Affordable Pricing',
      shortText: 'Transparent rates for Indian businesses',
      description: 'Low-budget, high-value packages designed specifically for small and mid-size businesses in India.',
      icon: 'BadgePercent'
    },
    {
      id: 'full-support',
      title: 'Full Support',
      shortText: 'Direct WhatsApp assistance & care',
      description: 'Dedicated post-launch guidance, regular updates, and direct founder support whenever you need help.',
      icon: 'Headphones'
    }
  ],

  // Brand Colors
  brandColors: {
    navy: '#0b1b4a',
    blue: '#1d5cf0', // Web Domain
    green: '#12a150', // App Domain
    purple: '#7a2fd0', // AI Domain
    yellow: '#ffe500', // Highlight / Primary CTA
    lightBg: '#f6f9ff'
  },

  // 3 Service Domains (Rendered ONE BY ONE as separate full-width stacked sections)
  services: [
    {
      id: 'web-development',
      slug: 'web-development',
      domain: 'web',
      domainLabel: 'Web Development',
      badgeColor: '#1d5cf0',
      gradient: 'linear-gradient(135deg, #1d5cf0 0%, #3b82f6 100%)',
      introLine: 'A website that helps your business grow.',
      startingPrice: '₹6,500',
      startingPriceNum: 6500,
      priceNote: 'Starting price in INR',
      conceptCopy:
        'A good website brings your business online, builds trust, shows your services and products to customers 24 hours a day, and helps you get more enquiries and grow your business.',
      mainServicesTitle: 'Our Main Services',
      mainServices: [
        {
          title: 'Business Websites & Landing Pages',
          desc: 'High-converting, professional web pages that establish immediate credibility and capture customer enquiries.'
        },
        {
          title: 'Services / Products Showcase Websites',
          desc: 'Beautiful, visual catalog websites displaying your complete offerings, pricing, and client testimonials.'
        },
        {
          title: 'E-Commerce Business Websites',
          desc: 'Full online shopping stores with fast mobile checkout, UPI / Razorpay payment gateways, and order tracking.'
        },
        {
          title: 'Custom Domain & Hosting Setup',
          desc: 'Complete end-to-end setup of your custom .com / .in domain, high-speed cloud hosting, and free SSL certificate.'
        }
      ],
      moreServicesTitle: 'More Web Services We Provide',
      moreServices: [
        'Portfolio, restaurant, clinic, school and real estate websites',
        'Booking and appointment scheduling websites',
        'Website redesign and modernization',
        'Search Engine Optimization (SEO) & Google Business Profile setup',
        'Payment gateway integration (Razorpay, PhonePe, UPI)',
        'Ongoing website maintenance, security updates and yearly support'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in Web Development services starting from ₹6,500. I need a website for my business. Please share details.",
      icon: 'Globe'
    },
    {
      id: 'app-development',
      slug: 'app-development',
      domain: 'app',
      domainLabel: 'App Development',
      badgeColor: '#12a150',
      gradient: 'linear-gradient(135deg, #12a150 0%, #10b981 100%)',
      introLine: 'Ready-made business apps for shops, small or big.',
      startingPrice: '₹20,000',
      startingPriceNum: 20000,
      priceNote: 'Starting price in INR',
      conceptCopy:
        'We build accountant apps and business management apps for small and big shops. The app handles billing, accounts, stock and staff records automatically, so the shop owner can save the salary of a full-time accountant and still keep accurate accounts.',
      accountantCallout: {
        title: 'Save Accountant Salary',
        tagline: 'Run your shop accounts on autopilot without paying high monthly accountant retainers.',
        benefits: [
          'Less manual work: Automated billing, GST invoices, and daily ledger entries.',
          'Fewer calculation mistakes: Tamper-proof calculations for stock, discounts, and customer credit.',
          'Accounts available on your phone anytime: Check daily sales, cash in hand, and pending udhar 24/7.'
        ]
      },
      mainServicesTitle: 'Our Main Services',
      mainServices: [
        {
          title: 'Accountant App',
          desc: 'Automates daily khata, ledger entries, customer credit balance, GST invoicing, and financial reports.'
        },
        {
          title: 'Business Management App',
          desc: 'Centralized mobile management app tracking inventory, purchases, supplier payments, and shop operations.'
        },
        {
          title: 'E-Commerce Business App',
          desc: 'Dedicated Android & iOS shopping app for your shop with instant push notifications and fast checkout.'
        },
        {
          title: 'Staff Management App',
          desc: 'Digital staff attendance, overtime tracker, salary slip calculator, and daily staff shift roster.'
        }
      ],
      moreServicesTitle: 'More App Services We Provide',
      moreServices: [
        'Billing / POS and barcode inventory apps',
        'GST invoice & thermal receipt printing app',
        'CRM and customer loyalty management app',
        'Delivery partner and appointment booking apps',
        'School / college administration apps',
        'Google Play Store and Apple App Store publishing',
        'Continuous app maintenance, feature upgrades and bug fixes'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in App Development services starting from ₹20,000 for my shop/business. I would like to discuss my requirements.",
      icon: 'Smartphone'
    },
    {
      id: 'ai-automation',
      slug: 'ai-automation',
      domain: 'ai',
      domainLabel: 'AI Automation',
      badgeColor: '#7a2fd0',
      gradient: 'linear-gradient(135deg, #7a2fd0 0%, #9333ea 100%)',
      introLine: 'Never miss a customer enquiry again.',
      startingPrice: '₹7,500',
      startingPriceNum: 7500,
      priceNote: 'Starting price in INR',
      conceptCopy:
        'Enquiries are answered instantly on WhatsApp, phone and website even when the owner is busy or the shop is closed, so no lead is lost and more enquiries turn into customers.',
      mainServicesTitle: 'Our Main Services',
      mainServices: [
        {
          title: 'WhatsApp Automation',
          desc: 'Automatic replies to customers on WhatsApp, greeting new visitors, sharing catalogs, and qualifying leads.'
        },
        {
          title: 'AI Voice Agent',
          desc: 'Answers business enquiry calls intelligently, provides details, and schedules callbacks.'
        },
        {
          title: 'AI Chatbot for Your Website',
          desc: 'Handles customer enquiries 24x7 directly on your website and captures contact numbers.'
        },
        {
          title: 'Lead Management Automation',
          desc: 'Syncs incoming customer enquiries instantly to Google Sheets, CRM, and sales team phones.'
        },
        {
          title: 'Follow-Up Reminders',
          desc: 'Automated follow-up messages on WhatsApp for pending quotations and customer decisions.'
        },
        {
          title: 'Customer Support Automation',
          desc: 'Resolves frequent customer queries (timings, pricing, location, order status) without manual effort.'
        }
      ],
      moreServicesTitle: 'More AI & Automation Services We Provide',
      moreServices: [
        'Auto invoices and payment reminder workflows',
        'Email and social media inquiry automation',
        'Data entry and document processing automation',
        'AI content and marketing copy tools',
        'Google Sheets, Zoho, Excel and CRM integrations',
        'Custom AI agents tailored for your unique business operations'
      ],
      whatsappMessage:
        "Hi Lingaswamy, I'm interested in AI Automation starting from ₹7,500. I want to automate my customer enquiries and WhatsApp replies.",
      icon: 'Cpu'
    }
  ],

  // Projects / Portfolio Grid
  projects: [
    {
      id: 'saree-business-management-app',
      title: 'Saree Business Management & Accountant App',
      domain: 'app',
      domainLabel: 'App Development',
      domainColor: '#12a150',
      clientCategory: 'Textiles & Wholesale Retail',
      shortDescription:
        'Complete shop management app handling saree stock catalog, barcode billing, customer udhar khata, and automated GST invoice dispatch.',
      technologies: ['React Native', 'Android', 'Offline DB', 'Cloud Sync'],
      metrics: 'Save Full-Time Accountant Salary',
      image: '/projects/saree-app.svg'
    },
    {
      id: 'clinic-appointment-booking-portal',
      title: 'Clinic & Doctor Appointment Website',
      domain: 'web',
      domainLabel: 'Web Development',
      domainColor: '#1d5cf0',
      clientCategory: 'Healthcare & Medical',
      shortDescription:
        'Fast clinic website with online appointment booking, doctor profiles, Google Maps integration, and automated WhatsApp booking reminders.',
      technologies: ['React', 'Vite', 'SEO Schema', 'WhatsApp API'],
      metrics: '3x More Online Appointments',
      image: '/projects/clinic-web.svg'
    },
    {
      id: 'whatsapp-ai-lead-qualification-bot',
      title: '24/7 WhatsApp AI Customer Support & Lead Bot',
      domain: 'ai',
      domainLabel: 'AI Automation',
      domainColor: '#7a2fd0',
      clientCategory: 'Real Estate & Coaching',
      shortDescription:
        'Intelligent WhatsApp bot that replies instantly to customers 24 hours a day, qualifies buyer budget, and syncs leads directly to Google Sheets.',
      technologies: ['WhatsApp Cloud API', 'AI Agent', 'Google Sheets'],
      metrics: 'Instant Replies 24 Hours a Day',
      image: '/projects/whatsapp-ai.svg'
    },
    {
      id: 'fashion-ecommerce-store',
      title: 'Boutique E-Commerce Store with UPI Checkout',
      domain: 'web',
      domainLabel: 'Web Development',
      domainColor: '#1d5cf0',
      clientCategory: 'Fashion & Retail',
      shortDescription:
        'Fast mobile shopping website featuring catalog filtering, shopping cart, UPI payment integration (PhonePe/GPay), and WhatsApp order tracking.',
      technologies: ['React', 'Razorpay & UPI', 'Mobile First'],
      metrics: 'Sub-second Mobile Load Speed',
      image: '/projects/ecommerce-web.svg'
    },
    {
      id: 'staff-attendance-payroll-app',
      title: 'Staff Management & Geo-Fenced Attendance App',
      domain: 'app',
      domainLabel: 'App Development',
      domainColor: '#12a150',
      clientCategory: 'SME Operations & Manufacturing',
      shortDescription:
        'Mobile app allowing shop and factory staff to punch attendance with selfie and GPS verification, calculate overtime, and generate monthly salary slips.',
      technologies: ['Mobile App', 'GPS Verification', 'PDF Payslips'],
      metrics: 'Replaces Costly Biometric Machines',
      image: '/projects/staff-app.svg'
    },
    {
      id: 'automated-invoicing-followup-system',
      title: 'Automated Invoice Generation & WhatsApp Reminders',
      domain: 'ai',
      domainLabel: 'AI Automation',
      domainColor: '#7a2fd0',
      clientCategory: 'B2B Services & Trading',
      shortDescription:
        'Automated workflow connecting order forms to instant PDF invoice creation and automated WhatsApp payment reminders on overdue dates.',
      technologies: ['Cloud Pipeline', 'PDF Generator', 'WhatsApp API'],
      metrics: '95% Faster Payment Follow-ups',
      image: '/projects/invoice-ai.svg'
    }
  ],

  // Why Choose Us
  whyChooseUs: [
    {
      id: 'low-budget-high-value',
      title: 'Low Budget, High Value',
      description:
        'Enterprise-grade code and designs priced realistically for Indian small and mid-size businesses. No agency markups.',
      icon: 'TrendingUp'
    },
    {
      id: 'rapid-turnaround',
      title: 'Fast Delivery',
      description:
        'No multi-month delays. We deliver live websites in 48 hours to 7 days, and mobile applications in 2 to 3 weeks.',
      icon: 'Clock'
    },
    {
      id: 'direct-founder-access',
      title: 'Direct Access to Lingaswamy',
      description:
        'You speak directly with the founder and lead engineer. Direct WhatsApp access means quick decisions and zero miscommunications.',
      icon: 'UserCheck'
    },
    {
      id: 'full-support',
      title: 'Full Post-Launch Support',
      description:
        'We do not disappear after launch. We provide ongoing support, bug fixes, updates, and technical guidance.',
      icon: 'ShieldCheck'
    }
  ],

  // About Section & Story
  about: {
    missionTitle: 'Smart Technology for a Stronger Tomorrow',
    missionStatement:
      'We believe every shop owner, clinic, and growing enterprise in India deserves modern software that works smoothly, saves time, and does not cost a fortune.',
    story: [
      'ZippyTechSystems was founded by Lingaswamy to provide affordable, transparent, and high-quality software solutions specifically for Indian SMBs.',
      'Big agencies charge lakhs for basic setups, while generic templates fail when your business expands. We provide custom websites, business accountant apps, and WhatsApp AI automations that bring tangible value from day one.',
      'With direct founder communication on WhatsApp, honest starting prices (Web from ₹6.5k, App from ₹20k, AI from ₹7.5k), and rapid delivery, we partner with you for long-term growth.'
    ],
    milestones: [
      { number: '₹6,500', label: 'Starting Price in INR' },
      { number: '48h', label: 'Fastest Delivery Milestone' },
      { number: '100%', label: 'Direct Founder Line' },
      { number: '99.9%', label: 'Uptime & Reliability' }
    ]
  },

  // Client Testimonials
  testimonials: [
    {
      id: 'test-1',
      clientName: 'Dr. Ramesh Reddy',
      roleOrCompany: 'Reddy Multi-Specialty Dental Clinic, Hyderabad',
      domain: 'web',
      rating: 5,
      content: 'Lingaswamy built our clinic showcase website in just 4 days. Patients can now easily view treatments, doctors, and book appointments directly on WhatsApp. Super fast delivery and extremely affordable!'
    },
    {
      id: 'test-2',
      clientName: 'Suresh Patel',
      roleOrCompany: 'Patel Wholesale Electricals, Secunderabad',
      domain: 'app',
      rating: 5,
      content: 'The custom billing and stock app replaced our expensive accounting software. We save at least ₹18,000 every month on accountant salaries, and I can check my shop daily sales on my phone from anywhere.'
    },
    {
      id: 'test-3',
      clientName: 'Vikram Varma',
      roleOrCompany: 'Varma Logistics & Transport, Vijayawada',
      domain: 'ai',
      rating: 5,
      content: 'The 24/7 WhatsApp AI automation handles late-night freight rate queries instantly. We turned 35% more leads into booked orders within the first month itself.'
    },
    {
      id: 'test-4',
      clientName: 'Ananya Sharma',
      roleOrCompany: 'TrendBoutique Ethnic Studio, Bangalore',
      domain: 'web',
      rating: 5,
      content: 'Great design aesthetic, mobile responsive, and honest pricing. Lingaswamy is always available on phone and WhatsApp without any corporate bureaucracy.'
    }
  ],

  // Frequently Asked Questions
  faqs: [
    {
      id: 'faq-1',
      category: 'General',
      question: 'What makes ZippyTechSystems different from other agencies in India?',
      answer: 'We eliminate bloated agency overhead and middleman layers. You communicate directly with founder Lingaswamy on WhatsApp or call. We provide transparent starting prices (Web from ₹6.5k, App from ₹20k, AI from ₹7.5k) and deliver production-ready software in 48 hours to 7 days.'
    },
    {
      id: 'faq-2',
      category: 'Web',
      question: 'What is included in the ₹6,500 Web Development starting package?',
      answer: 'It includes a modern responsive business website, custom domain connection, lightning-fast cloud hosting setup, mobile optimization, WhatsApp direct integration, contact form, and Google Search Console/SEO basics.'
    },
    {
      id: 'faq-3',
      category: 'App',
      question: 'How does your business app help save on accountant salaries?',
      answer: 'Our custom mobile & web applications automate day-to-day billing, GST invoice generation, thermal print receipts, customer udhar (credit ledger), and stock levels. Because calculations and reports are automated and tamper-proof, shop owners do not need to hire a full-time accountant for daily entries.'
    },
    {
      id: 'faq-4',
      category: 'AI',
      question: 'How does WhatsApp AI Automation work when our shop is closed?',
      answer: 'Our AI agent connects to your WhatsApp business number. When a customer messages at night or during peak rush hours, the AI answers product questions, shares price lists or catalogs, collects their requirements, and syncs their phone number to your dashboard or Google Sheet.'
    },
    {
      id: 'faq-5',
      category: 'General',
      question: 'What are your payment terms and milestones?',
      answer: 'We work with clear, risk-free milestones: a small advance to initiate the architecture and wireframing, milestone reviews where you inspect the live demo, and final payment upon your 100% satisfaction and handover.'
    },
    {
      id: 'faq-6',
      category: 'General',
      question: 'Do you offer ongoing support and maintenance?',
      answer: 'Yes! All projects come with 30 days of complimentary post-launch support. Afterward, we provide affordable yearly maintenance packages covering security updates, server monitoring, backups, and feature tweaks.'
    }
  ],

  // Solution Packages
  packages: [
    {
      id: 'pkg-web-starter',
      domain: 'web',
      name: 'Starter Web Presence',
      price: '₹6,500',
      tagline: 'Best for local shops, professionals, and new businesses',
      deliverables: [
        'Single-page fast responsive landing site',
        'Direct WhatsApp chat button & Call CTA',
        'Mobile, tablet & desktop optimized',
        'Google Maps & Google Business profile link',
        'Free SSL certificate & fast cloud hosting setup',
        '7 days turnaround time'
      ],
      popular: false
    },
    {
      id: 'pkg-web-business',
      domain: 'web',
      name: 'Business Growth Showcase',
      price: '₹14,500',
      tagline: 'For established businesses wanting full catalog showcases',
      deliverables: [
        'Up to 5 pages (Home, About, Services, Gallery, Contact)',
        'Full service/product visual showcase catalog',
        'Customer enquiry form with database & WhatsApp sync',
        'On-page SEO optimization & metadata',
        'Google Search Console indexing',
        '30 days free support & maintenance'
      ],
      popular: true
    },
    {
      id: 'pkg-app-billing',
      domain: 'app',
      name: 'Shop Billing & Udhar App',
      price: '₹20,000',
      tagline: 'Save accountant salary with automated shop records',
      deliverables: [
        'Fast barcode scanning & POS billing',
        'GST & non-GST thermal receipt printing',
        'Customer credit ledger (Udhar tracking & WhatsApp reminders)',
        'Daily cash in hand & profit report on mobile',
        'Tamper-proof calculations & offline support',
        'Free staff training session'
      ],
      popular: true
    },
    {
      id: 'pkg-app-enterprise',
      domain: 'app',
      name: 'Complete Business Management App',
      price: '₹22,000',
      tagline: 'Multi-store, staff attendance, and inventory management',
      deliverables: [
        'Multi-user roles (Owner, Manager, Cashier)',
        'Live warehouse stock alerts & supplier order records',
        'Staff attendance & payroll calculation',
        'Cloud backup & multi-device sync',
        'Android APK + Web dashboard included',
        '3 months priority bugfix guarantee'
      ],
      popular: false
    },
    {
      id: 'pkg-ai-whatsapp',
      domain: 'ai',
      name: 'WhatsApp 24/7 Auto-Responder',
      price: '₹7,500',
      tagline: 'Never lose a customer lead after working hours',
      deliverables: [
        'Official or QR WhatsApp automation setup',
        'Instant replies with price cards & catalog PDF',
        'Lead qualification & phone number capture',
        'Instant alert on owner mobile for hot leads',
        'Custom business greeting & FAQ answering',
        'Quick 48-hour deployment'
      ],
      popular: true
    },
    {
      id: 'pkg-ai-agent',
      domain: 'ai',
      name: 'AI Voice & Lead Pipeline Suite',
      price: '₹16,000',
      tagline: 'Full intelligent customer qualification & automated CRM',
      deliverables: [
        'AI Voice Agent for telephone enquiry triage',
        'Website AI chatbot widget trained on your business',
        'Sync leads automatically to Google Sheets & CRM',
        'Automated follow-up WhatsApp reminders for pending quotes',
        'Weekly analytics of customer questions and conversions',
        'Dedicated onboarding & testing'
      ],
      popular: false
    }
  ],

  // Navigation Links
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'Web', path: '/#web-development' },
    { label: 'Apps', path: '/#app-development' },
    { label: 'AI Automation', path: '/#ai-automation' },
    { label: 'Portfolio', path: '/projects' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ],

  // Footer Navigation
  footerLinks: {
    services: [
      { label: 'Web Development (from ₹6,500)', path: '/#web-development' },
      { label: 'App Development (from ₹20,000)', path: '/#app-development' },
      { label: 'AI Automation (from ₹7,500)', path: '/#ai-automation' }
    ],
    quickLinks: [
      { label: 'Home', path: '/' },
      { label: 'All Projects', path: '/projects' },
      { label: 'About Founder Lingaswamy', path: '/about' },
      { label: 'Contact Us', path: '/contact' }
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
(Sent from zippysoftwares.in portfolio website)`;

  return buildWhatsAppUrl(text);
}
