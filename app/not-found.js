import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-9xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-pulse-slow">
            404
          </div>
          <div className="text-6xl mb-6 animate-bounce-slow">🏥</div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          Oops! Looks like this page took an unexpected detour. Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="group px-10 py-5 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
          <Link
            href="/dashboard"
            className="px-10 py-5 bg-white/90 backdrop-blur-sm text-gray-800 border-2 border-gray-300 rounded-2xl font-bold text-lg hover:bg-white hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white/50">
          <h2 className="font-semibold text-gray-900 mb-4">You might be looking for:</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Link href="/login" className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 font-medium text-primary">
              🔐 Login
            </Link>
            <Link href="/dashboard" className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all hover:-translate-y-1 font-medium text-purple-700">
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
