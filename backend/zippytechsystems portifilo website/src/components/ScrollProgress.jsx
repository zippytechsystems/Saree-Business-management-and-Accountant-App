import React, { useEffect, useRef } from 'react';
import { useQualityTier } from '../context/QualityTierContext';

export default function ScrollProgress() {
  const { isReduced } = useQualityTier();
  const barRef = useRef(null);

  useEffect(() => {
    if (isReduced) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (barRef.current) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;
            barRef.current.style.transform = `scaleX(${progress})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isReduced]);

  if (isReduced) return null;

  return (
    <div
      ref={barRef}
      className="scroll-progress-bar"
      aria-hidden="true"
    />
  );
}
