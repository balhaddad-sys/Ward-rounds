'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    // Gather debug information
    const debugInfo = {
      currentUrl: window.location.href,
      basePath: '/Ward-rounds',
      localStorage: {
        token: localStorage.getItem('medward_token') ? 'EXISTS' : 'MISSING',
        user: localStorage.getItem('medward_user') ? 'EXISTS' : 'MISSING',
        reports: JSON.parse(localStorage.getItem('medward_reports') || '[]').length + ' reports',
        patients: JSON.parse(localStorage.getItem('medward_patients') || '[]').length + ' patients'
      },
      serviceWorker: 'checking...',
      testNavigation: false
    };

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        debugInfo.serviceWorker = registrations.length > 0
          ? `${registrations.length} active (${registrations[0].active?.scriptURL || 'unknown'})`
          : 'None active';
        setInfo({...debugInfo});
      });
    } else {
      debugInfo.serviceWorker = 'Not supported';
    }

    setInfo(debugInfo);
  }, []);

  const testNavigation = (path) => {
    console.log('Testing navigation to:', path);
    alert(`About to navigate to: ${path}\n\nCheck if you actually navigate there.`);
    window.location.href = path;
  };

  const clearServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      alert('Service worker cleared! Page will reload.');
      window.location.reload(true);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    alert('LocalStorage cleared! Page will reload.');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>🔍 Debug Page</h1>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Current State</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Navigation</h2>
        <p>Click these buttons to test if navigation works:</p>

        <button
          onClick={() => testNavigation('/Ward-rounds/dashboard/')}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🏥 Test: Go to Dashboard
        </button>

        <button
          onClick={() => testNavigation('/Ward-rounds/scanner/')}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📷 Test: Go to Scanner
        </button>

        <button
          onClick={() => testNavigation('/Ward-rounds/patients/')}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ➕ Test: Go to Patients
        </button>

        <button
          onClick={() => testNavigation('/Ward-rounds/reports/')}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📊 Test: Go to Reports
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>

        <button
          onClick={clearServiceWorker}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Clear Service Worker & Reload
        </button>

        <button
          onClick={clearLocalStorage}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            margin: '5px 0',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Clear LocalStorage & Reload
        </button>
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Important</h3>
        <p style={{ margin: 0 }}>
          If the test buttons don't navigate, check the browser console (F12) for errors.
          The issue is likely a cached service worker or JavaScript not loading properly.
        </p>
      </div>
    </div>
  );
}
