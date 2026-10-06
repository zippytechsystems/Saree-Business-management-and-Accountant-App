import React from 'react';
import { useQualityTier } from '../context/QualityTierContext';

/**
 * Accessible Word-by-Word Text Reveal Animation
 * 
 * Requirement 4:
 * - Keep the real text in a visually hidden span for screen readers (.sr-only).
 * - Set aria-hidden="true" on the animated word spans (not just aria-label on the wrapper).
 * - Split ONLY by words, never by characters, preserving Unicode combining characters,
 *   matras, viramas, and conjuncts for Indic scripts (Telugu, Hindi, etc.).
 */
export default function TextReveal({
  text = '',
  as: Component = 'span',
  className = '',
  baseDelay = 0,
  staggerDelay = 35,
  style = {}
}) {
  const { isReduced } = useQualityTier();

  if (!text) return null;

  // Reduced motion: render clean accessible text directly without animation
  if (isReduced) {
    return (
      <Component className={className} style={style}>
        {text}
      </Component>
    );
  }

  // Split strictly by words (whitespace), NEVER by individual characters.
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Component
      className={`text-reveal-container ${className}`}
      style={style}
    >
      {/* 1. Coherent, unbroken real text for screen readers */}
      <span className="sr-only">{text}</span>

      {/* 2. Visual presentation split by whole words with aria-hidden="true" */}
      <span aria-hidden="true" className="text-reveal-words">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="text-reveal-word"
            style={{
              animationDelay: `${baseDelay + index * staggerDelay}ms`
            }}
          >
            {word}{index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </Component>
  );
}
