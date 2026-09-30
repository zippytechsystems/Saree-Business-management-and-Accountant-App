import React from 'react';

export default function Card({ title, icon, value, subtext, accent = 'blue', children, className = '' }) {
  return (
    <div className={`ui-card ${className}`}>
      {title && (
        <div className="card-header">
          <span className="card-label">{title}</span>
          {icon && <div className={`card-icon icon-${accent}`}>{icon}</div>}
        </div>
      )}
      {value !== undefined && <div className="card-value">{value}</div>}
      {subtext && <div className="card-subtext">{subtext}</div>}
      {children}
    </div>
  );
}
