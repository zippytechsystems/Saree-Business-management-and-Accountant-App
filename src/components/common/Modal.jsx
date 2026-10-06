import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible, animated Modal & Mobile Bottom-Sheet component.
 * - Desktop: scale 0.96 -> 1 with backdrop blur fade-in
 * - Mobile: slide-up bottom-sheet with drag handle & swipe-down to dismiss
 * - Full exit transition before unmount
 * - Scroll lock, focus trap, and restore focus
 * - Escape key to dismiss
 */
const Modal = memo(function Modal({
  isOpen,
  title,
  onClose,
  children,
  maxWidth = '520px',
  className = '',
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // Synchronize opening and closing with exit animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      previousActiveElement.current = document.activeElement;
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        if (previousActiveElement.current?.focus) {
          previousActiveElement.current.focus();
        }
      }, 200); // Matches var(--dur-base)
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, isClosing]);

  // Lock body scroll while open
  useEffect(() => {
    if (!shouldRender) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  // Handle Close with animation
  const handleAnimatedClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
      setIsClosing(false);
    }, 200);
  }, [isClosing, onClose]);

  // Escape key & Focus Trap
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAnimatedClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, handleAnimatedClose]);

  // Focus modal or first focusable element on mount
  useEffect(() => {
    if (shouldRender && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, button, select');
      if (firstInput?.focus) {
        firstInput.focus();
      } else {
        modalRef.current.focus();
      }
    }
  }, [shouldRender]);

  // Mobile Swipe-down to dismiss handlers
  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    currentDragY.current = 0;
  };

  const handleTouchMove = (e) => {
    const diffY = e.touches[0].clientY - dragStartY.current;
    if (diffY > 0 && modalRef.current) {
      currentDragY.current = diffY;
      modalRef.current.style.transform = `translateY(${diffY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (currentDragY.current > 90) {
      handleAnimatedClose();
    } else if (modalRef.current) {
      modalRef.current.style.transform = '';
      currentDragY.current = 0;
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? 'modal-overlay-closing' : ''}`}
      onClick={handleAnimatedClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-dialog-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`modal-content ${isClosing ? 'modal-content-closing' : ''} ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="modal-drag-handle-bar" aria-hidden="true">
          <div className="modal-drag-handle" />
        </div>

        <div className="modal-header">
          <h3 id="modal-dialog-title" className="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="btn-ghost btn-icon modal-close-btn"
            onClick={handleAnimatedClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
});

export default Modal;
