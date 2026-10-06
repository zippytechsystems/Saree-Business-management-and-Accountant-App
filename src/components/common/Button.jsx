import React, { forwardRef, memo } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * High-performance, accessible, interactive Button component.
 * Features:
 * - Micro-interaction hover lift & active press scale (0.97)
 * - Auto-disabling during loading to prevent double submits
 * - Focus-visible accessible keyboard ring
 * - Touch-manipulation & min 44px tap target
 * - Ripple/press feedback
 */
const Button = memo(
  forwardRef(function Button(
    {
      children,
      variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'
      size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
      isLoading = false,
      loadingText,
      icon: Icon,
      iconPosition = 'left',
      disabled = false,
      className = '',
      type = 'button',
      onClick,
      title,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) {
    const isActuallyDisabled = disabled || isLoading;

    const handleClick = (e) => {
      if (isActuallyDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    const variantClass = `btn-${variant}`;
    const sizeClass = size === 'md' ? '' : `btn-${size}`;
    const loadingClass = isLoading ? 'btn-loading' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        aria-busy={isLoading}
        aria-disabled={isActuallyDisabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        title={title}
        onClick={handleClick}
        className={`btn ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="btn-spinner" size={size === 'sm' ? 14 : 18} aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className="btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} aria-hidden="true" />
            )}
            {children && <span className="btn-label">{children}</span>}
            {Icon && iconPosition === 'right' && (
              <Icon className="btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} aria-hidden="true" />
            )}
          </>
        )}
      </button>
    );
  })
);

Button.displayName = 'Button';

export default Button;
