/**
 * MASTER PRODUCTION QA RUNNER
 * Sequentially runs all production test suites:
 * - Stage 2 (Core APIs & Database Schema)
 * - Stage 3 (Advanced Analytics & Calculations)
 * - Stage 4 (Stock & Inventory Operations)
 * - Stage 5 (Lenders & Expense Auditing)
 * - Stage 6 (Production QA & Resilience)
 * - Stage 7 (Monthly Data Downloads & Cloud Backup Engine)
 * - Auth Multi-Device & Session Concurrency
 * - Security & Headers Audit
 * - End-to-End Workflow Verification
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suites = [
  'stage2Test.js',
  'stage3Test.js',
  'stage4Test.js',
  'stage5Test.js',
  'stage6ProductionQATest.js',
  'stage7Test.js',
  'authMultiDeviceTest.js',
  'verifySecurityAudit.js',
  'verifyWorkflowE2E.js',
];

async function isServerRunning() {
  try {
    const res = await fetch('http://localhost:5000/api/health');
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  if (await isServerRunning()) {
    console.log('[QA Runner] Using existing server on http://localhost:5000\n');
    return null;
  }

  console.log('[QA Runner] Starting local backend server on port 5000...');
  const serverPath = path.resolve(__dirname, '../server.js');
  const serverProc = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', PORT: '5000' }
  });

  // Poll until ready
  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isServerRunning()) {
      console.log('[QA Runner] Server is ready on http://localhost:5000\n');
      return serverProc;
    }
  }

  serverProc.kill();
  throw new Error('[QA Runner] Server failed to start within 15 seconds.');
}

function runScript(scriptName) {
  return new Promise((resolve) => {
    const filePath = path.join(__dirname, scriptName);
    const proc = spawn('node', [filePath], { stdio: 'inherit' });
    proc.on('close', (code) => {
      resolve({ scriptName, code });
    });
  });
}

async function runAll() {
  console.log('================================================================');
  console.log('STARTING MASTER TEST RUNNER FOR ALL PRODUCTION QA SUITES');
  console.log('================================================================\n');

  let serverProc = null;
  try {
    serverProc = await ensureServerRunning();

    const results = [];
    for (const suite of suites) {
      console.log(`\n>>> EXECUTING SUITE: ${suite}`);
      const res = await runScript(suite);
      results.push(res);
      if (res.code !== 0) {
        console.error(`\nSuite ${suite} failed with exit code ${res.code}`);
        process.exitCode = 1;
        break;
      }
    }

    console.log('\n================================================================');
    console.log('MASTER SUITE EXECUTION SUMMARY');
    console.log('================================================================');
    results.forEach((r) => {
      const status = r.code === 0 ? 'Passed (exit code 0)' : `Failed (exit code ${r.code})`;
      console.log(`  [${r.code === 0 ? 'OK' : 'FAIL'}] ${r.scriptName}: ${status}`);
    });

    if (results.every((r) => r.code === 0)) {
      console.log(`\nALL ${results.length} TEST SUITES PASSED 100% WITH ZERO ERRORS.\n`);
    } else {
      console.error('\nSOME TEST SUITES FAILED.\n');
    }
  } finally {
    if (serverProc) {
      console.log('[QA Runner] Stopping background test server...');
      serverProc.kill();
    }
  }
}

runAll();
