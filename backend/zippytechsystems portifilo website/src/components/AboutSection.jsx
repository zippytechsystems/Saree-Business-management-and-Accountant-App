import React from 'react';
import { MessageCircle, Phone, Award, Target, UserCheck, Shield } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function AboutSection() {
  const founderWhatsApp = buildWhatsAppUrl(
    'Hi Lingaswamy, I read about ZippyTechSystems and would like to consult on my business project.'
  );

  return (
    <section id="about" style={{ padding: '5rem 0', background: 'var(--bg-surface)' }} aria-labelledby="about-heading">
      <div className="container">
        
        {/* Top Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
          <span className="badge badge-ai" style={{ marginBottom: '1rem' }}>
            ABOUT ZIPPYTECHSYSTEMS
          </span>
          <h2 id="about-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Smart Technology for a <span style={{ color: '#1d5cf0' }}>Stronger Tomorrow</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            {content.about.missionStatement}
          </p>
        </div>

        {/* Story & Founder Split Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            marginBottom: '4rem',
            alignItems: 'stretch'
          }}
        >
          {/* Company Story Card */}
          <div className="card" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <Target size={24} color="#1d5cf0" />
                <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Our Vision &amp; Story</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-body)', lineHeight: 1.65 }}>
                {content.about.story.map((paragraph, index) => (
                  <p key={index} style={{ margin: 0 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Shield size={20} color="#12a150" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Registered in Hyderabad, Telangana • Serving businesses all across India
              </span>
            </div>
          </div>

          {/* Founder Profile Card: Lingaswamy */}
          <div
            className="card"
            style={{
              padding: '2.25rem',
              background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(11, 27, 74, 0.15) 100%)',
              borderColor: 'rgba(29, 92, 240, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Founder Avatar / Initials */}
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 50%, #ffe500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 8px 24px rgba(29, 92, 240, 0.35)',
                    border: '2px solid rgba(255, 229, 0, 0.5)'
                  }}
                >
                  L
                </div>

                <div>
                  <span className="badge badge-yellow" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', marginBottom: '0.35rem' }}>
                    FOUNDER &amp; LEAD ARCHITECT
                  </span>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>
                    {content.founder.name}
                  </h3>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                    {content.founder.role}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.98rem' }}>
                "{content.founder.bio}"
              </p>

              {/* Direct Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <UserCheck size={16} color="#12a150" />
                  <span><strong>1-on-1 Communication:</strong> Direct technical clarity from day one.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Award size={16} color="#ffe500" />
                  <span><strong>Pragmatic Builds:</strong> Fast code without unnecessary complexity or bloated bills.</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <a
                href={founderWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ flex: '1 0 160px', padding: '0.7rem 1rem', fontSize: '0.9rem' }}
              >
                <MessageCircle size={16} />
                <span>WhatsApp Lingaswamy</span>
              </a>

              <a
                href={`tel:${content.founder.phone}`}
                className="btn btn-outline"
                style={{ flex: '1 0 140px', padding: '0.7rem 1rem', fontSize: '0.9rem' }}
              >
                <Phone size={15} color="#12a150" />
                <span>Call {content.founder.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            textAlign: 'center'
          }}
        >
          {content.about.milestones.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.75rem 1rem',
                background: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: idx === 0 ? '#1d5cf0' : idx === 1 ? '#ffe500' : idx === 2 ? '#12a150' : '#7a2fd0',
                  lineHeight: 1,
                  marginBottom: '0.5rem'
                }}
              >
                {item.number}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
