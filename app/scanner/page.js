'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';

export default function ScannerPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  const handleCapture = async (file, method) => {
    setUploading(true);
    setUploadSuccess(false);

    try {
      console.log('[Scanner] Uploading document to API...');

      // Get auth token
      const token = localStorage.getItem('medward_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in first.');
      }

      // Determine report type from file type or let user select
      const reportType = file.type.includes('pdf') ? 'general' : 'lab';

      // Create form data
      const formData = new FormData();
      formData.append('document', file);
      formData.append('reportType', reportType);

      // Optional: Add patient ID if available
      const currentPatientId = sessionStorage.getItem('currentPatientId');
      if (currentPatientId) {
        formData.append('patientId', currentPatientId);
      }

      // Upload to API
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('[Scanner] Upload complete:', data);

      // Also save to localStorage for offline access
      const existingReports = JSON.parse(localStorage.getItem('medward_reports') || '[]');
      const newReport = {
        ...data.report,
        uploadMethod: method
      };
      existingReports.unshift(newReport);
      localStorage.setItem('medward_reports', JSON.stringify(existingReports));

      // Optional: Save to Google Sheets (async, don't wait)
      try {
        const { saveReportToSheets } = await import('@/lib/services/googleScript');
        saveReportToSheets(newReport)
          .then(() => console.log('[Scanner] ✓ Report saved to Google Sheets'))
          .catch(err => console.warn('[Scanner] Failed to save to Google Sheets:', err.message));
      } catch (err) {
        console.warn('[Scanner] Google Sheets integration not available');
      }

      setUploadSuccess(true);

      // Redirect to report detail page after 2 seconds
      setTimeout(() => {
        window.location.href = `/Ward-rounds/reports/view/?id=${data.report.id}`;
      }, 2000);
    } catch (error) {
      console.error('[Scanner] Error:', error);
      console.error('[Scanner] Error stack:', error.stack);

      // Show user-friendly error message
      let errorMessage = error.message;

      // Add helpful tips based on error type
      if (errorMessage.includes('No text detected') || errorMessage.includes('extract text')) {
        errorMessage += '\n\nTips for better results:\n• Use good lighting\n• Hold camera steady\n• Ensure text is in focus\n• Try uploading a file instead';
      }

      alert(`Failed to process report:\n\n${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/Ward-rounds/dashboard/'}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📷</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scan Report</h1>
                <p className="text-sm text-gray-500">Upload medical documents for analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {uploading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Uploading report...</p>
            </div>
          ) : uploadSuccess ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">Upload Successful!</p>
              <p className="text-gray-600">Redirecting to reports...</p>
            </div>
          ) : (
            <DocumentScanner onCapture={handleCapture} />
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Tips for Best Results</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use good lighting and avoid shadows</li>
                <li>• Ensure text is clear and in focus</li>
                <li>• Align the document properly in the frame</li>
                <li>• Supported: Lab results, imaging reports, clinical notes</li>
                <li>• Formats: JPG, PNG, PDF (up to 10MB)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
