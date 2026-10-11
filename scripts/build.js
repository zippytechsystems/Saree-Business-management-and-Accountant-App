import fs from 'node:fs';
import { execSync } from 'node:child_process';

console.log('[Build] Starting build process for production...');

try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('[Build] ✓ Vite build completed successfully.');
} catch (err) {
  // If Vite build fails on low-memory servers (e.g. Hostinger shared hosting) or if Vite is not installed
  if (fs.existsSync('dist/index.html')) {
    console.warn('[Build] ⚠️ Vite build process encountered an error, but pre-built dist/index.html is already present in repository.');
    console.warn('[Build] ✓ Reusing pre-built production bundle for deployment.');
    process.exit(0);
  } else {
    console.error('[Build] ❌ Build failed and no pre-built dist directory found:', err.message);
    process.exit(1);
  }
}
