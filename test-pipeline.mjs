async function test() {
  const payload = {
    channel: 'pagerduty',
    severity: 'critical',
    message: 'PostgreSQL primary cluster connection pool exhausted'
  };

  console.log('Sending incident dispatch POST...');
  const res = await fetch('http://localhost:3000/api/incident', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('Response Status:', res.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));

  console.log('\nTesting second dispatch with Warning + Slack...');
  const res2 = await fetch('http://localhost:3000/api/incident', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'slack',
      severity: 'warning',
      message: 'Redis cluster cache eviction spike'
    }),
  });
  const data2 = await res2.json();
  console.log('Second response logs count:', data2.currentLogs.length);
  console.log('Session ID preserved?:', data.loggerSession === data2.loggerSession, 'Session:', data2.loggerSession);
}

test().catch(console.error);
