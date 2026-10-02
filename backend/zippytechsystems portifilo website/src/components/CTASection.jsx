import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CTASection({ onOpenQuoteModal }) {
  const navigate = useNavigate();

  return (
    <section className="section-spacing" style={{ paddingTop: '2rem' }}>
      <div className="container">
        <div
          className="glass-card"
          style={{
            padding: ' clamp(3rem, 6vw, 4.5rem) 2rem',
            textAlign: 'center',
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16, 23, 38, 0.95) 0%, rgba(11, 15, 25, 0.98) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 35px rgba(0, 242, 254, 0.12)',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glows */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '300px',
              background: 'radial-gradient(ellipse, rgba(0, 242, 254, 0.18) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 80%)',
              filter: 'blur(50px)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
              <span className="badge badge-cyan">
                <Sparkles size={14} />
                <span>Let's Collaborate</span>
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.25rem)',
                marginBottom: '1.25rem',
                letterSpacing: '-0.03em',
                lineHeight: 1.15
              }}
            >
              Have an Idea?{' '}
              <span className="text-gradient-brand">Let's Build It.</span>
            </h2>

            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--text-body)',
                marginBottom: '2.5rem',
                lineHeight: 1.65
              }}
            >
              From custom web platforms and mobile apps to smart workflow automations,
              partner with ZippyTechSystems to bring your technology goals to life.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: 'center'
              }}
            >
              <button onClick={onOpenQuoteModal} className="btn btn-primary btn-lg">
                <span>Start Your Project</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/#services')}
                className="btn btn-secondary btn-lg"
              >
                <span>View Our Services</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
