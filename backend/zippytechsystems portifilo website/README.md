# ZippyTechSystems Pvt. Ltd. — Official Portfolio Website

> **Build • Automate • Grow**  
> *Smart Technology for a Stronger Tomorrow*

A modern, high-performance portfolio website for **ZippyTechSystems Pvt. Ltd.**, showcasing low-budget, high-value digital solutions tailored for small and mid-size businesses (SMBs) in India. Built with **React 18 + Vite**, custom design tokens, dark/light theme switching, and zero-backend WhatsApp lead automation.

---

## 🚀 Key Features

- **Domain-Specific Brand Architecture**:
  - 🌐 **Web Development**: Blue (`#1d5cf0`), Starting from **₹7,000**
  - 📱 **App Development**: Green (`#12a150`), Starting from **₹10,000**
  - ⚡ **AI Automation**: Purple (`#7a2fd0`), Starting from **₹6,000**
  - 🟡 **Primary Highlights & CTA**: High-contrast Yellow (`#ffe500`)
- **Direct Founder Line**: Direct access to founder & lead architect **Lingaswamy** (+91 95424 39498).
- **Zero-Backend WhatsApp Lead Flow**: Enquiry form automatically pre-fills project scope and opens WhatsApp directly in the browser or mobile app.
- **Sticky Floating WhatsApp Button**: Always visible with one-click direct chat on every page.
- **Dual Theme Support**: Seamless Light & Dark mode toggle with system preference detection and localStorage persistence.
- **Single-File Content Architecture**: All text, services, prices, and projects live in `src/data/content.js`.
- **SEO & Structured Data**: Semantic HTML5, Open Graph meta tags, and `LocalBusiness` JSON-LD schema.
- **Performance & Accessibility**: Sub-second load times, SVG illustrations, responsive design tested at 375px, 768px, and 1280px.

---

## 🛠️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` (included with Node.js)

### Step 1: Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```
The site will launch at: **`http://localhost:5173/`**

### Step 3: Build for Production
To generate an optimized production bundle:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## ✏️ How to Edit Content (Without Touching Components!)

All website content is organized in a single configuration file:
📁 **[`src/data/content.js`](./src/data/content.js)**

### 1. Update Company Information & Founder Details
Edit the `company` and `founder` objects in `src/data/content.js`:
```javascript
export const content = {
  company: {
    name: 'ZippyTechSystems Pvt. Ltd.',
    tagline: 'Build • Automate • Grow',
    // ...
  },
  founder: {
    name: 'Lingaswamy',
    phone: '9542439498',
    phoneFormatted: '+91 95424 39498',
    whatsappNumber: '919542439498',
    whatsappLink: 'https://wa.me/919542439498',
    // ...
  }
};
```

### 2. Update Service Prices & Offerings
To change starting prices or add new deliverables, modify the `services` array in `src/data/content.js`:
```javascript
services: [
  {
    id: 'web-development',
    startingPrice: '₹7,000',
    primaryOfferings: [
      'Business websites and landing pages',
      'Services/products showcase websites',
      // ...
    ]
  },
  // ...
]
```

### 3. Add or Modify Projects
Add a new project to the `projects` array in `src/data/content.js`:
```javascript
projects: [
  {
    id: 'my-new-project',
    title: 'Customer Billing App',
    domain: 'app', // 'web', 'app', or 'ai'
    domainLabel: 'App Development',
    clientCategory: 'Retail POS',
    shortDescription: 'Custom billing app for local supermarket...',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    metrics: '50% Faster Checkout',
    image: '/projects/saree-app.svg',
    linkText: 'Inquire Now'
  }
]
```

---

## 🌐 How to Deploy for Free (100% Free Hosting)

### Option A: Deploy on Vercel (Recommended)
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/zippytechsystems/zippytechsystems-portifilo.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
3. Click **"Add New..."** > **"Project"**.
4. Select `zippytechsystems-portifilo`.
5. Keep default settings (Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`).
6. Click **Deploy**. Your portfolio will be live with a free SSL certificate in under 1 minute!

> **SPA Routing on Vercel**: A `vercel.json` file is included in this repository to handle client-side routing rewrites automatically.

### Option B: Deploy on Netlify
1. Log in to [netlify.com](https://www.netlify.com/) with GitHub.
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select `zippytechsystems-portifilo`.
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Deploy site"**.

---

## 📁 Project Directory Structure

```text
zippytechsystems-portfolio/
├── public/                     # Static assets & SVG project illustrations
│   ├── projects/               # Domain-specific SVG mockups (saree-app, clinic-web, etc.)
│   ├── robots.txt              # Search engine crawler instructions
│   └── sitemap.xml             # XML sitemap for SEO indexing
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.jsx          # Header with theme toggle & WhatsApp CTA
│   │   ├── Hero.jsx            # Hero banner with ambient motion & trust points
│   │   ├── ServicesSection.jsx # Domain cards with starting INR prices
│   │   ├── PortfolioSection.jsx# Filterable project grid (Web / App / AI)
│   │   ├── WhyChooseUs.jsx     # Value proposition for Indian SMBs
│   │   ├── AboutSection.jsx    # Company story, mission & founder Lingaswamy
│   │   ├── ContactSection.jsx  # Zero-backend prefilled WhatsApp enquiry form
│   │   ├── FloatingWhatsApp.jsx# Sticky pulsing WhatsApp button
│   │   └── Footer.jsx          # Brand lockup, copyright, and quick links
│   ├── context/
│   │   └── ThemeContext.jsx    # Light / Dark mode state management
│   ├── data/
│   │   └── content.js          # CENTRAL CONTENT FILE (Edit everything here!)
│   ├── pages/                  # Page routes (Home, Projects, About, Contact, Services)
│   ├── styles/
│   │   ├── tokens.css          # Brand color tokens & light/dark variables
│   │   ├── animations.css      # Single tasteful hero ambient motion
│   │   └── index.css           # Global typography & accessible controls
│   ├── App.jsx                 # Router layout coordinator
│   └── main.jsx                # Application root entry
├── index.html                  # HTML entry with Bricolage Grotesque & JSON-LD
├── package.json                # Project dependencies and npm scripts
├── vercel.json                 # Vercel SPA routing rewrites
└── vite.config.js              # Vite dev and build configuration
```

---

## 📞 Contact Information

- **Company**: ZippyTechSystems Pvt. Ltd.
- **Founder**: Lingaswamy
- **Phone**: [+91 95424 39498](tel:9542439498)
- **WhatsApp**: [wa.me/919542439498](https://wa.me/919542439498)
- **Location**: Hyderabad, Telangana, India
- **Positioning**: Low budget, high value digital solutions for small and mid-size businesses in India.
