'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { captureLoginFailure } from '@/lib/analytics/login-failure-analyzer';

// Ensure this matches your DEPLOYED Web App URL
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

    /**
     * MASTER SHIFU: The "Secret Sauce" is here.
     * We change Content-Type to 'text/plain'. 
     * This makes it a "Simple Request" and bypasses the CORS Preflight block.
     */
    const requestOptions = {
      method: 'POST',
      mode: 'cors', // Explicitly allow CORS
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'login',
        username: username.trim()
      })
    };

    try {
      console.log('[Login] Attempting login for:', username);

      response = await fetch(API_URL, requestOptions);

      // Google Apps Script usually returns 200 even for some errors, 
      // but if the network fails, it will catch below.
      if (!response.ok) {
        throw new Error(`Network response was not ok (Status: ${response.status})`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('medward_token', data.token);
      localStorage.setItem('medward_user', JSON.stringify(data.user));

      console.log('[Login] ✓ Success! Redirecting...');
      router.push('/dashboard');

    } catch (err) {
      console.error('[Login] Error Details:', err);
      
      // Better error message for the student
      let friendlyError = err.message;
      if (err.message.includes('Failed to fetch')) {
        friendlyError = 'Could not connect to the medical server. Please check your internet or script deployment.';
      }
      
      setError(friendlyError);

      try {
        await captureLoginFailure({
          error: err,
          url: API_URL,
          username: username.trim(),
          timing: { duration: Date.now() - startTime }
        });
      } catch (analyticsErr) {
        console.warn('Analytics failed:', analyticsErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl transform hover:scale-110 transition-all duration-300">
            <span className="text-5xl">🏥</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MedWard</h1>
          <p className="text-gray-700 font-medium">Medical Report Interpreter</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-white/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-8 text-sm">Sign in to begin your rounds</p>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">👤</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white/50 text-gray-900"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 disabled:opacity-50 shadow-lg"
            >
              {loading ? "Connecting..." : "Continue →"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 italic">
              "Healing is a matter of time, but it is sometimes also a matter of opportunity."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
