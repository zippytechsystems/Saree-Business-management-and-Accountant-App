/**
 * ZippyTechSystems Motion Engine
 * Lightweight, zero-dependency scroll observer & motion utilities.
 * Adheres to strict performance budgets: zero layout shift, single-trigger observer,
 * full respect for prefers-reduced-motion, and foolproof safety fallback.
 */

export function isReducedMotion() {
  if (typeof window === 'undefined') return true;

  // Check DOM attribute set by QualityTierContext
  if (document.documentElement.getAttribute('data-reduced-motion') === 'true') {
    return true;
  }

  // Fallback to matchMedia
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Initializes IntersectionObserver for single-trigger scroll reveals.
 * Elements with class `.reveal-on-scroll` or attribute `[data-reveal]` receive
 * `.is-revealed` once when visible, then unobserved immediately to save cycles.
 * 
 * Requirement 3:
 * - Hide .reveal-on-scroll elements only under html.js.
 * - Without JavaScript (or if observer fails) everything stays visible.
 * - Short safety timeout that reveals any element still hidden after a few seconds.
 */
export function initScrollReveal(root = document, options = {}) {
  if (typeof window === 'undefined') return () => {};

  const targets = root.querySelectorAll('.reveal-on-scroll, [data-reveal]');
  if (!targets.length) return () => {};

  const revealAll = () => {
    targets.forEach((el) => {
      if (!el.classList.contains('is-revealed')) {
        el.classList.add('is-revealed');
      }
    });
  };

  // If reduced motion or IntersectionObserver unsupported, reveal immediately
  if (isReducedMotion() || !('IntersectionObserver' in window)) {
    revealAll();
    return () => {};
  }

  // Requirement 3: Short safety timeout that reveals any element still hidden after a few seconds
  const safetyTimeoutMs = options.safetyTimeoutMs || 3500;
  const safetyTimer = setTimeout(() => {
    revealAll();
  }, safetyTimeoutMs);

  let observer;
  try {
    const observerOptions = {
      root: null,
      rootMargin: options.rootMargin || '0px 0px -40px 0px',
      threshold: options.threshold ?? 0.08,
      ...options
    };

    observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          // Unobserve immediately — single trigger only
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    targets.forEach((el) => {
      if (!el.classList.contains('is-revealed')) {
        observer.observe(el);
      }
    });
  } catch (err) {
    // If IntersectionObserver construction fails, fail open and reveal everything
    console.warn('[motion] IntersectionObserver failed, revealing all content:', err);
    revealAll();
    clearTimeout(safetyTimer);
    return () => {};
  }

  return () => {
    clearTimeout(safetyTimer);
    try {
      if (observer) observer.disconnect();
    } catch {}
  };
}
