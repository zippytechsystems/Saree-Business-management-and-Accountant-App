import React from 'react';
import ContactSection from '../components/ContactSection';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '1rem' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem',
            color: 'var(--text-body)',
            marginBottom: '1.5rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Contact Section with WhatsApp prefill form and direct founder line */}
      <ContactSection />
    </main>
  );
}
