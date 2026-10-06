import React, { memo } from 'react';

/**
 * Premium, interactive Card component.
 * Variants:
 * - default: Standard clean ERP surface
 * - glass: Frosted glassmorphism with subtle backdrop blur
 * - gradient: Soft ambient radial/linear gradient
 * - interactive: Hover lift, active press scale, clickable with keyboard support
 *
 * Supports staggered entrance via staggerIndex (0 to 8).
 */
function CardComponent({
  title,
  icon,
  value,
  subtext,
  accent = 'blue',
  variant = 'default', // 'default' | 'glass' | 'gradient' | 'interactive'
  staggerIndex,
  onClick,
  children,
  className = '',
  style = {},
  ...props
}) {
  const isLoading = value === '...' || value === 'loading';
  const isClickable = Boolean(onClick) || variant === 'interactive';

  const variantClass = variant !== 'default' ? `ui-card-${variant}` : '';
  const interactiveClass = isClickable ? 'ui-card-interactive' : '';
  const staggerClass = typeof staggerIndex === 'number' ? 'card-stagger-in' : '';

  const combinedStyles = {
    ...style,
    ...(typeof staggerIndex === 'number'
      ? { '--stagger-index': Math.min(Math.max(staggerIndex, 0), 8) }
      : {}),
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={combinedStyles}
      className={`ui-card ${variantClass} ${interactiveClass} ${staggerClass} ${className}`.trim()}
      {...props}
    >
      {title && (
        <div className="card-header">
          <span className="card-label">{title}</span>
          {icon && <div className={`card-icon icon-${accent}`}>{icon}</div>}
        </div>
      )}
      {value !== undefined && (
        <div className="card-value tabular-nums">
          {isLoading ? <span className="skeleton-placeholder" aria-hidden="true" /> : value}
        </div>
      )}
      {subtext && <div className="card-subtext">{subtext}</div>}
      {children}
    </div>
  );
}

export default memo(CardComponent);
