import { suites } from './src/app.test.js';

let totalFailed = 0;
let totalPassed = 0;

for (const suite of suites) {
  totalPassed += suite.passed;
  totalFailed += suite.failed;
  console.log(`\n▶ Suite: ${suite.suiteName}`);
  for (const detail of suite.details) {
    if (detail.status === 'pass') {
      console.log(`  ✅ ${detail.name}`);
    } else {
      console.log(`  ❌ ${detail.name} - ${detail.message}`);
    }
  }
}

console.log(`\nResults: ${totalPassed} passed, ${totalFailed} failed.`);

if (totalFailed > 0) {
  process.exit(1);
}
