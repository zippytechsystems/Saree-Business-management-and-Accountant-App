import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { content } from '../data/content';

export default function TermsPage() {
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
            <FileText size={28} color="#1d5cf0" />
            <h1 style={{ fontSize: '2.2rem' }}>Terms of Service</h1>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>
            Last Updated: {content.company.yearFounded} – 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>1. Agreement to Terms</h3>
              <p>
                By accessing our website or engaging services with {content.company.legalName}, you agree to these
                terms of service. Our positioning is focused on providing low budget, high value digital solutions
                for Indian small and mid-size enterprises.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>2. Pricing &amp; Quotations</h3>
              <p>
                Listed starting prices (Web Development from ₹7,000, App Development from ₹10,000, AI Automation from ₹6,000)
                represent baseline configurations. Final project quotations are tailored and documented based on specific customer
                scope, API dependencies, and third-party integrations.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>3. Direct Contact &amp; Support</h3>
              <p>
                Client engagements are directly overseen by founder Lingaswamy. Milestone delivery schedules, code ownership,
                and warranty terms are provided in writing for every development agreement.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
