import React from 'react';
import { Globe, Smartphone, Cpu, Check, MessageCircle, ArrowRight } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function ServicesSection() {
  const iconMap = {
    Globe: <Globe size={28} />,
    Smartphone: <Smartphone size={28} />,
    Cpu: <Cpu size={28} />
  };

  return (
    <section id="services" style={{ padding: '5rem 0', background: 'var(--bg-canvas)' }} aria-labelledby="services-heading">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem auto' }}>
          <span className="badge badge-yellow" style={{ marginBottom: '1rem' }}>
            TRANSPARENT INR PRICING
          </span>
          <h2 id="services-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Services Built for <span style={{ color: '#1d5cf0' }}>Real Business Growth</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Every domain is engineered for low maintenance, high speed, and maximum ROI.
            Direct WhatsApp quote with founder Lingaswamy on every package.
          </p>
        </div>

        {/* 3 Domain Cards / Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {content.services.map((service, index) => {
            const isWeb = service.domain === 'web';
            const isApp = service.domain === 'app';
            const isAI = service.domain === 'ai';

            const accentColor = service.badgeColor;
            const quoteUrl = buildWhatsAppUrl(service.whatsappMessage);

            return (
              <div
                key={service.id}
                id={service.slug}
                className="card"
                style={{
                  padding: 'clamp(1.5rem, 3vw, 2.75rem)',
                  borderColor: `rgba(${isWeb ? '29, 92, 240' : isApp ? '18, 161, 80' : '122, 47, 208'}, 0.25)`,
                  position: 'relative'
                }}
              >
                {/* Top Banner Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    marginBottom: '1.75rem',
                    paddingBottom: '1.75rem',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: service.gradient,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 20px rgba(0,0,0,0.15)`
                      }}
                    >
                      {iconMap[service.icon]}
                    </div>

                    <div>
                      <span
                        className={`badge ${isWeb ? 'badge-web' : isApp ? 'badge-app' : 'badge-ai'}`}
                        style={{ marginBottom: '0.25rem' }}
                      >
                        {service.domainLabel}
                      </span>
                      <h3 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>
                        {service.domainLabel}
                      </h3>
                    </div>
                  </div>

                  {/* Price & CTA Block */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1.5rem'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block' }}>
                        Starting Price
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)' }}>
                          {service.startingPrice}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                          / package
                        </span>
                      </div>
                    </div>

                    <a
                      href={quoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${isWeb ? 'btn-web' : isApp ? 'btn-whatsapp' : 'btn-ai'}`}
                      style={{
                        padding: '0.8rem 1.4rem',
                        fontSize: '0.95rem'
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>Get a Quote on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Summary & Offerings Grid */}
                <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                  {service.summary}
                </p>

                {/* Primary Highlights */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Core Deliverables:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '0.75rem'
                    }}
                  >
                    {service.primaryOfferings.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          background: 'var(--bg-surface)',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: accentColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Capabilities List */}
                <div
                  style={{
                    background: 'var(--bg-glass-subtle)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Also includes &amp; tailored solutions:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '0.5rem 1.5rem'
                    }}
                  >
                    {service.allOfferings.slice(4).map((offering, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: accentColor, fontSize: '0.9rem', lineHeight: 1 }}>•</span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{offering}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
