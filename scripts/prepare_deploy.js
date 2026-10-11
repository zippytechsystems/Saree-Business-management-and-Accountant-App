import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import db from '../backend/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const stagingDir = path.resolve(rootDir, 'staging_deploy');

console.log('Preparing Hostinger Deployment Package in:', stagingDir);

// 0. Regenerate latest Hostinger MySQL database dump
try {
  console.log('Generating latest Hostinger MySQL dump...');
  execSync('node scripts/export_sqlite_to_mysql_dump.js', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.warn('! Note on MySQL dump generation:', e.message);
}

// 1. Recreate staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 2. Safe SQLite copy using VACUUM INTO
const stagingDataDir = path.join(stagingDir, 'data');
fs.mkdirSync(stagingDataDir, { recursive: true });
const targetDb = path.join(stagingDataDir, 'app.db').replace(/\\/g, '/');
try {
  db.exec(`VACUUM INTO '${targetDb}'`);
  console.log('✓ SQLite database safely captured to staging/data/app.db');
} catch (e) {
  console.warn('! Note on database copy:', e.message);
}

// 3. Copy files/directories recursively with filter
const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  'netlify.toml',
  '_redirects',
  'zippytechsystems portifilo website',
  'tests',
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name) || entry.name.includes('netlify')) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy backend
console.log('Copying backend...');
copyDir(path.join(rootDir, 'backend'), path.join(stagingDir, 'backend'));

// Copy dist (frontend build)
console.log('Copying dist...');
copyDir(path.join(rootDir, 'dist'), path.join(stagingDir, 'dist'));

// Copy root configuration files
const filesToCopy = [
  'package.json',
  '.htaccess',
  'server.js',
  'app.js',
  'index.js',
  'loader.cjs',
  'ecosystem.config.cjs',
  'HOSTINGER_DEPLOY_GUIDE.md',
  'DEPLOYMENT.md',
];

for (const file of filesToCopy) {
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(stagingDir, file));
    console.log(`✓ Copied ${file}`);
  }
}

console.log('✓ Staging directory ready for Hostinger upload.');

// Zip generation
try {
  const zipPath = path.join(rootDir, 'hostinger_fullstack_deploy.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  console.log('Compressing staging_deploy into hostinger_fullstack_deploy.zip...');
  execSync(`powershell -command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force"`);
  console.log(`✓ Generated ready-to-upload package: ${zipPath}`);
} catch (e) {
  console.log('! Note: Zip creation skipped:', e.message);
}
