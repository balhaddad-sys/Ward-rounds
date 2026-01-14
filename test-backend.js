// Test your Google Apps Script backend
// Open browser console (F12) and paste this:

console.log('Testing MedWard Backend...');

// Test 1: Direct GET request (should work in browser)
fetch('https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec')
  .then(r => {
    console.log('✅ GET Status:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('✅ GET Response:', d);
    console.log('API Key Configured:', d.setup?.apiKeyConfigured);
  })
  .catch(e => {
    console.error('❌ GET Failed:', e.message);
  });

// Test 2: POST ping request
setTimeout(() => {
  console.log('\n--- Testing POST ping ---');
  fetch('https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping' })
  })
  .then(r => {
    console.log('✅ POST Status:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('✅ POST Response:', d);
  })
  .catch(e => {
    console.error('❌ POST Failed:', e.message);
  });
}, 2000);

// Test 3: POST login request
setTimeout(() => {
  console.log('\n--- Testing POST login ---');
  fetch('https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: 'testuser' })
  })
  .then(r => {
    console.log('✅ Login Status:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('✅ Login Response:', d);
    console.log('Has Token:', !!d.token);
    console.log('Has User:', !!d.user);
  })
  .catch(e => {
    console.error('❌ Login Failed:', e.message);
  });
}, 4000);

console.log('Tests will run in sequence...');
