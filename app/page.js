export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl w-full text-center relative z-10">
        {/* Logo */}
        <div className="w-28 h-28 bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 animate-bounce-slow">
          <span className="text-6xl">🏥</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse-slow">
          MedWard
        </h1>
        <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
          AI-Powered Medical Report Interpreter
        </p>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Transform your medical reports into structured presentations with the power of GPT-4
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-blue-200 group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">📷</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-xl">Scan Documents</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Upload lab results, imaging reports, or clinical notes with drag & drop simplicity
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-purple-200 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">🧠</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-xl">AI Interpretation</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Get instant GPT-4 powered analysis and clinical insights in seconds
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-amber-200 group">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">💎</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-xl">Clinical Pearls</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Learn with auto-generated teaching points and clinical knowledge gems
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="/login"
            className="group px-10 py-5 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Get Started
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </a>
          <a
            href="#features"
            className="px-10 py-5 bg-white/90 backdrop-blur-sm text-gray-800 border-2 border-gray-300 rounded-2xl font-bold text-lg hover:bg-white hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Learn More
          </a>
        </div>

        {/* Stats */}
        <div className="pt-12 border-t-2 border-gray-200/50">
          <div className="grid grid-cols-3 gap-8">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">60-80%</div>
              <div className="text-sm text-gray-700 font-medium">API Cost Savings</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">HIPAA</div>
              <div className="text-sm text-gray-700 font-medium">Compliant</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">PWA</div>
              <div className="text-sm text-gray-700 font-medium">Works Offline</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-gradient-to-r from-rose-100 via-pink-100 to-purple-100 rounded-2xl">
          <p className="text-gray-800 font-medium flex items-center justify-center gap-2">
            Built with <span className="text-2xl animate-pulse">❤️</span> for medical professionals
          </p>
        </div>
      </div>
    </main>
  );
}
