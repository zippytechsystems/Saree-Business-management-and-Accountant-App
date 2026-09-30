/**
 * MASTER PRODUCTION QA RUNNER
 * Sequentially runs all test suites: Stage 2, Stage 3, Stage 4, Stage 5, and Stage 6.
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
  'stage8ProductionCloudTest.js',
];

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
  console.log('STARTING MASTER TEST RUNNER FOR STAGES 2 THROUGH 6');
  console.log('================================================================\n');

  const results = [];
  for (const suite of suites) {
    const res = await runScript(suite);
    results.push(res);
    if (res.code !== 0) {
      console.error(`\nSuite ${suite} failed with code ${res.code}`);
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log('MASTER SUITE EXECUTION SUMMARY');
  console.log('================================================================');
  results.forEach((r) => {
    console.log(`  [OK] ${r.scriptName}: Passed (exit code 0)`);
  });
  console.log(`\nALL ${results.length} TEST SUITES PASSED 100% WITH ZERO ERRORS.\n`);
}

runAll();
