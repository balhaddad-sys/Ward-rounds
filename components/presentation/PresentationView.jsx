'use client';

import { useState } from 'react';
import { ExportModal } from '@/components/modals/ExportModal';
import { ShareModal } from '@/components/modals/ShareModal';

/**
 * Presentation View Component
 * Displays ward presentation in SOAP format with pearls and questions
 */
export function PresentationView({ presentation, pearls, questions, report }) {
  const [activeTab, setActiveTab] = useState('presentation');
  const [expandedSection, setExpandedSection] = useState('oneliner');
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const tabs = [
    { id: 'presentation', label: 'Presentation', icon: '📋' },
    { id: 'pearls', label: 'Pearls', icon: '💎' },
    { id: 'questions', label: 'Questions', icon: '❓' }
  ];

  const sections = [
    { id: 'oneliner', title: 'One-Liner', content: presentation?.oneLiner },
    { id: 'subjective', title: 'Subjective', content: presentation?.subjective },
    { id: 'objective', title: 'Objective', content: presentation?.objective },
    { id: 'assessment', title: 'Assessment', content: presentation?.assessment },
    { id: 'plan', title: 'Plan', content: presentation?.plan }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Tab bar */}
      <div className="flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'presentation' && (
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{section.title}</span>
                  <span className="text-slate-400 text-lg">{expandedSection === section.id ? '▼' : '▶'}</span>
                </button>
                {expandedSection === section.id && (
                  <div className="px-4 pb-4 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {section.content || 'No content available'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pearls' && (
          <div className="space-y-3">
            {pearls?.map((pearl, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">💎</span>
                  <div className="flex-1">
                    <p className="text-slate-900 dark:text-white font-medium mb-2">{pearl.pearl}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{pearl.relevance}</p>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pearl.difficulty === 'basic' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        pearl.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {pearl.difficulty}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {pearl.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )) || <p className="text-center text-slate-500 py-8">No pearls available</p>}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {questions?.map((q, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card">
                <p className="text-slate-900 dark:text-white font-medium mb-3">
                  {index + 1}. {q.question}
                </p>
                <button
                  onClick={() => setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))}
                  className="w-full py-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-lg text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                >
                  {revealedAnswers[index] ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                {revealedAnswers[index] && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                    <p className="text-sm text-slate-900 dark:text-white">
                      <strong>Answer:</strong> {q.answer}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <strong>Teaching Point:</strong> {q.teachingPoint}
                    </p>
                  </div>
                )}
              </div>
            )) || <p className="text-center text-slate-500 py-8">No questions available</p>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg"
        >
          📤 Share
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          📥 Export
        </button>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        presentation={{ ...presentation, pearls, questions }}
        reportName={`ward-presentation-${new Date().toISOString().split('T')[0]}`}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        presentation={{ ...presentation, pearls, questions }}
        report={report}
      />
    </div>
  );
}

export default PresentationView;
