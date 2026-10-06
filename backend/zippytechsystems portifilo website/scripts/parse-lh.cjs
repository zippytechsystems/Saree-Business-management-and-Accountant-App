const fs = require('fs');

function report(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const r = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`=== ${label} ===`);
  console.log('Performance Score:', Math.round(r.categories.performance.score * 100));
  console.log('LCP (Largest Contentful Paint):', r.audits['largest-contentful-paint'].displayValue, `(${Math.round(r.audits['largest-contentful-paint'].numericValue)} ms)`);
  console.log('CLS (Cumulative Layout Shift):', r.audits['cumulative-layout-shift'].displayValue, `(${r.audits['cumulative-layout-shift'].numericValue.toFixed(4)})`);
  console.log('FCP (First Contentful Paint):', r.audits['first-contentful-paint'].displayValue);
  console.log('TBT (Total Blocking Time):', r.audits['total-blocking-time'].displayValue);
  console.log('Speed Index:', r.audits['speed-index'].displayValue);
}

const file = process.argv[2] || './lh-before.json';
const label = process.argv[3] || 'Lighthouse Mobile Audit (BEFORE Phase 1)';
report(file, label);
