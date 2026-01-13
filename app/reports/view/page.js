'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReportViewContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('presentation');
  const [expandedSection, setExpandedSection] = useState('oneLiner');
  const [revealedAnswers, setRevealedAnswers] = useState({});

  useEffect(() => {
    // Get report ID from URL query parameter
    const reportId = searchParams?.get('id');
    if (!reportId) {
      setLoading(false);
      return;
    }

    // Load report from localStorage
    const reports = JSON.parse(localStorage.getItem('medward_reports') || '[]');
    const found = reports.find(r => r.id == reportId);

    setReport(found);
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading report...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📄</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">This report may have been deleted.</p>
          <button
            onClick={() => window.location.href = '/Ward-rounds/reports/'}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const presentation = report.presentation || {};
  const pearls = report.clinicalPearls?.pearls || [];
  const questions = report.potentialQuestions?.questions || [];

  const tabs = [
    { id: 'presentation', label: 'Presentation', icon: '📋' },
    { id: 'pearls', label: 'Pearls', icon: '💎', count: pearls.length },
    { id: 'questions', label: 'Questions', icon: '❓', count: questions.length }
  ];

  const sections = [
    { id: 'oneLiner', title: 'One-Liner', content: presentation.oneLiner },
    { id: 'subjective', title: 'Subjective', content: presentation.subjective },
    { id: 'objective', title: 'Objective', content: presentation.objective },
    { id: 'assessment', title: 'Assessment', content: presentation.assessment },
    { id: 'plan', title: 'Plan', content: presentation.plan }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/Ward-rounds/reports/'}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Report Analysis</h1>
                <p className="text-sm text-gray-500">{report.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                📤 Share
              </button>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
                📥 Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      {report.ocrConfidence && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm font-medium">
              ✓ OCR Confidence: {Math.round(report.ocrConfidence * 100)}%
            </span>
            <span className="text-sm">
              Status: {report.status === 'analyzed' ? '✓ Analyzed' : '⏳ Processing'}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {activeTab === 'presentation' && (
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <span className="text-gray-400 text-xl">
                    {expandedSection === section.id ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSection === section.id && (
                  <div className="px-6 pb-6">
                    <div className="prose prose-slate max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                        {section.content || 'No content available'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pearls' && (
          <div className="space-y-4">
            {pearls.length > 0 ? (
              pearls.map((pearl, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg text-gray-900 font-medium mb-3">{pearl.pearl}</p>
                      <p className="text-sm text-gray-600 mb-3">{pearl.relevance}</p>
                      <div className="flex gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          pearl.difficulty === 'basic' ? 'bg-green-100 text-green-700' :
                          pearl.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pearl.difficulty}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {pearl.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl">
                <span className="text-6xl mb-4 block">💎</span>
                <p className="text-gray-500">No clinical pearls available for this report</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-lg text-gray-900 font-medium flex-1">{q.question}</p>
                  </div>
                  <button
                    onClick={() => setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors"
                  >
                    {revealedAnswers[index] ? '👁️ Hide Answer' : '🔍 Reveal Answer'}
                  </button>
                  {revealedAnswers[index] && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Answer:</span>
                        <p className="text-sm text-gray-900 mt-1">{q.answer}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Teaching Point:</span>
                        <p className="text-sm text-gray-900 mt-1">{q.teachingPoint}</p>
                      </div>
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                        q.difficulty === 'basic' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        Difficulty: {q.difficulty}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl">
                <span className="text-6xl mb-4 block">❓</span>
                <p className="text-gray-500">No teaching questions available for this report</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


export default function ReportViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading report...</span>
        </div>
      </div>
    }>
      <ReportViewContent />
    </Suspense>
  );
}
