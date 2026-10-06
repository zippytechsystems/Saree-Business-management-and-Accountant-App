import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { content, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';
import ContactSection from '../components/ContactSection';
import {
  Globe,
  Smartphone,
  Cpu,
  Check,
  ArrowLeft,
  MessageCircle,
  Phone,
  ShieldCheck,
  Zap,
  BadgePercent
} from 'lucide-react';

const iconMap = {
  Globe: <Globe size={36} />,
  Smartphone: <Smartphone size={36} />,
  Cpu: <Cpu size={36} />
};

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { servicesData } = useData();
  const services = servicesData && servicesData.length > 0 ? servicesData : content.services;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    return (
      <main style={{ paddingTop: 'calc(var(--navbar-height) + 4rem)', minHeight: '60vh' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Service Domain Not Found</h2>
          <p style={{ marginTop: '1rem', marginBottom: '2rem', color: 'var(--text-body)' }}>
            The requested service could not be found.
          </p>
          <Link to="/" className="btn btn-cta-yellow">
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const isWeb = service.domain === 'web';
  const isApp = service.domain === 'app';
  const isAI = service.domain === 'ai';
  const accentColor = service.badgeColor;

  const quoteUrl = buildWhatsAppUrl(service.whatsappMessage);

  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      {/* Breadcrumb Back */}
      <div className="container" style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem',
            color: 'var(--text-body)',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Header */}
      <section style={{ paddingBottom: '3.5rem' }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: 'clamp(2rem, 4vw, 3.5rem)',
              borderColor: `rgba(${isWeb ? '29, 92, 240' : isApp ? '18, 161, 80' : '122, 47, 208'}, 0.3)`,
              background: `linear-gradient(180deg, var(--bg-card) 0%, rgba(${
                isWeb ? '29, 92, 240' : isApp ? '18, 161, 80' : '122, 47, 208'
              }, 0.05) 100%)`
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ maxWidth: '640px' }}>
                <span className={`badge ${isWeb ? 'badge-web' : isApp ? 'badge-app' : 'badge-ai'}`} style={{ marginBottom: '1rem' }}>
                  {service.domainLabel}
                </span>

                <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '1rem', lineHeight: 1.15 }}>
                  {service.domainLabel} for Growing Businesses
                </h1>

                <p style={{ fontSize: '1.15rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '2rem' }}>
                  {service.summary}
                </p>

                {/* Starting Price Banner */}
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Packages Starting From:
                  </span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)' }}>
                    {service.startingPrice}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <a
                    href={quoteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-cta-yellow"
                    style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}
                  >
                    <MessageCircle size={18} />
                    <span>Get a Quote on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:+91${content.founder.phone}`}
                    className="btn btn-outline"
                    style={{ padding: '0.85rem 1.4rem', fontSize: '1rem' }}
                  >
                    <Phone size={17} color="#12a150" />
                    <span>Call Lingaswamy</span>
                  </a>
                </div>
              </div>

              {/* Visual Icon Badge */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '30px',
                  background: service.gradient,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 16px 40px rgba(0,0,0,0.25)`
                }}
              >
                {iconMap[service.icon]}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables & All Capabilities List */}
      <section style={{ padding: '2rem 0 4rem 0' }}>
        <div className="container">
          <div className="card" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 800 }}>
              What’s Included in {service.domainLabel}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}
            >
              {service.allOfferings.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'var(--bg-surface)',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: accentColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </main>
  );
}
