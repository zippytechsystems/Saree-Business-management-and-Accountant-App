import React from 'react';
import { MessageCircle, ArrowRight, ShieldCheck, Zap, BadgePercent, Headphones, CheckCircle2 } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function Hero({ onOpenQuoteModal, onExploreServices }) {
  const heroWhatsAppUrl = buildWhatsAppUrl(
    'Hi Lingaswamy, I would like to get a quote for a website / app / AI automation for my business.'
  );

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 'calc(var(--navbar-height) + 3.5rem)',
        paddingBottom: '4.5rem',
        overflow: 'hidden'
      }}
      aria-labelledby="hero-heading"
    >
      {/* Background Ambient Mesh — The Single Tasteful Hero Motion */}
      <div
        className="animate-hero-mesh"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          width: '900px',
          height: '600px',
          background: `radial-gradient(circle at 35% 35%, var(--hero-mesh-1) 0%, transparent 60%),
                       radial-gradient(circle at 75% 45%, var(--hero-mesh-2) 0%, transparent 55%),
                       radial-gradient(circle at 50% 80%, var(--hero-mesh-3) 0%, transparent 60%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
        aria-hidden="true"
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Top Pill Badge */}
          <div
            className="animate-float-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-glass-subtle)',
              border: '1px solid var(--border-glass-hover)',
              marginBottom: '1.75rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#12a150',
                display: 'inline-block'
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Direct line to founder Lingaswamy: <span style={{ color: '#12a150' }}>9542439498</span>
            </span>
          </div>

          {/* Main Headline */}
          <h1
            id="hero-heading"
            style={{
              marginBottom: '1.25rem',
              lineHeight: 1.15,
              fontWeight: 800
            }}
          >
            Websites, apps and{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #1d5cf0 0%, #7a2fd0 60%, #12a150 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              AI for your business
            </span>
          </h1>

          {/* Subtitle / Positioning */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--text-body)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              maxWidth: '740px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            {content.company.positioning}{' '}
            <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {content.company.secondaryTagline}.
            </strong>
          </p>

          {/* Pricing Quick-Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '2.5rem'
            }}
          >
            <a href="#services" className="badge badge-web" style={{ fontSize: '0.86rem', padding: '0.45rem 1rem' }}>
              <span style={{ fontWeight: 700 }}>Web</span> from ₹7,000
            </a>
            <a href="#services" className="badge badge-app" style={{ fontSize: '0.86rem', padding: '0.45rem 1rem' }}>
              <span style={{ fontWeight: 700 }}>App</span> from ₹10,000
            </a>
            <a href="#services" className="badge badge-ai" style={{ fontSize: '0.86rem', padding: '0.45rem 1rem' }}>
              <span style={{ fontWeight: 700 }}>AI</span> from ₹6,000
            </a>
          </div>

          {/* Primary Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '3.5rem'
            }}
          >
            <a
              href={heroWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta-yellow"
              style={{
                padding: '0.9rem 1.8rem',
                fontSize: '1.05rem'
              }}
            >
              <MessageCircle size={20} color="#0b1b4a" />
              <span>Get a Quote on WhatsApp</span>
            </a>

            <button
              onClick={onExploreServices}
              className="btn btn-outline"
              style={{
                padding: '0.9rem 1.6rem',
                fontSize: '1rem'
              }}
            >
              <span>Explore Services &amp; Prices</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Trust Points Grid (4 Pillars) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left'
            }}
          >
            {content.trustPoints.map((trust) => {
              const iconMap = {
                Zap: <Zap size={18} color="#ffe500" />,
                ShieldCheck: <ShieldCheck size={18} color="#1d5cf0" />,
                BadgePercent: <BadgePercent size={18} color="#12a150" />,
                Headphones: <Headphones size={18} color="#7a2fd0" />
              };

              return (
                <div
                  key={trust.id}
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.35rem'
                    }}
                  >
                    {iconMap[trust.icon] || <CheckCircle2 size={18} color="#12a150" />}
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>
                      {trust.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.4 }}>
                    {trust.shortText}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
