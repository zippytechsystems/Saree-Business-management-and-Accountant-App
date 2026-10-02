export const projectsData = [
  {
    id: 'smart-farming-platform',
    title: 'Smart Farming Agriculture Decision Platform',
    slug: 'smart-farming-platform',
    type: 'Demo Project',
    category: 'Web Application / Data Solution',
    filterCategory: 'Web',
    shortDescription: 'Data-driven agricultural management console integrating soil telemetry, weather forecast models, and crop cycle advisory charts.',
    fullDescription: 'An interactive decision-support platform designed to help modern farm operators visualize field telemetry, track microclimate moisture shifts, and optimize irrigation schedules using data analytics.',
    accentColor: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    iconName: 'Sprout',
    technologies: ['React', 'Node.js', 'Chart.js', 'PostgreSQL', 'REST APIs', 'Vercel'],
    keyHighlights: [
      'Real-time IoT soil sensor telemetry streaming simulation',
      'Dynamic irrigation scheduling algorithms based on moisture thresholds',
      'Yield prediction models with comparative historical season graphs',
      'Exportable CSV and PDF agronomy audit reports'
    ],
    architecture: 'Single-page responsive application built with React and custom CSS modules. Backend telemetry simulator powered by Node.js microservices with PostgreSQL timeseries storage.',
    demoMetrics: [
      { label: 'Field Sensors', value: '24 Nodes' },
      { label: 'Data Refresh', value: '1.2s' },
      { label: 'Water Efficiency', value: '+28%' }
    ]
  },
  {
    id: 'zippymeet',
    title: 'ZippyMeet',
    slug: 'zippymeet',
    type: 'Concept Project',
    category: 'Web Application',
    filterCategory: 'Web',
    shortDescription: 'Collaborative team meeting workspace with synchronized agenda items, automated action-item tracking, and instant transcript summaries.',
    fullDescription: 'A streamlined web application concept tailored for distributed engineering teams. Integrates scheduled agenda countdowns, collaborative markdown note taking, and post-session task assignments in a single unified interface.',
    accentColor: '#00F2FE',
    gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
    iconName: 'Video',
    technologies: ['React', 'WebSockets', 'Node.js', 'Redis', 'CSS Grid', 'Tailored Audio API'],
    keyHighlights: [
      'Synchronous agenda progress indicators with speaker timer cues',
      'Live markdown collaborative scratchpad with auto-save',
      'Action item assignment directly linked to team task trackers',
      'Low-latency status broadcasting via WebSocket channels'
    ],
    architecture: 'Client-side reactive state managed via lightweight context stores. WebSocket server orchestrates real-time broadcast of agenda transitions and collaborative text updates.',
    demoMetrics: [
      { label: 'Sync Latency', value: '<45ms' },
      { label: 'Protocol', value: 'WSS / TLS' },
      { label: 'Design System', value: 'Custom Dark' }
    ]
  },
  {
    id: 'zippyservice',
    title: 'ZippyService',
    slug: 'zippyservice',
    type: 'Concept Project',
    category: 'Service Marketplace Web Application',
    filterCategory: 'Web',
    shortDescription: 'On-demand local service marketplace connecting verified home repair specialists with residential clients via smart scheduling.',
    fullDescription: 'A comprehensive marketplace concept demonstrating booking workflows, quote comparisons, interactive calendar slot reservations, and multi-party status notifications for trade professionals.',
    accentColor: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    iconName: 'Wrench',
    technologies: ['React', 'JavaScript', 'REST APIs', 'Supabase', 'CSS Flexbox', 'Stripe Mock'],
    keyHighlights: [
      'Multi-step booking wizard with dynamic pricing estimation',
      'Provider portfolio showcase with verified credential badges',
      'Interactive availability calendar with conflict avoidance logic',
      'Responsive design delivering desktop and mobile tablet parity'
    ],
    architecture: 'Component-driven front-end communicating with relational database schemas for providers, bookings, and customer profiles with role-based dashboard views.',
    demoMetrics: [
      { label: 'Booking Steps', value: '3 Steps' },
      { label: 'Availability Check', value: 'Instant' },
      { label: 'User Roles', value: 'Client / Pro' }
    ]
  },
  {
    id: 'zippyfin-services',
    title: 'ZippyFin Services',
    slug: 'zippyfin-services',
    type: 'Demo Project',
    category: 'Financial Services Platform Concept',
    filterCategory: 'Web',
    shortDescription: 'Modern corporate treasury and cash flow visualization portal featuring currency conversion feeds, spend categorization, and runway forecasts.',
    fullDescription: 'A high-precision financial analytics dashboard concept engineered with deep dark mode aesthetics, dynamic fiscal burn forecasting charts, and transaction category classification.',
    accentColor: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    iconName: 'CreditCard',
    technologies: ['React', 'Canvas / SVG', 'JavaScript', 'REST APIs', 'Design Tokens', 'Vite'],
    keyHighlights: [
      'Cash runway calculator with parameter adjustment sliders',
      'Dynamic multi-currency exchange conversion matrix',
      'Automated transaction tagging and expense threshold alerts',
      'High-contrast data tables with sorting, filtering, and export'
    ],
    architecture: 'High-performance front-end visualization layer utilizing SVG and HTML Canvas for smooth 60fps graph rendering with simulated banking feeds.',
    demoMetrics: [
      { label: 'Ledger Audit', value: 'Encrypted' },
      { label: 'Chart Engine', value: 'Custom SVG' },
      { label: 'Security Level', value: 'Bank-Grade Concept' }
    ]
  },
  {
    id: 'agripulse-mobile',
    title: 'AgriPulse Mobile Companion',
    slug: 'agripulse-mobile',
    type: 'Concept Project',
    category: 'Cross-Platform Mobile Application',
    filterCategory: 'Apps',
    shortDescription: 'Mobile scouting and crop diagnostics application enabling field agronomists to record geo-tagged observations offline.',
    fullDescription: 'A mobile application architecture concept designed for low-connectivity rural environments. Enables instant photo capture, pest symptom checklists, and background sync upon cellular reconnection.',
    accentColor: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    iconName: 'Smartphone',
    technologies: ['React Native', 'SQLite', 'GPS Hardware APIs', 'Node.js', 'REST APIs'],
    keyHighlights: [
      'Offline SQLite storage retaining hundreds of field scouting logs',
      'Device camera integration for crop foliage photo logging',
      'GPS coordinate tagging with offline topological map caching',
      'Background queue syncing data automatically when online'
    ],
    architecture: 'Cross-platform mobile application using unified React Native architecture with native hardware bridge access for location and imaging.',
    demoMetrics: [
      { label: 'Offline Support', value: '100%' },
      { label: 'Platform', value: 'iOS & Android' },
      { label: 'Sync Queue', value: 'Auto-Retry' }
    ]
  },
  {
    id: 'zippyflow-automation',
    title: 'ZippyFlow Intelligent Triage Bot',
    slug: 'zippyflow-automation',
    type: 'Internal Project',
    category: 'AI Automation / Chatbot Pipeline',
    filterCategory: 'AI Automation',
    shortDescription: 'Automated multi-channel customer triage pipeline routing WhatsApp and web inquiries to structured ticketing queues.',
    fullDescription: 'An internal automation pipeline created to test conversational lead qualification and structured JSON webhook routing across WhatsApp Business APIs and support ticketing platforms.',
    accentColor: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #00F2FE 100%)',
    iconName: 'Bot',
    technologies: ['Python', 'OpenAI API', 'FastAPI', 'Webhooks', 'PostgreSQL', 'Docker'],
    keyHighlights: [
      'Natural language intent classification with confidence scoring',
      'WhatsApp Business API webhook listener with auto-acknowledgment',
      'Automated CRM prospect record generation with sentiment analysis',
      'Zero hallucination safeguards with human-in-the-loop fallbacks'
    ],
    architecture: 'Event-driven Python microservice containerized with Docker, processing asynchronous webhook payloads with strict schema validation.',
    demoMetrics: [
      { label: 'Response Time', value: '<900ms' },
      { label: 'Classification', value: '98.4%' },
      { label: 'Human Handoff', value: 'Seamless' }
    ]
  }
];
