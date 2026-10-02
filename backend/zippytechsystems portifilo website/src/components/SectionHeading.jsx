import React from 'react';

export default function SectionHeading({
  badgeText,
  badgeVariant = 'cyan',
  title,
  gradientWord,
  subtitle,
  align = 'center',
  id
}) {
  return (
    <div
      id={id}
      style={{
        textAlign: align,
        maxWidth: align === 'center' ? '760px' : '100%',
        margin: align === 'center' ? '0 auto var(--space-12) auto' : '0 0 var(--space-8) 0',
      }}
    >
      {badgeText && (
        <div style={{ marginBottom: '1rem' }}>
          <span className={`badge badge-${badgeVariant}`}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'currentColor',
                display: 'inline-block'
              }}
            />
            {badgeText}
          </span>
        </div>
      )}

      <h2 style={{ marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        {title}{' '}
        {gradientWord && (
          <span className="text-gradient-brand">{gradientWord}</span>
        )}
      </h2>

      {subtitle && (
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-body)',
            lineHeight: 1.65
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
