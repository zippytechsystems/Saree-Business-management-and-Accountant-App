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
- **Direct Founder Line**: Direct access to founder & lead architect **Lingaswamy** (+91 63026 90251).
- **Zero-Backend WhatsApp Lead Flow**: Enquiry form automatically pre-fills project scope and opens WhatsApp directly in the browser or mobile app.
- **Sticky Floating WhatsApp Button**: Always visible with one-click direct chat on every page.
- **Dual Theme Support**: Seamless Light & Dark mode toggle with system preference detection and localStorage persistence.
- **Single-File Content Architecture**: All text, services, prices, and projects live in `src/data/content.js`.
- **SEO & Structured Data**: Semantic HTML5, Open Graph meta tags, and `LocalBusiness` JSON-LD schema.
- **Performance & Accessibility**: Sub-second load times, SVG illustrations, responsive design tested at 375px, 768px, and 1280px.

---

## 🔐 Protected Admin Panel (`/admin`)

The website includes a mobile-friendly, secure administrative dashboard located at **`/admin`**.

### 🔑 Owner Login Credentials
- **Username**: `lingaswamymaddeboina`
- **Password**: `linga@123`

### 🕵️ Discreet Website Access
As requested, the link to the admin area is kept tiny and subtle on the public website so regular customers do not notice it:
- Located at the bottom right corner of the **Footer** right after "Terms" in low opacity (`admin`).
- Also available as a faint anchor at the bottom-right edge of the screen.

### 🎛️ Admin Features
1. **Services & Pricing Management**:
   - Edit the starting price per domain: Web (from ₹7,000), App (from ₹10,000), AI (from ₹6,000).
   - Add, edit, delete services under each domain.
   - Mark items as **"Main Services"** (prominently displayed) or **"More Services"** (compact bullet points).
2. **Portfolio Projects CRUD**:
   - Add new projects with title, domain (`web`, `app`, `ai`), client category, description, metrics, live URL, and image upload/URL.
   - Delete or edit existing showcase projects.
3. **Customer Enquiries & Lead Management**:
   - The public website's enquiry form automatically saves each lead to the database (Name, Phone, Service, Message, Timestamp) **AND** opens WhatsApp with prefilled project scope.
   - Admin view displays a live table of all customer leads.
   - Search leads by customer name, phone number, or project requirements.
   - Filter leads by status (`All`, `New`, `Contacted`, `Closed`) and service category.
   - One-click **"Call"** button (triggers direct mobile call) and **"WhatsApp"** button (opens instant conversation with that client).
   - Change lead status dropdown (`New` ➔ `Contacted` ➔ `Closed`).
4. **Site Settings Editor**:
   - Edit phone number, WhatsApp number, prefilled WhatsApp message, brand tagline, and location.

---

## ⚡ Supabase Setup & Row Level Security (RLS)

The website is engineered with a **hybrid data architecture**:
- **With Supabase**: Reads and synchronizes data live from 7 Supabase tables (`services`, `projects`, `enquiries`, `settings`, `testimonials`, `faqs`, `packages`).
- **Offline / Fallback**: If Supabase credentials are not set or network fails, it operates seamlessly using local data (`src/data/content.js`) and `localStorage` — zero downtime! All sections render loading skeletons, polite empty states, and fallback content.

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign in.
2. Click **"New Project"** and select your preferred region (e.g., South Asia / Mumbai).

### Step 2: Run the SQL Schema
1. In your Supabase dashboard, click on the **SQL Editor** on the left menu.
2. Open the file [`supabase_schema.sql`](./supabase_schema.sql) from this repository.
3. Copy and paste the entire script into the Supabase SQL Editor and click **Run**.
4. This script automatically:
   - Creates all 7 tables: `services`, `projects`, `enquiries`, `settings`, `testimonials`, `faqs`, `packages`.
   - Populates seed data from existing verified content for instant readiness.
   - Creates indexes for fast lookups.
   - Enables **Row Level Security (RLS)** on all tables.
   - Applies secure policies:
     - Public can **SELECT** `services`, `projects`, `settings`, `testimonials`, `faqs`, `packages`.
     - Public can **INSERT** into `enquiries` (validated contact submissions).
     - Only authenticated admin (`lingaswamymaddeboina@gmail.com`) has full CRUD on all tables and read access to `enquiries`.
     - The private `service_role` key is **never** exposed in the frontend.

