import React, { memo } from 'react';

function CardComponent({ title, icon, value, subtext, accent = 'blue', children, className = '' }) {
  const isLoading = value === '...' || value === 'loading';

  return (
    <div className={`ui-card ${className}`}>
      {title && (
        <div className="card-header">
          <span className="card-label">{title}</span>
          {icon && <div className={`card-icon icon-${accent}`}>{icon}</div>}
        </div>
      )}
      {value !== undefined && (
        <div className="card-value">
          {isLoading ? <span className="skeleton-placeholder" aria-hidden="true" /> : value}
        </div>
      )}
      {subtext && <div className="card-subtext">{subtext}</div>}
      {children}
    </div>
  );
}

export default memo(CardComponent);

