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
                We only collect information that you explicitly choose to provide when contacting founder Lingaswamy or requesting a quote:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Name and contact details (WhatsApp number, optional phone number).</li>
                <li>Project requirements, specifications, and scope descriptions.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>3. How We Use Your Information</h3>
              <p>
                Information provided is solely utilized to evaluate project scope, formulate transparent pricing quotations,
                and communicate directly regarding development timelines. We never sell, lease, or distribute your
                contact information to third-party marketing services.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>4. Direct WhatsApp Inquiries</h3>
              <p>
                Our enquiry forms pre-format messages and open directly in your WhatsApp application. Conversations on
                WhatsApp are subject to WhatsApp's standard end-to-end encryption and terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
