const { runQueue, BASE_PACE_MS, MAX_PACE_MS, CIRCUIT_BREAKER_THRESHOLD } = require('./keeper.js');

function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  else console.log('OK:', msg);
}

async function testAllSuccess() {
  console.log('\n--- Test 1: all successes ---');
  const counters = { executed: 0, failed: 0, skipped: 0 };
  const ids = [1, 2, 3, 4, 5];
  const processed = [];
  const start = Date.now();

  await runQueue(ids, id => id, async (pid, cnt) => {
    processed.push(pid);
    cnt.executed++;
  }, counters);

  const elapsed = Date.now() - start;
  assert(processed.length === 5, `all 5 payments processed (got ${processed.length})`);
  assert(counters.executed === 5, `counters.executed === 5 (got ${counters.executed})`);
  assert(counters.failed === 0, `counters.failed === 0 (got ${counters.failed})`);
  assert(elapsed >= 4 * BASE_PACE_MS && elapsed < 4 * BASE_PACE_MS + 2000, `elapsed time (${elapsed}ms) consistent with baseline pacing (~${4 * BASE_PACE_MS}ms)`);
}

async function testCircuitBreaker() {
  console.log('\n--- Test 2: circuit breaker on consecutive failures ---');
  const counters = { executed: 0, failed: 0, skipped: 0 };
  const ids = [1, 2, 3, 4, 5];
  const attempted = [];

  await runQueue(ids, id => id, async (pid, cnt) => {
    attempted.push(pid);
    cnt.failed++;
  }, counters);

  assert(attempted.length === CIRCUIT_BREAKER_THRESHOLD, `stopped after exactly ${CIRCUIT_BREAKER_THRESHOLD} attempts (got ${attempted.length}: ${JSON.stringify(attempted)})`);
  assert(counters.failed === CIRCUIT_BREAKER_THRESHOLD, `counters.failed === ${CIRCUIT_BREAKER_THRESHOLD} (got ${counters.failed})`);
}

async function testPaceEscalationAndRecovery() {
  console.log('\n--- Test 3: pace escalation then recovery ---');
  const counters = { executed: 0, failed: 0, skipped: 0 };
  const ids = [1, 2, 3];
  const timestamps = [];

  let call = 0;
  await runQueue(ids, id => id, async (pid, cnt) => {
    timestamps.push(Date.now());
    call++;
    if (call === 1) {
      cnt.failed++;
    } else {
      cnt.executed++;
    }
  }, counters);

  const gap1 = timestamps[1] - timestamps[0];
  const gap2 = timestamps[2] - timestamps[1];
  console.log(`  gap after failure: ${gap1}ms, gap after recovery-success: ${gap2}ms`);
  assert(gap1 >= BASE_PACE_MS * 1.5, `pace roughly doubled after failure (gap1=${gap1}ms, expected >= ${BASE_PACE_MS * 1.5}ms)`);
  assert(gap2 < gap1, `pace eased down after a success (gap2=${gap2}ms < gap1=${gap1}ms)`);
  assert(counters.failed === 1 && counters.executed === 2, `1 failure + 2 successes recorded (got failed=${counters.failed}, executed=${counters.executed})`);
}

async function testSkipsAreNeutral() {
  console.log('\n--- Test 4: skips are neutral (no pace change, no breaker impact) ---');
  const counters = { executed: 0, failed: 0, skipped: 0 };
  const ids = [1, 2, 3, 4];
  const timestamps = [];

  await runQueue(ids, id => id, async (pid, cnt) => {
    timestamps.push(Date.now());
    cnt.skipped++;
  }, counters);

  assert(counters.skipped === 4, `all 4 skipped (got ${counters.skipped})`);
  assert(counters.executed === 0 && counters.failed === 0, `no executed/failed recorded for pure skips`);
  const gap1 = timestamps[1] - timestamps[0];
  const gap2 = timestamps[2] - timestamps[1];
  assert(Math.abs(gap1 - gap2) < 200, `pace stayed flat across skips (gap1=${gap1}ms, gap2=${gap2}ms)`);
}

async function main() {
  await testAllSuccess();
  await testCircuitBreaker();
  await testPaceEscalationAndRecovery();
  await testSkipsAreNeutral();

  console.log('\n' + (process.exitCode ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED'));
}

main();
