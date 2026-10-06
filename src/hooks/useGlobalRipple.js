import { useEffect } from 'react';

/**
 * Global document-level pointerdown ripple hook.
 * Adds tactile ripple wave animation to button-like elements on click/touch.
 * Respects prefers-reduced-motion and skips disabled elements.
 */
export function useGlobalRipple() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SELECTOR = 'button, [role="button"], .btn, [class*="btn-"], .tab, .chip, .pill, .sub-nav-tab, .category-pill, .quick-filter-btn, .pagination-btn, .nav-link, .bottom-nav-item, .more-menu-item, .chart-toggle-btn';

    const onDown = (e) => {
      const el = e.target.closest?.(SELECTOR);
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('disabled')) return;

      el.classList.add('ripple-host');
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - rect.left - size / 2}px`;
      wave.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(wave);

      wave.addEventListener('animationend', () => wave.remove(), { once: true });
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
}
