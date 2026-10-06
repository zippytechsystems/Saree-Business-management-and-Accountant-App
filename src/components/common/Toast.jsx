import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Animated SVG Checkmark with stroke-dashoffset animation
 */
function AnimatedCheckmark() {
  return (
    <svg className="toast-checkmark-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="toast-checkmark-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        className="toast-checkmark-check"
        d="M7.5 12.5L10.5 15.5L16.5 8.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Modern, accessible Toast notification with:
 * - Slide-in and slide-out transitions
 * - Auto-dismiss progress bar (pauses on hover / touch)
 * - Animated success checkmark
 * - Accessible aria-live="polite"
 */
const Toast = memo(function Toast({
  type = 'success', // 'success' | 'error' | 'warning' | 'info'
  message,
  onClose,
  duration = 4000,
  className = '',
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 220); // Matches slide-out animation
  }, [isExiting, onClose]);

  // Handle auto-dismiss timer with pause on hover
  useEffect(() => {
    if (!message || !onClose) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(handleDismiss, remainingTimeRef.current);
    } else {
      clearTimeout(timerRef.current);
    }

    return () => clearTimeout(timerRef.current);
  }, [message, isPaused, handleDismiss, onClose]);

  const handleMouseEnter = () => {
    remainingTimeRef.current = Math.max(
      remainingTimeRef.current - (Date.now() - startTimeRef.current),
      500
    );
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (!message) return null;

  const typeConfig = {
    success: {
      className: 'alert-success',
      icon: <AnimatedCheckmark />,
    },
    error: {
      className: 'alert-error',
      icon: <AlertCircle size={20} className="toast-type-icon" />,
    },
    warning: {
      className: 'alert-warning',
      icon: <AlertTriangle size={20} className="toast-type-icon" />,
    },
    info: {
      className: 'alert-info',
      icon: <Info size={20} className="toast-type-icon" />,
    },
  };

  const currentType = typeConfig[type] || typeConfig.success;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      className={`alert-toast ${currentType.className} ${
        isExiting ? 'toast-slide-out' : 'toast-slide-in'
      } ${className}`.trim()}
    >
      <div className="toast-content-row">
        <div className="toast-icon-wrapper">{currentType.icon}</div>
        <span className="toast-message-text">{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={handleDismiss}
            className="toast-close-btn"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {onClose && duration > 0 && (
        <div className="toast-progress-track">
          <div
            className="toast-progress-bar"
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  );
});

export default Toast;
