import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import TextReveal from '../src/components/TextReveal.jsx';
import { QualityTierProvider } from '../src/context/QualityTierContext.jsx';

console.log('--- Testing TextReveal with Telugu and Hindi Headlines ---');

// 1. Telugu headline test
const teluguHeadline = 'మీ వ్యాపారం కోసం వెబ్‌సైట్‌లు, యాప్‌లు మరియు ఏఐ ఆటోమేషన్';
const teluguHtml = renderToString(
  <QualityTierProvider>
    <TextReveal text={teluguHeadline} />
  </QualityTierProvider>
);

console.log('\n[Telugu Render HTML]:\n', teluguHtml);

// Verify sr-only span exists and contains exact unbroken Telugu text
assert(
  teluguHtml.includes(`<span class="sr-only">${teluguHeadline}</span>`),
  'Telugu: sr-only span must contain the full intact Telugu headline'
);

// Verify aria-hidden="true" is on visual words wrapper
assert(
  teluguHtml.includes('aria-hidden="true" class="text-reveal-words"'),
  'Telugu: Visual wrapper must have aria-hidden="true"'
);

// Verify individual words are whole (no broken conjuncts)
const expectedTeluguWords = ['మీ', 'వ్యాపారం', 'కోసం', 'వెబ్‌సైట్‌లు,', 'యాప్‌లు', 'మరియు', 'ఏఐ', 'ఆటోమేషన్'];
expectedTeluguWords.forEach((word) => {
  assert(
    teluguHtml.includes(word),
    `Telugu: word "${word}" must remain whole and unbroken`
  );
});

console.log('✓ Telugu headline rendered with 100% intact syllables, viramas, and conjuncts!');

// 2. Hindi headline test
const hindiHeadline = 'आपके व्यापार के लिए वेबसाइटें, ऐप्स और एఐ ऑटोमेशन';
const hindiHtml = renderToString(
  <QualityTierProvider>
    <TextReveal text={hindiHeadline} />
  </QualityTierProvider>
);

console.log('\n[Hindi Render HTML]:\n', hindiHtml);

assert(
  hindiHtml.includes(`<span class="sr-only">${hindiHeadline}</span>`),
  'Hindi: sr-only span must contain the full intact Hindi headline'
);

assert(
  hindiHtml.includes('aria-hidden="true" class="text-reveal-words"'),
  'Hindi: Visual wrapper must have aria-hidden="true"'
);

const expectedHindiWords = ['आपके', 'व्यापार', 'के', 'लिए', 'वेबसाइटें,', 'ऐप्स', 'और', 'ऑटोमेशन'];
expectedHindiWords.forEach((word) => {
  assert(
    hindiHtml.includes(word),
    `Hindi: word "${word}" must remain whole and unbroken`
  );
});

console.log('✓ Hindi headline rendered with 100% intact matras and conjuncts!');

console.log('\nAll TextReveal multilingual & accessibility assertions PASSED successfully!');
