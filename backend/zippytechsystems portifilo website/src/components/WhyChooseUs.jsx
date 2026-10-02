import React from 'react';
import { TrendingUp, Clock, UserCheck, Layers, CheckCircle2 } from 'lucide-react';
import { content } from '../data/content';

export default function WhyChooseUs() {
  const iconMap = {
    TrendingUp: <TrendingUp size={24} color="#1d5cf0" />,
    Clock: <Clock size={24} color="#ffe500" />,
    UserCheck: <UserCheck size={24} color="#12a150" />,
    Layers: <Layers size={24} color="#7a2fd0" />
  };

  return (
    <section id="why-us" style={{ padding: '5rem 0', background: 'var(--bg-canvas)' }} aria-labelledby="why-us-heading">
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
          <span className="badge badge-app" style={{ marginBottom: '1rem' }}>
            WHY SMALL BUSINESSES CHOOSE ZIPPY
          </span>
          <h2 id="why-us-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Enterprise Quality at <span style={{ color: '#ffe500', background: '#0b1b4a', padding: '0 8px', borderRadius: '6px' }}>Honest Prices</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            No agency runarounds or confusing tech jargon. We build reliable digital systems that make you money.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {content.whyChooseUs.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {iconMap[item.icon] || <CheckCircle2 size={24} color="#12a150" />}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
