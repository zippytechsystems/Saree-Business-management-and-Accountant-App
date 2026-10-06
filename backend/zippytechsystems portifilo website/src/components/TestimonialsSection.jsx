import React from 'react';
import { Star, Quote, MessageCircle } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';

export default function TestimonialsSection() {
  const { testimonialsData, loading } = useData();
  const testimonials =
    testimonialsData && testimonialsData.length > 0
      ? testimonialsData
      : content.testimonials || [];

  return (
    <section
      id="testimonials"
      style={{
        padding: '5.5rem 0',
        background: 'var(--bg-canvas)',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative'
      }}
      aria-labelledby="testimonials-heading"
    >
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem auto' }}>
          <span className="badge badge-yellow" style={{ marginBottom: '1rem' }}>
            CLIENT SUCCESS STORIES
          </span>
          <h2 id="testimonials-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Trusted by <span style={{ color: '#1d5cf0' }}>Indian Business Owners</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Direct experiences from clinic owners, wholesale traders, and local enterprises who saved time, cut operational costs, and grew with our digital solutions.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (!testimonials || testimonials.length === 0) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="card skeleton"
                style={{
                  height: '240px',
                  borderRadius: '16px',
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        )}

        {/* Friendly Empty State */}
        {!loading && testimonials.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '550px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Be Our Next Success Story</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
              We are currently compiling fresh client reviews. Reach out to founder Lingaswamy on WhatsApp to discuss your project!
            </p>
            <a
              href={buildWhatsAppUrl("Hi Lingaswamy, I'd like to discuss a project and become a ZippyTechSystems client.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta-yellow"
            >
              <MessageCircle size={16} />
              <span>Chat with Founder on WhatsApp</span>
            </a>
          </div>
        )}

        {/* Testimonials Grid */}
        {testimonials.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {testimonials.map((item) => {
              const isWeb = item.domain === 'web';
              const isApp = item.domain === 'app';
              const domainColor = isWeb ? '#1d5cf0' : isApp ? '#12a150' : '#7a2fd0';
              const domainLabel = isWeb
                ? 'Web Development'
                : isApp
                ? 'App Development'
                : 'AI Automation';

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    borderTop: `4px solid ${domainColor}`,
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div>
                    {/* Stars + Domain Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '3px', color: '#ffe500' }}>
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} size={16} fill="currentColor" />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: domainColor,
                          background: `${domainColor}15`,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        {domainLabel}
                      </span>
                    </div>

                    {/* Testimonial Quote */}
                    <p
                      style={{
                        fontSize: '0.94rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        marginBottom: '1.5rem'
                      }}
                    >
                      "{item.content}"
                    </p>
                  </div>

                  {/* Client Info Lockup */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, #0b1b4a 0%, ${domainColor} 100%)`,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        flexShrink: 0
                      }}
                    >
                      {item.clientName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-display)'
                        }}
                      >
                        {item.clientName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                        {item.roleOrCompany}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