### Step 3: Add Environment Variables
1. In your Supabase project, go to **Project Settings** > **API**.
2. Copy your **Project URL** and **anon / public key**.
3. Create a `.env` file in the root directory of this project:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Restart the development server (`npm run dev`) or redeploy to Vercel/Netlify with these environment variables added in the hosting dashboard.

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
Admin panel: **`http://localhost:5173/admin`**

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
    phone: '6302690251',
    phoneFormatted: '+91 63026 90251',
    whatsappNumber: '916302690251',
    whatsappLink: 'https://wa.me/916302690251',
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

### Option B: Deploy on Netlify (Recommended)
1. Push your repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Log in to [netlify.com](https://www.netlify.com/) and click **"Add new site"** > **"Import an existing project"**.
3. Select **GitHub** and pick `zippytechsystems-portifilo`.
4. The build settings are auto-detected via [`netlify.toml`](./netlify.toml):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Site configuration"** (or **"Environment variables"**):
   Add the following exact environment variables:
   - `VITE_SUPABASE_URL` = `https://cdrwrbmabcyhxngvyrxh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_G1oB1splS3Wb92LbNZ90pA_NAxOUXpC`
   *(Or your custom Supabase URL and publishable/anon key. Never add or expose the service_role key!)*
6. Click **"Deploy site"**. Both `public/_redirects` and `netlify.toml` ensure Single Page App (SPA) client-side routing works smoothly across all URLs (`/admin`, `/services`, etc.).

---

## 📁 Project Directory Structure

```text
zippytechsystems-portfolio/
├── netlify.toml                # Netlify build configuration & SPA redirects
├── public/                     # Static assets & SVG project illustrations
│   ├── _redirects              # Netlify SPA fallback redirect rule (/* /index.html 200)
│   ├── projects/               # Domain-specific SVG mockups (saree-app, clinic-web, etc.)
│   ├── robots.txt              # Search engine crawler instructions
│   └── sitemap.xml             # XML sitemap for SEO indexing
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.jsx          # Header with theme toggle & WhatsApp CTA
│   │   ├── Hero.jsx            # Hero banner with ambient motion & trust points
│   │   ├── ServicesSection.jsx # Domain cards with dynamic INR prices from Supabase
│   │   ├── PortfolioSection.jsx# Filterable project grid (Web / App / AI)
│   │   ├── WhyChooseUs.jsx     # Value proposition for Indian SMBs
│   │   ├── AboutSection.jsx    # Company story, mission & founder Lingaswamy
│   │   ├── ContactSection.jsx  # Lead submission to Supabase + WhatsApp routing
│   │   ├── FloatingWhatsApp.jsx# Sticky pulsing WhatsApp button
│   │   └── Footer.jsx          # Brand lockup, social links, and discrete admin link
│   ├── context/
│   │   ├── AdminAuthContext.jsx # Supabase Auth & session manager with password reset
│   │   ├── DataContext.jsx     # Unified Supabase Realtime subscriptions & offline cache
│   │   └── ThemeContext.jsx    # Light / Dark mode state management
│   ├── data/
│   │   └── content.js          # Fallback content file when database is offline
│   ├── lib/
│   │   ├── api.js              # Complete database abstraction layer (CRUD, sanitization)
│   │   └── supabase.js         # Resilient Supabase client with legacy key fallback
│   ├── pages/                  # Page routes (Home, Projects, About, Contact, Services, Admin)
│   ├── styles/
│   │   ├── tokens.css          # Brand color tokens & light/dark variables
│   │   ├── animations.css      # Single tasteful hero ambient motion
│   │   └── index.css           # Global typography & accessible controls
│   ├── App.jsx                 # Router layout coordinator
│   └── main.jsx                # Application root entry
├── supabase_schema.sql         # 9 Postgres tables, RLS policies, price history trigger & seed
├── .env.example                # Safe environment variable template
├── index.html                  # HTML entry with Bricolage Grotesque & JSON-LD
├── package.json                # Project dependencies and npm scripts
├── vercel.json                 # Vercel SPA routing rewrites
└── vite.config.js              # Vite dev and build configuration
```

---

## 🗄️ Supabase Backend & Database Setup

The website supports Supabase for live dynamic content and administration with offline resilience:

### 1. Environment Variables
Create `.env` in the root:
```env
VITE_SUPABASE_URL=https://cdrwrbmabcyhxngvyrxh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_G1oB1splS3Wb92LbNZ90pA_NAxOUXpC
```

### 2. Database Tables & Row-Level Security
Run the SQL script provided in [`supabase_schema.sql`](./supabase_schema.sql) in your Supabase SQL Editor:
- **`settings`**: Dynamic site key-value settings (phone `6302690251`, WhatsApp, taglines, social links).
- **`domains`**: Web, App, AI starting prices stored as pure numbers with live INR formatting.
- **`services`**: Domain services (main and more offerings) with sort order and descriptions.
- **`packages`**: Transparent pricing tiers, deliverables lists, and popular badges.
- **`projects`**: Portfolio projects with tags, metrics, and image URLs.
- **`testimonials`**: Client reviews, 5-star ratings, company info, and domain tags.
- **`faqs`**: Frequently asked questions grouped by categories.
- **`enquiries`**: Captures customer leads directly from the contact form.
- **`price_history`**: Audit trail populated automatically by Postgres triggers whenever a domain or package price is changed.
- **Storage Bucket (`portfolio-images`)**: Public read, authenticated admin upload with 2MB limits.

### 3. Enable Realtime Publications
To allow prices to auto-update on visitors' screens without page reload:
1. In Supabase Dashboard, navigate to **Database** > **Publications**.
2. Select `supabase_realtime`.
3. Enable replication for `domains`, `packages`, `settings`, and `services`.

### 4. Admin User Creation
1. Go to Supabase Dashboard > **Authentication** > **Users**.
2. Click **"Add user"** > **"Create user"**.
3. Email: `lingaswamymaddeboina@gmail.com`
4. Set your secure password.

---

## 🤖 AI Customer Enquiry Chatbot Setup & Deployment

The website includes a floating AI customer enquiry chatbot powered by **Supabase Edge Functions** (`chat-api`) and **Claude API** (`claude-haiku-4-5-20251001`), loaded with live database services and pricing, multilingual support (English, Telugu, Hindi, Telugish), lead capture, and instant WhatsApp handoff.

### 1. Run the Chatbot SQL Schema in Supabase
Open your Supabase project dashboard, go to the **SQL Editor**, and run the SQL code from:
[`supabase/chatbot.sql`](./supabase/chatbot.sql)

This script will safely create:
- `service_areas` table with an initial placeholder row.
- Business info columns on `settings` (`working_hours`, `office_address`, `email`, `about_text`, `delivery_note`, `languages_supported`).
- `chat_sessions` and `chat_messages` tables with indexing for rate limits and daily caps.
- `chatbot_settings` table (admin only).
- `chatbot_public` secure view (granted to `anon` to hide sensitive keys and system prompts).
- Updated `enquiries` table CHECK constraint allowing `source = 'chatbot'`.
- Strict Row-Level Security (RLS) policies.

### 2. Install the Supabase CLI
If you haven't installed the Supabase CLI on your computer yet:
* **Windows (PowerShell with npm or Scoop)**:
  ```powershell
  npm install -g supabase
  ```

### 3. Log In and Link Your Project
In your project terminal:
```bash
# 1. Authenticate with your Supabase account
supabase login

# 2. Link to your remote Supabase project (project reference: cdrwrbmabcyhxngvyrxh)
supabase link --project-ref cdrwrbmabcyhxngvyrxh
```

### 4. Set the Claude API Key Secret
The `ANTHROPIC_API_KEY` is kept **strictly on the server side** in Supabase Secrets and is NEVER exposed to the frontend or git:
```bash
supabase secrets set ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### 5. Set CORS Allowed Origins (Optional)
To restrict CORS to your exact Netlify domain and localhost:
```bash
supabase secrets set ALLOWED_ORIGINS="https://YOUR-SITE.netlify.app,http://localhost:5173,http://localhost:3000"
```
*(Replace `https://YOUR-SITE.netlify.app` with your actual Netlify site URL. You can comma-separate multiple custom domains or Netlify URLs).*

### 6. Deploy the Supabase Edge Functions (`chat-api` & `tts-api`)
Deploy both edge functions using the Supabase CLI:
```bash
# Deploy AI Chatbot logic
supabase functions deploy chat-api --no-verify-jwt

# Deploy Female Voice TTS synthesis function
supabase functions deploy tts-api --no-verify-jwt
```
*(Note: `--no-verify-jwt` is used because the client calls with the anon key and the functions validate sessions, rate limits, and origin internally).*

### 7. Set Voice Agent (TTS) Secrets
The female voice agent uses Azure Neural TTS by default (with Google Cloud and ElevenLabs swappable via `TTS_PROVIDER`). Set the credentials strictly in Supabase secrets:
```bash
# Azure Neural TTS setup (Default)
supabase secrets set TTS_PROVIDER=azure
supabase secrets set TTS_API_KEY=your_azure_speech_key_here
supabase secrets set TTS_REGION=centralindia

# (Optional: Google Cloud TTS alternative)
# supabase secrets set TTS_PROVIDER=google
# supabase secrets set TTS_API_KEY=your_google_cloud_api_key

# (Optional: ElevenLabs alternative)
# supabase secrets set TTS_PROVIDER=elevenlabs
# supabase secrets set TTS_API_KEY=your_elevenlabs_api_key
```

### 8. Voice Agent Features
- **Consistent Female AI Voices**:
  - **English (`en-IN`)**: `en-IN-NeerjaNeural`
  - **Telugu (`te-IN`)**: `te-IN-ShrutiNeural`
  - **Hindi (`hi-IN`)**: `hi-IN-SwaraNeural`
- **Natural Spoken Guardrails**: When interacting in voice mode (`channel: 'voice'`), the AI speaks in 1–2 short conversational sentences without Markdown, emojis, or bullet points, confirms phone numbers digit-by-digit, and reads starting prices naturally.
- **Barge-in**: When the user speaks, playback stops immediately and the microphone listens.
- **Client Fallback**: If the server TTS API is unavailable, the frontend gracefully falls back to browser `speechSynthesis` preferring a female voice, ensuring zero disruption.
- **Zero UI Disruption**: The voice button is cleanly stacked directly above the chatbot trigger on the bottom-left; the floating WhatsApp button remains untouched on the bottom-right.
- **Privacy First**: Displays a one-time clear microphone consent modal prior to first voice session.

### 9. Database Phone Number & Settings Synchronization
To update your existing Supabase settings table to the official number `6302690251`, execute this in the Supabase SQL Editor:
```sql
UPDATE settings SET phone = '6302690251', whatsapp_number = '6302690251';
```

### 10. Netlify Environment Variables
In your Netlify Dashboard (**Site configuration** > **Environment variables**), make sure these are set:
- `VITE_SUPABASE_URL` = `https://cdrwrbmabcyhxngvyrxh.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `<your-supabase-anon-or-publishable-key>`

### 11. Testing Locally
Run the development server locally:
```bash
npm run dev
```
1. Open `http://localhost:5173` in your browser.
2. The AI Chatbot floating button appears on the bottom-left of every public page.
3. The Voice Agent floating microphone button is stacked directly above the chatbot trigger on the bottom-left.
4. The existing WhatsApp floating button remains at the bottom-right without any overlap.
5. Click the microphone icon to activate the AI Female Voice Agent or the chatbot icon for text chat.
6. In the Admin Panel (`/admin`):
   - **AI Chatbot**: Configure both Chatbot and Voice Agent settings (enable/disable, default language, speech speed rate, Azure voice names), test prompts, and use the sandbox.
   - **Conversations**: View customer session transcripts with `🎙️ Voice` badges and channel filtering (`All Channels`, `💬 Text`, `🎙️ Voice`).
   - **Locations**: Manage operating cities and service areas.
   - **Settings**: Update working hours, address, email, and languages.

### 12. Communication Features & Automated Notifications

#### 1. Interactive Service Selection Builder ("Tell Us What You Need")
- An intuitive 4-step interactive configurator embedded on the home page:
  1. **Select Services**: Checkbox list grouped under Web Development, App Development, and AI Automation directly from the Supabase database.
  2. **Project Scope**: Timeline options (Urgent 3-5 days, 1-2 weeks, Flexible) and Budget range selector.
  3. **Contact Details**: Name, 10-digit Indian mobile number (`^[6-9]\d{9}$`), email address, notes, and WhatsApp opt-in toggle. Anti-spam honeypot (`website_hp`) silently blocks bots.
  4. **Review & Dispatch**: Full summary with one-click direct WhatsApp prefilled dispatch to `+91 63026 90251` or instant database submission.
- **24-Hour Commitment**: Displays clear confirmation banner in English, Telugu, or Hindi: *"Thank you! We have received your enquiry. We will contact you within 24 hours."* (dynamic from `settings.response_time_text`).

#### 2. Resend Email & WhatsApp Edge Function (`notify-enquiry`)
A dedicated edge function handles instant alerts and audit logging:
- Deployed at: `supabase/functions/notify-enquiry`
- Deploy command:
  ```bash
  supabase functions deploy notify-enquiry --no-verify-jwt
  ```
- Configure secrets in Supabase:
  ```bash
  # Resend transactional email (free 3,000 emails/month at resend.com)
  supabase secrets set EMAIL_API_KEY="re_your_resend_api_key"
  supabase secrets set ADMIN_NOTIFY_EMAIL="lingaswamymaddeboina@gmail.com"
  supabase secrets set EMAIL_FROM="onboarding@resend.dev"

  # Optional: WhatsApp Cloud API for direct automated replies & alerts
  # supabase secrets set WA_PHONE_NUMBER_ID="your_phone_number_id"
  # supabase secrets set WA_ACCESS_TOKEN="your_system_access_token"
  ```
- **Audit Logging**: Every notification attempt is logged to `notification_log` (`email_admin`, `email_customer`, `wa_customer`, `wa_admin`) with delivery status (`sent`, `failed`, `skipped`).
- **Resilience**: The client submission to Supabase `enquiries` table always succeeds immediately even if external notification APIs fail or are unconfigured.

#### 3. Admin Overdue Alerts & SLA Tracking
- **Admin Dashboard**: Shows real-time **"OVERDUE (> 24H)"** counter badge in bold red.
- **Enquiries Tab**: Each lead displays:
  - 🟢 `Within 24h` or 🔴 `Overdue (> 24h)` deadline indicators
  - Source tags: `🚀 Project Builder`, `📞 Callback Request`, `🤖 AI Chatbot`, `⚡ Fast Quote`, `✉️ Contact Form`
  - Selected service tags & pills
  - Clickable email and phone links
  - Custom notes and WhatsApp opt-in confirmation badge
- **Settings Tab**:
  - Response time target editor (`response_time_text`)
  - Facebook & LinkedIn URL configuration
  - Notification toggles for Email alerts, WhatsApp customer auto-reply, and WhatsApp admin alert
  - Multilingual customer WhatsApp auto-reply template editors (EN, TE, HI)

---

## 🤖 WhatsApp AI Automation System & Live Inbox

ZippyTechSystems includes a production-grade WhatsApp AI Automation & Live Inbox system:
- **Zero Hardcoded Prices**: Grounded entirely in live Supabase database tables (`domains`, `services`, `packages`, `faqs`, `service_areas`, `settings`).
- **Coexistence Mode**: Run the bot on the Cloud API while keeping WhatsApp Business app active on your phone with `6302690251`.
- **Automatic Human Detection**: When you reply from the WhatsApp Business mobile app, Meta sends `smb_message_echoes`, which automatically pauses AI for `settings.human_pause_hours` (default 2 hours).
- **Admin Live Inbox (`/admin` > WhatsApp)**: Review real-time transcripts, delivery status ticks (`✓`, `✓✓`, `✓✓` blue), 24-hour window countdown, manual AI take-over / resume, and official template sender.
- **Edge Functions**:
  - `whatsapp-webhook`: Verification handshake, inbound messages, and Coexistence echoes.
  - `whatsapp-send`: Sender enforcing the 24-hour customer service window.
  - `whatsapp-automation-runner`: Queue runner respecting quiet hours (`quiet_hours_start` to `quiet_hours_end`).
  - `notify-enquiry`: Lead notifications via Resend (primary) and optional personal WhatsApp alert (`WA_ADMIN_TO`).

👉 **Read the full 11-step WhatsApp Setup Guide with exact Meta menu instructions in [README_WHATSAPP.md](./README_WHATSAPP.md).**

---

## 📞 Contact Information

- **Company**: ZippyTechSystems Pvt. Ltd.
- **Founder**: Lingaswamy
- **Phone / Calling**: [+91 63026 90251](tel:+916302690251)
- **WhatsApp**: [wa.me/916302690251](https://wa.me/916302690251)
- **Instagram**: [instagram.com/zippytechsystems](https://www.instagram.com/zippytechsystems)
- **YouTube**: [youtube.com/@zippytechsystems](https://www.youtube.com/@zippytechsystems)
- **Location**: Hyderabad, Telangana, India
- **Positioning**: Low budget, high value digital solutions for small and mid-size businesses in India.
