export const technologiesData = [
  {
    category: 'Frontend Engineering',
    tag: 'Client-Side',
    description: 'High-performance, accessible, and responsive user interfaces built with modern standards.',
    accent: '#00F2FE',
    items: [
      { name: 'React', level: 'Primary Library', description: 'Declarative component architecture & modern state management' },
      { name: 'JavaScript (ES6+)', level: 'Language', description: 'Modern asynchronous programming & modular architecture' },
      { name: 'HTML5 & Semantic Web', level: 'Markup', description: 'Structured, accessible, and SEO-friendly document models' },
      { name: 'CSS3 & Vanilla Styling', level: 'Styling', description: 'Custom design tokens, CSS Grid, Flexbox, and fluid animations' },
      { name: 'Vite', level: 'Build Tool', description: 'Lightning-fast ES module bundling and optimized tree-shaking' }
    ]
  },
  {
    category: 'Backend & APIs',
    tag: 'Server-Side',
    description: 'Scalable services, secure REST endpoints, and decoupled microservices.',
    accent: '#6366F1',
    items: [
      { name: 'Node.js', level: 'Runtime', description: 'Non-blocking event-driven backend service architecture' },
      { name: 'Python', level: 'Language', description: 'Data processing, automation scripts, and machine learning pipelines' },
      { name: 'REST APIs', level: 'Architecture', description: 'Standardized, versioned, and documented endpoints' },
      { name: 'WebSockets', level: 'Real-time', description: 'Bi-directional live communication for collaborative workflows' },
      { name: 'Authentication & JWT', level: 'Security', description: 'Secure token issuance, hashing, and role validation' }
    ]
  },
  {
    category: 'Database & Storage',
    tag: 'Data Layer',
    description: 'Relational integrity, flexible document stores, and memory caches.',
    accent: '#10B981',
    items: [
      { name: 'SQL & PostgreSQL', level: 'Relational DB', description: 'Structured schemas, ACID transactions, and complex queries' },
      { name: 'SQLite', level: 'Embedded DB', description: 'Local and offline database persistence for mobile & desktop' },
      { name: 'MongoDB / NoSQL', level: 'Document DB', description: 'Flexible schema models for dynamic content architectures' },
      { name: 'Redis Cache', level: 'In-Memory', description: 'High-speed session storage and query caching' }
    ]
  },
  {
    category: 'Cloud & Deployment',
    tag: 'DevOps & Hosting',
    description: 'Automated CI/CD pipelines, containerization, and edge delivery.',
    accent: '#F59E0B',
    items: [
      { name: 'Git & GitHub', level: 'Version Control', description: 'Collaborative code review, branching, and automated actions' },
      { name: 'Vercel / Cloudflare', level: 'Edge Hosting', description: 'Global CDN distribution, SSL certificates, and instant rollbacks' },
      { name: 'Docker Containers', level: 'Packaging', description: 'Consistent and reproducible application runtimes' },
      { name: 'Cloud Functions', level: 'Serverless', description: 'Event-triggered on-demand compute with auto-scaling' }
    ]
  },
  {
    category: 'AI & Automation Tools',
    tag: 'Intelligence Layer',
    description: 'Generative AI integration, workflow hooks, and conversational bots.',
    accent: '#8B5CF6',
    items: [
      { name: 'AI APIs', level: 'LLM Services', description: 'Contextual completion, retrieval augmentation, and embeddings' },
      { name: 'Automation Webhooks', level: 'Integration', description: 'Event-driven bridges synchronizing external systems' },
      { name: 'LangChain & Orchestration', level: 'Framework', description: 'Structured prompt chaining and schema-enforced outputs' },
      { name: 'Workflow Automators', level: 'Pipelines', description: 'Multi-step scheduled task executors and triage monitors' }
    ]
  }
];
