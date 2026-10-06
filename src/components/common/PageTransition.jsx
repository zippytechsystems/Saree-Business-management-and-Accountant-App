import React, { memo } from 'react';

/**
 * Lightweight, GPU-accelerated page transition wrapper.
 * Triggers fade + 8px slide-up on tab changes without layout shift.
 * Respects prefers-reduced-motion.
 */
const PageTransition = memo(function PageTransition({ activeKey, children, className = '' }) {
  return (
    <div key={activeKey} className={`page-transition-wrapper ${className}`}>
      {children}
    </div>
  );
});

export default PageTransition;
