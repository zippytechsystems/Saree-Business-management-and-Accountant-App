import React from 'react';
import {
  Globe,
  Smartphone,
  Cpu,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function ServicesSection() {
  const { servicesData, loading } = useData();
  const services = servicesData && servicesData.length > 0 ? servicesData : content.services;
  useScrollReveal([services]);


  const iconMap = {
    Globe: <Globe size={32} />,
    Smartphone: <Smartphone size={32} />,
    Cpu: <Cpu size={32} />
  };

  if (loading && (!services || services.length === 0)) {
    return (
      <div id="services-wrapper" style={{ padding: '5rem 0' }}>
        <div className="container">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card skeleton"
              style={{
                height: '380px',
                borderRadius: '16px',
                marginBottom: '2rem',
                opacity: 0.7
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div id="services-wrapper" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <div className="card" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Services Available</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
              Service offerings are currently being updated. Please check back shortly or contact us directly on WhatsApp.
            </p>
            <a href={buildWhatsAppUrl()} className="btn btn-cta-yellow">
              Contact Lingaswamy on WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="services-wrapper">
      {/* 
        Each Domain is rendered ONE BY ONE as a dedicated, full-width section stacked vertically.
        No mixing in a single grid!
      */}
      {services.map((service, index) => {
        const isWeb = service.domain === 'web';
        const isApp = service.domain === 'app';
        const isAI = service.domain === 'ai';

        const accentColor = service.badgeColor;
        const quoteUrl = buildWhatsAppUrl(service.whatsappMessage);

        const domainBg =
          index % 2 === 0
            ? 'var(--bg-canvas)'
            : 'var(--bg-surface)';

        const borderTint = isWeb
          ? 'rgba(29, 92, 240, 0.25)'
          : isApp
          ? 'rgba(18, 161, 80, 0.25)'
          : 'rgba(122, 47, 208, 0.25)';

        const lightGlow = isWeb
          ? 'rgba(29, 92, 240, 0.05)'
          : isApp
          ? 'rgba(18, 161, 80, 0.05)'
          : 'rgba(122, 47, 208, 0.05)';

        return (
          <section
            key={service.id}
            id={service.slug}
            style={{
              padding: '5.5rem 0',
              background: domainBg,
              borderTop: index > 0 ? '1px solid var(--border-subtle)' : 'none',
              position: 'relative'
            }}
            aria-labelledby={`heading-${service.slug}`}
          >
            <div className="container">
              
              {/* Domain Header Banner */}
              <div
                className="reveal-on-scroll"
                style={{
                  background: `linear-gradient(180deg, var(--bg-card) 0%, ${lightGlow} 100%)`,
                  borderRadius: 'var(--radius-xl)',
                  border: `1px solid ${borderTint}`,
                  padding: 'clamp(1.75rem, 3.5vw, 3rem)',
                  marginBottom: '2.5rem',
                  boxShadow: 'var(--card-shadow)'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  {/* Domain Title & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: service.gradient,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.2)`,
                        flexShrink: 0
                      }}
                    >
                      {iconMap[service.icon]}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: accentColor,
                          marginBottom: '0.2rem'
                        }}
                      >
                        Domain 0{index + 1}
                      </div>
                      <h2
                        id={`heading-${service.slug}`}
                        style={{
                          fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                          fontWeight: 800,
                          margin: 0,
                          lineHeight: 1.15
                        }}
                      >
                        {service.domainLabel}
                      </h2>
                    </div>
                  </div>

                  {/* Starting Price & WhatsApp Button */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1.25rem'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                          display: 'block'
                        }}
                      >
                        Transparent Pricing
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span
                          style={{
                            fontSize: '2.2rem',
                            fontWeight: 800,
                            color: accentColor,
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1
                          }}
                        >
                          {service.startingPrice}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                          starting price
                        </span>
                      </div>
                    </div>

                    <a
                      href={quoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-cta-yellow"
                      style={{
                        padding: '0.85rem 1.6rem',
                        fontSize: '0.98rem'
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>Get a Quote on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Intro Line (Bold & Distinctive) */}
                <div
                  style={{
                    fontSize: 'clamp(1.15rem, 2.2vw, 1.4rem)',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: '0.75rem'
                  }}
                >
                  "{service.introLine}"
                </div>

                {/* Section Copy Idea */}
                <p
                  style={{
                    fontSize: '1.05rem',
                    color: 'var(--text-body)',
                    lineHeight: 1.65,
                    maxWidth: '920px',
                    margin: 0
                  }}
                >
                  {service.conceptCopy}
                </p>
              </div>

              {/* Special Callout: "Save Accountant Salary" (Inside Domain 2: App Development) */}
              {isApp && service.accountantCallout && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(18, 161, 80, 0.12) 0%, rgba(11, 27, 74, 0.2) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid rgba(18, 161, 80, 0.45)',
                    padding: 'clamp(1.5rem, 3vw, 2rem)',
                    marginBottom: '2.5rem',
                    boxShadow: '0 8px 30px rgba(18, 161, 80, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: '#12a150',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      ⭐ Key Business Advantage
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      {service.accountantCallout.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.96rem', color: 'var(--text-body)', marginBottom: '1.25rem' }}>
                    {service.accountantCallout.tagline}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1rem'
                    }}
                  >
                    {service.accountantCallout.benefits.map((benefit, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          background: 'var(--bg-surface)',
                          padding: '1rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(18, 161, 80, 0.25)'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#12a150',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.45 }}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCK 1: OUR MAIN SERVICES (Prominent Cards with Descriptions) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: accentColor
                    }}
                  />
                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-main)'
                    }}
                  >
                    {service.mainServicesTitle}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      fontWeight: 600
                    }}
                  >
                    (Core Specialization)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {service.mainServices.map((mainItem, mIdx) => (
                    <div
                      key={mIdx}
                      className="card"
                      style={{
                        padding: '1.75rem',
                        borderColor: borderTint,
                        borderLeft: `4px solid ${accentColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginBottom: '0.4rem'
                          }}
                        >
                          Main Service 0{mIdx + 1}
                        </div>
                        <h4
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            marginBottom: '0.65rem',
                            lineHeight: 1.3
                          }}
                        >
                          {mainItem.title}
                        </h4>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-body)',
                            lineHeight: 1.55,
                            margin: 0
                          }}
                        >
                          {mainItem.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 2: MORE SERVICES (Shown Second, Smaller & Quieter) */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.75rem 2rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0
                    }}
                  >
                    {service.moreServicesTitle}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Add-ons &amp; Custom Modules Available
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.75rem 1.5rem'
                  }}
                >
                  {service.moreServices.map((moreItem, oIdx) => (
                    <div
                      key={oIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.35rem 0'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: accentColor,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                        {moreItem}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        );
      })}
    </div>
  );
}
