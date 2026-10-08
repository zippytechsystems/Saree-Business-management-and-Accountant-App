import React, { useRef, useState, useEffect } from 'react';
import { useQualityTier } from '../context/QualityTierContext';

export default function MagneticButton({
  children,
  strength = 0.22,
  maxDistance = 8,
  className = '',
  style = {},
  ...props
}) {
  const { isFull, isReduced } = useQualityTier();
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPointerFine(window.matchMedia('(pointer: fine)').matches);
    }
  }, []);

  // If not in Full tier, if reduced motion, or if touch device, render standard element
  if (!isFull || isReduced || !isPointerFine) {
    return (
      <div className={`magnetic-wrapper ${className}`} style={{ display: 'inline-block', ...style }} {...props}>
        {children}
      </div>
    );
  }

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    // Clamp displacement to prevent unnatural jumps
    const clampedX = Math.max(Math.min(deltaX, maxDistance), -maxDistance);
    const clampedY = Math.max(Math.min(deltaY, maxDistance), -maxDistance);

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={buttonRef}
      className={`magnetic-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block',
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered
          ? 'transform 0.1s ease-out'
          : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: isHovered ? 'transform' : 'auto',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
