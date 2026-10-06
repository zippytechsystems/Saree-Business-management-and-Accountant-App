import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { content } from '../data/content';

export default function PrivacyPage() {
  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem',
              color: 'var(--text-dim)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Homepage</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '3rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <ShieldCheck size={28} color="#12a150" />
            <h1 style={{ fontSize: '2.2rem' }}>Privacy Policy</h1>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>
            Last Updated: {content.company.yearFounded} – 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>1. Introduction</h3>
              <p>
                {content.company.legalName} ("we", "our", or "us") respects your privacy and is committed to protecting
                any information submitted to us through our portfolio website. This Privacy Policy explains our data
                practices regarding information gathered through our contact and quote request forms.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>2. Information We Collect</h3>
              <p>
                We only collect information that you explicitly choose to provide when contacting founder Lingaswamy, submitting an enquiry form, or configuring a scope in our interactive project builder:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Contact details: Full name, valid 10-digit mobile number, WhatsApp number, and email address.</li>
                <li>Project scope &amp; requirements: Selected service items, custom feature specifications, budget range, and timeline goals.</li>
                <li>Communication preferences: WhatsApp update opt-in choices and callback requests.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>3. How We Use Your Information</h3>
              <p>
                Information provided is solely utilized to evaluate project requirements, prepare transparent pricing quotations,
                and contact you within our committed 24-hour response timeline via WhatsApp, direct phone call, or email. We never sell, lease, or distribute your
                contact information to any third-party marketing networks.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>4. Direct WhatsApp &amp; Email Communications</h3>
              <p>
                When using our forms or project builder, enquiries may be sent directly to founder Lingaswamy via WhatsApp (+91 63026 90251) or email.
                WhatsApp conversations are protected by WhatsApp's standard end-to-end encryption. Transactional email alerts and confirmation notices are routed securely through dedicated edge infrastructure.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
