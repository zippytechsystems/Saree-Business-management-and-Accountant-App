import React from 'react';
import { Zap, ShieldCheck, BadgePercent, Headphones, CheckCircle2, Sparkles, HeartHandshake } from 'lucide-react';
import { content } from '../data/content';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function WhyChooseUs() {
  useScrollReveal();

  const iconMap = {
    Zap: <Zap size={24} color="#1d5cf0" />,
    ShieldCheck: <ShieldCheck size={24} color="#12a150" />,
    BadgePercent: <BadgePercent size={24} color="#eab308" />,
    Headphones: <Headphones size={24} color="#7a2fd0" />
  };

  const domainColors = {
    'fast-delivery': '#1d5cf0',
    'reliable-secure': '#12a150',
    'affordable-pricing': '#eab308',
    'full-support': '#7a2fd0'
  };

  return (
    <section
      id="why-us"
      style={{
        padding: '5.5rem 0',
        background: 'var(--bg-canvas)',
        position: 'relative'
      }}
      aria-labelledby="why-us-heading"
    >
      <div className="container">
        
        {/* Section Header */}
        <div
          className="reveal-on-scroll"
          style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}
        >
          <span className="badge badge-app" style={{ marginBottom: '1rem' }}>
            WHY SMALL BUSINESSES CHOOSE ZIPPY
          </span>
          <h2
            id="why-us-heading"
            style={{
              marginBottom: '1rem',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              lineHeight: 1.25
            }}
          >
            Enterprise Quality at{' '}
            <span
              style={{
                color: '#ffe500',
                background: '#0b1b4a',
                padding: '0 10px',
                borderRadius: '8px',
                display: 'inline-block'
              }}
            >
              Honest Prices
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            No agency runarounds or confusing tech jargon. We build reliable digital systems that help your business grow.
          </p>
        </div>

        {/* Bento Grid Layout (Desktop: Asymmetric 3-column / 2-row; Mobile: 1-column) */}
        {/* Requirement 5: Zero numbers or statistics in compact tiles, loaded from existing trustPoints */}
        <div className="why-us-bento-grid">
          {content.trustPoints.map((item, idx) => {
            const isFeatured = idx === 0; // Fast Delivery: 2-col span
            const isWideBottom = idx === 3; // Full Support: 2-col span
            const accentColor = domainColors[item.id] || '#1d5cf0';

            return (
              <div
                key={item.id}
                className={`card frosted-glass reveal-on-scroll why-us-bento-item ${
                  isFeatured ? 'bento-col-span-2' : ''
                } ${isWideBottom ? 'bento-col-span-2' : ''}`}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  padding: isFeatured ? '2.5rem 2.25rem' : '2.25rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Non-numeric qualitative micro-badge for featured top card */}
                {isFeatured && (
                  <div
                    className="floating-card-subtle"
                    style={{
                      position: 'absolute',
                      top: '1.25rem',
                      right: '1.25rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(29, 92, 240, 0.15)',
                      border: '1px solid rgba(29, 92, 240, 0.3)',
                      color: '#60a5fa',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em'
                    }}
                  >
                    <Sparkles size={13} color="#60a5fa" />
                    <span>Tested Architecture</span>
                  </div>
                )}

                {/* Non-numeric qualitative micro-badge for bottom support card */}
                {isWideBottom && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1.25rem',
                      right: '1.25rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(122, 47, 208, 0.15)',
                      border: '1px solid rgba(122, 47, 208, 0.3)',
                      color: '#c084fc',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    <HeartHandshake size={14} color="#c084fc" />
                    <span>Direct Assistance</span>
                  </div>
                )}

                <div>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${accentColor}33`,
                      marginBottom: '1.5rem',
                      boxShadow: `0 4px 16px ${accentColor}18`
                    }}
                  >
                    {iconMap[item.icon] || <CheckCircle2 size={24} color={accentColor} />}
                  </div>

                  <h3
                    style={{
                      fontSize: isFeatured ? '1.45rem' : '1.25rem',
                      fontWeight: 700,
                      marginBottom: '0.45rem',
                      lineHeight: 1.3
                    }}
                  >
                    {item.title}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: accentColor,
                      marginBottom: '0.75rem'
                    }}
                  >
                    {item.shortText}
                  </div>

                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.65,
                      margin: 0,
                      maxWidth: isFeatured ? '620px' : 'none'
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Subtle highlight footer line on each bento item */}
                <div
                  style={{
                    height: '2px',
                    width: '42px',
                    borderRadius: '2px',
                    background: accentColor,
                    marginTop: '2rem',
                    opacity: 0.8
                  }}
                />
              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        .why-us-bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 900px) {
          .why-us-bento-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .bento-col-span-2 {
            grid-column: span 2;
          }
        }
      `}</style>
    </section>
  );
}
