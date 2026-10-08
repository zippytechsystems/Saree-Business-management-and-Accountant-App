import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initScrollReveal } from '../lib/motion';
import { useQualityTier } from '../context/QualityTierContext';

export function useScrollReveal(dependencies = []) {
  const location = useLocation();
  const { tier } = useQualityTier();

  useEffect(() => {
    // Small timeout ensures DOM render is complete
    const timer = setTimeout(() => {
      initScrollReveal();
    }, 60);

    return () => clearTimeout(timer);
  }, [location.pathname, tier, ...dependencies]);
}

export default useScrollReveal;
