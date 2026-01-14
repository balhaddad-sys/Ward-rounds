const response = await fetch('YOUR_GAS_WEB_APP_URL', {
  method: 'POST',
  mode: 'cors', // Crucial: use 'cors'
  headers: {
    /* IMPORTANT: DO NOT use 'application/json' here. 
       Using 'text/plain' makes this a "simple request" and 
       bypasses the CORS preflight that GAS cannot handle.
    */
    'Content-Type': 'text/plain', 
  },
  body: JSON.stringify({
    action: 'login',
    username: 'MasterShifu'
  }),
});

const data = await response.json();
