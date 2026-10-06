import React from 'react';
import { Globe, Smartphone, Cpu, ArrowDown, ArrowRight } from 'lucide-react';
import { content } from '../data/content';
import { useData } from '../context/DataContext';

export default function DomainPreviewCards() {
  const { servicesData } = useData();
  const services = servicesData && servicesData.length > 0 ? servicesData : content.services;

  const iconMap = {
    Globe: <Globe size={24} />,
    Smartphone: <Smartphone size={24} />,
    Cpu: <Cpu size={24} />
  };

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section style={{ padding: '2rem 0 3rem 0', background: 'var(--bg-canvas)' }} aria-label="Services overview cards">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {services.map((service) => {
            const isWeb = service.domain === 'web';
            const isApp = service.domain === 'app';
            const isAI = service.domain === 'ai';

            const borderColor = isWeb
              ? 'rgba(29, 92, 240, 0.4)'
              : isApp
              ? 'rgba(18, 161, 80, 0.4)'
              : 'rgba(122, 47, 208, 0.4)';

            const glowBg = isWeb
              ? 'rgba(29, 92, 240, 0.08)'
              : isApp
              ? 'rgba(18, 161, 80, 0.08)'
              : 'rgba(122, 47, 208, 0.08)';

            return (
              <div
                key={service.id}
                onClick={() => handleScroll(service.slug)}
                className="card frosted-glass"
                style={{
                  padding: '1.75rem',
                  borderColor: borderColor,
                  background: `linear-gradient(180deg, var(--bg-card) 0%, ${glowBg} 100%)`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-normal)'
                }}
              >

                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: service.gradient,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {iconMap[service.icon]}
                    </div>

                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: service.badgeColor,
                        fontFamily: 'var(--font-display)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-surface-elevated)',
                        border: `1px solid ${borderColor}`
                      }}
                    >
                      From {service.startingPrice}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                    {service.domainLabel}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.5,
                      marginBottom: '1.25rem'
                    }}
                  >
                    {service.introLine}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: service.badgeColor,
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <span>Explore {service.domainLabel}</span>
                  <ArrowDown size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
