'use client';

import { useState } from 'react';

/**
 * Export Modal Component
 * Allows users to export presentations in various formats
 */
export function ExportModal({ isOpen, onClose, presentation, reportName = 'presentation' }) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportStatus, setExportStatus] = useState('');

  if (!isOpen) return null;

  const exportOptions = [
    {
      id: 'pdf',
      name: 'PDF Document',
      icon: '📄',
      description: 'Best for printing and sharing. Works on all devices.',
      action: async () => {
        const { downloadPDF } = await import('@/lib/export/pdfExporter');
        await downloadPDF(presentation, `${reportName}.pdf`);
      }
    },
    {
      id: 'pptx',
      name: 'PowerPoint',
      icon: '📊',
      description: 'Editable slides for teaching presentations.',
      action: async () => {
        const { downloadPPTX } = await import('@/lib/export/pptxExporter');
        await downloadPPTX(presentation, `${reportName}.pptx`);
      }
    },
    {
      id: 'json',
      name: 'JSON Data',
      icon: '💾',
      description: 'Raw data for integration with other systems.',
      action: async () => {
        const { downloadAsJSON } = await import('@/lib/sharing/shareUtils');
        downloadAsJSON(presentation, `${reportName}.json`);
      }
    }
  ];

  const handleExport = async () => {
    const option = exportOptions.find(opt => opt.id === exportFormat);
    if (!option) return;

    setExporting(true);
    setExportStatus('Generating...');

    try {
      await option.action();
      setExportStatus('✅ Downloaded successfully!');

      setTimeout(() => {
        setExportStatus('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('❌ Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePreview = async () => {
    if (exportFormat !== 'pdf') {
      setExportStatus('Preview only available for PDF');
      return;
    }

    setExporting(true);
    setExportStatus('Opening preview...');

    try {
      const { openPDFInNewTab } = await import('@/lib/export/pdfExporter');
      await openPDFInNewTab(presentation);
      setExportStatus('');
    } catch (error) {
      console.error('Preview error:', error);
      setExportStatus('❌ Preview failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Export Presentation</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-white/80 text-sm mt-2">Choose your export format</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {exportOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setExportFormat(option.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                exportFormat === option.id
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-4xl">{option.icon}</span>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {option.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {option.description}
                </p>
              </div>
              {exportFormat === option.id && (
                <span className="text-primary text-2xl">✓</span>
              )}
            </button>
          ))}

          {/* Status Message */}
          {exportStatus && (
            <div className={`p-3 rounded-lg text-center ${
              exportStatus.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              exportStatus.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {exportStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 flex gap-3">
          {exportFormat === 'pdf' && (
            <button
              onClick={handlePreview}
              disabled={exporting}
              className="flex-1 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👁️ Preview
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? '⏳ Exporting...' : '📥 Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
