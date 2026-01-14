'use client';

import { useState } from 'react';

export default function DiagnosticPage() {
  const [results, setResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics = {};

    // Check authentication
    const token = localStorage.getItem('medward_token');
    diagnostics.hasToken = !!token;
    diagnostics.token = token ? `${token.substring(0, 20)}...` : 'Not set';

    // Check API connectivity
    try {
      const authResponse = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      diagnostics.apiConnected = authResponse.status === 200;
      diagnostics.authStatus = authResponse.status;
    } catch (error) {
      diagnostics.apiConnected = false;
      diagnostics.apiError = error.message;
    }

    // Check environment
    try {
      const envResponse = await fetch('/api/documents/upload');
      diagnostics.uploadEndpointExists = envResponse.status !== 404;
    } catch (error) {
      diagnostics.uploadEndpointExists = false;
    }

    // Check localStorage reports
    const reports = JSON.parse(localStorage.getItem('medward_reports') || '[]');
    diagnostics.localReportsCount = reports.length;
    diagnostics.latestReport = reports[0] ? {
      id: reports[0].id,
      type: reports[0].type,
      hasInterpretation: !!reports[0].interpretation,
      createdAt: reports[0].createdAt
    } : null;

    setResults(diagnostics);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">🔍 MedWard Diagnostics</h1>

          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <h2 className="font-bold text-yellow-900 mb-2">⚠️ Important: API Keys Required</h2>
            <p className="text-yellow-800 text-sm">
              For the system to work, you need to add your API keys to <code className="bg-yellow-200 px-2 py-1 rounded">.env.local</code>:
            </p>
            <ul className="mt-3 text-sm text-yellow-800 space-y-1">
              <li>• <strong>OPENAI_API_KEY</strong> - Get from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="underline">platform.openai.com/api-keys</a></li>
              <li>• <strong>GOOGLE_CLOUD_CREDENTIALS</strong> - Optional, for better OCR (or use Tesseract.js fallback)</li>
            </ul>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={testing}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-6"
          >
            {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>

          {results && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Results:</h2>

              <DiagnosticItem
                label="Authentication Token"
                status={results.hasToken}
                value={results.token}
              />

              <DiagnosticItem
                label="API Connectivity"
                status={results.apiConnected}
                value={`Status: ${results.authStatus || 'Error'}`}
                error={results.apiError}
              />

              <DiagnosticItem
                label="Upload Endpoint"
                status={results.uploadEndpointExists}
                value="POST /api/documents/upload"
              />

              <DiagnosticItem
                label="Local Reports"
                status={results.localReportsCount > 0}
                value={`${results.localReportsCount} reports stored`}
              />

              {results.latestReport && (
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <h3 className="font-bold mb-2">Latest Report:</h3>
                  <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                    {JSON.stringify(results.latestReport, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Quick Test Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. Add your OpenAI API key to .env.local</li>
              <li>2. Restart the dev server: <code className="bg-blue-200 px-2 py-1 rounded">npm run dev</code></li>
              <li>3. Go to <a href="/login" className="underline">/login</a> and log in</li>
              <li>4. Go to <a href="/scanner" className="underline">/scanner</a> and upload a test image</li>
              <li>5. Check browser console (F12) for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticItem({ label, status, value, error }) {
  return (
    <div className={`p-4 rounded-xl border-2 ${
      status
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{label}</span>
        <span className="text-2xl">{status ? '✅' : '❌'}</span>
      </div>
      <p className={`text-sm mt-2 ${status ? 'text-green-700' : 'text-red-700'}`}>
        {value}
      </p>
      {error && (
        <p className="text-xs text-red-600 mt-1">Error: {error}</p>
      )}
    </div>
  );
}
