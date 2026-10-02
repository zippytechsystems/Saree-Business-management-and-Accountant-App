import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Smartphone, Sparkles, Check, ArrowRight } from 'lucide-react';

const iconMap = {
  Globe: Globe,
  Smartphone: Smartphone,
  Sparkles: Sparkles
};

export default function ServiceCard({ service }) {
  const IconComponent = iconMap[service.iconName] || Globe;

  return (
    <div
      className="glass-card"
      style={{
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-xl)',
        height: '100%'
      }}
    >
      <div>
        {/* Top Icon and Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: `radial-gradient(circle, ${service.accentColor}25 0%, rgba(16, 23, 38, 0.9) 100%)`,
              border: `1px solid ${service.accentColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: service.accentColor,
              boxShadow: `0 0 20px ${service.accentColor}20`
            }}
          >
            <IconComponent size={26} />
          </div>

          <span
            className="badge"
            style={{
              background: `${service.accentColor}15`,
              color: service.accentColor,
              border: `1px solid ${service.accentColor}35`,
              fontSize: '0.72rem'
            }}
          >
            {service.badge}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.5rem',
            marginBottom: '0.85rem',
            letterSpacing: '-0.02em',
            color: 'var(--text-main)'
          }}
        >
          {service.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-body)',
            lineHeight: 1.65,
            marginBottom: '1.75rem'
          }}
        >
          {service.description}
        </p>

        {/* Capabilities Checklist */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {service.capabilities.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: `${service.accentColor}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: service.accentColor,
                  flexShrink: 0
                }}
              >
                <Check size={12} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '500' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div>
        <Link
          to={`/services/${service.slug}`}
          className="btn btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            borderColor: `${service.accentColor}30`
          }}
        >
          <span>{service.ctaText}</span>
          <ArrowRight size={16} color={service.accentColor} />
        </Link>
      </div>
    </div>
  );
}
