export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo */}
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <span className="text-5xl">🏥</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          MedWard
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          AI-Powered Medical Report Interpreter
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="font-semibold text-gray-900 mb-2">Scan Documents</h3>
            <p className="text-sm text-gray-600">
              Upload lab results, imaging reports, or clinical notes
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Interpretation</h3>
            <p className="text-sm text-gray-600">
              Get instant GPT-4 powered analysis and insights
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="font-semibold text-gray-900 mb-2">Clinical Pearls</h3>
            <p className="text-sm text-gray-600">
              Learn with auto-generated teaching points
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            Learn More
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">60-80%</div>
              <div className="text-sm text-gray-600">API Cost Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">HIPAA</div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">PWA</div>
              <div className="text-sm text-gray-600">Works Offline</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-gray-500">
          Built with ❤️ for medical professionals
        </p>
      </div>
    </main>
  );
}
