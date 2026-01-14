'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { captureLoginFailure } from '@/lib/analytics/login-failure-analyzer';

const API_URL = 'https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username || username.trim().length === 0) {
      setError('Please enter a username');
      setLoading(false);
      return;
    }

    const startTime = Date.now();
    let response = null;
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'login',
        username: username.trim()
      })
    };

    try {
      console.log('[Login] Attempting login for:', username);

      // Use Google Apps Script backend with POST + JSON
      response = await fetch(API_URL, requestOptions);

      console.log('[Login] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Login] Response data:', { success: data.success, hasToken: !!data.token, hasUser: !!data.user });

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server (missing token or user data)');
      }

      // Store token and user data
      localStorage.setItem('medward_token', data.token);
      localStorage.setItem('medward_user', JSON.stringify(data.user));

      console.log('[Login] ✓ Login successful, redirecting to dashboard...');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err.message || 'Login failed. Please try again.');

      // Capture failure for post-hoc analysis
      try {
        await captureLoginFailure({
          error: err,
          response: response,
          url: API_URL,
          requestOptions: requestOptions,
          username: username.trim(),
          timing: {
            start: startTime,
            duration: Date.now() - startTime
          }
        });
      } catch (analyzerError) {
        console.warn('[Login] Failed to capture error analytics:', analyzerError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 animate-bounce-slow">
            <span className="text-5xl">🏥</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">MedWard</h1>
          <p className="text-gray-700 font-medium">Medical Report Interpreter</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-white/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-8 text-sm">Sign in to continue your medical journey</p>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-2xl">👤</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-14 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white/50 font-medium text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Continue
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-3">
              <span className="font-medium">New user?</span> Just enter any username to create an account
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
          <p className="text-center text-sm text-gray-700 font-medium flex items-center justify-center gap-2">
            <span className="text-lg">🔒</span>
            Your medical data is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}
