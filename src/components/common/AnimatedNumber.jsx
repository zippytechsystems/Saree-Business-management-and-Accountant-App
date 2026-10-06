import React, { useState, useEffect, useRef, memo } from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * High-performance count-up number component.
 * Uses requestAnimationFrame with easeOutExpo easing curve (800ms).
 * Only animates when value actually changes, avoids re-animating on incidental re-renders,
 * and respects prefers-reduced-motion.
 */
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

const AnimatedNumber = memo(function AnimatedNumber({
  value = 0,
  prefix = '',
  decimals = 0,
  duration = 800,
  formatter,
  className = '',
}) {
  const target = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(target);
  const prevValueRef = useRef(target);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startValue = prevValueRef.current;
    prevValueRef.current = target;

    if (prefersReducedMotion || startValue === target) {
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now();
    const diff = target - startValue;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentVal = startValue + diff * easedProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  // Format final display
  let formattedOutput;
  if (formatter) {
    formattedOutput = formatter(displayValue);
  } else if (prefix === '₹') {
    formattedOutput = formatCurrency(Math.round(displayValue));
  } else {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayValue);
    formattedOutput = `${prefix}${formattedNum}`;
  }

  return (
    <span className={`tabular-nums currency-val ${className}`.trim()}>
      {formattedOutput}
    </span>
  );
});

export default AnimatedNumber;
