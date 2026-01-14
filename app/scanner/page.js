'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';

export default function ScannerPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, files: [] });
  const [processedReports, setProcessedReports] = useState([]);
  const router = useRouter();

  const handleCapture = async (files, method) => {
    // Handle both single file and array of files
    const fileArray = Array.isArray(files) ? files : [files];

    if (fileArray.length === 0) {
      setError('No files selected');
      return;
    }

    console.log(`[Scanner] Processing ${fileArray.length} file(s)...`);

    setUploading(true);
    setUploadSuccess(false);
    setError('');
    setProcessedReports([]);
    setBatchProgress({ current: 0, total: fileArray.length, files: [] });

    try {
      // Get auth token
      const token = localStorage.getItem('medward_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in first.');
      }

      const { processDocumentAuto } = await import('@/lib/services/completeGoogleScriptFlow');
      const { preprocessImage } = await import('@/lib/ocr/imagePreprocessor');

      const allReports = [];
      const existingReports = JSON.parse(localStorage.getItem('medward_reports') || '[]');

      // Process each file
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileNum = i + 1;

        console.log(`[Scanner] Processing file ${fileNum}/${fileArray.length}: ${file.name}`);

        setBatchProgress(prev => ({
          ...prev,
          current: fileNum,
          files: [...prev.files, { name: file.name, status: 'processing' }]
        }));

        setProcessingStep(`File ${fileNum}/${fileArray.length}: Preprocessing image...`);

        try {
          // Preprocess image for better OCR (handles rotation, enhancement)
          let processedFile = file;
          if (file.type.startsWith('image/')) {
            console.log(`[Scanner] Preprocessing image: ${file.name}`);
            const preprocessedBlob = await preprocessImage(file);
            processedFile = new File([preprocessedBlob], file.name, { type: 'image/jpeg' });
          }

          // Determine report type
          const reportType = file.type.includes('pdf') ? 'general' : 'lab';

          setProcessingStep(`File ${fileNum}/${fileArray.length}: OCR and AI analysis...`);

          // Process document
          const data = await processDocumentAuto(processedFile, reportType);

          console.log(`[Scanner] File ${fileNum} complete:`, {
            success: data.success,
            reportId: data.report?.id,
            hasInterpretation: !!data.report?.interpretation
          });

          // Save report
          const newReport = {
            ...data.report,
            uploadMethod: method,
            fileName: file.name,
            processingOrder: fileNum
          };

          allReports.push(newReport);
          existingReports.unshift(newReport);

          // Update batch progress
          setBatchProgress(prev => {
            const updatedFiles = [...prev.files];
            updatedFiles[updatedFiles.length - 1].status = 'complete';
            return { ...prev, files: updatedFiles };
          });

          // Optional: Save to Google Sheets (async, don't wait)
          try {
            const { saveReportToSheets } = await import('@/lib/services/googleScript');
            saveReportToSheets(newReport).catch(err =>
              console.warn('[Scanner] Failed to save to Google Sheets:', err.message)
            );
          } catch (err) {
            console.warn('[Scanner] Google Sheets integration not available');
          }

        } catch (fileError) {
          console.error(`[Scanner] Error processing file ${fileNum}:`, fileError);

          // Mark file as failed but continue with others
          setBatchProgress(prev => {
            const updatedFiles = [...prev.files];
            updatedFiles[updatedFiles.length - 1].status = 'failed';
            updatedFiles[updatedFiles.length - 1].error = fileError.message;
            return { ...prev, files: updatedFiles };
          });
        }
      }

      // Save all reports to localStorage
      localStorage.setItem('medward_reports', JSON.stringify(existingReports));
      setProcessedReports(allReports);

      setProcessingStep('All files processed!');
      setUploadSuccess(true);

      console.log(`[Scanner] Batch complete: ${allReports.length}/${fileArray.length} successful`);

      // Redirect based on number of reports
      setTimeout(() => {
        if (allReports.length === 1) {
          // Single report: go to detail page
          router.push(`/reports/view/?id=${allReports[0].id}`);
        } else {
          // Multiple reports: go to reports list
          router.push('/reports');
        }
      }, 2000);

    } catch (error) {
      console.error('[Scanner] Batch processing error:', error);

      let errorMessage = error.message;

      if (errorMessage.includes('No text detected') || errorMessage.includes('extract text')) {
        errorMessage += '\n\nTips for better results:\n• Use good lighting\n• Hold camera steady\n• Ensure text is in focus\n• Take photos from directly above (not at an angle)';
      }

      if (errorMessage.includes('Not authenticated')) {
        errorMessage += '\n\nPlease log in again to continue.';
      }

      setError(errorMessage);
      setProcessingStep('');
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
                onClick={() => router.push('/dashboard')}
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
              <p className="text-gray-900 font-medium text-lg mb-2">
                {batchProgress.total > 1
                  ? `Processing ${batchProgress.current}/${batchProgress.total} Documents`
                  : 'Processing Document'}
              </p>
              <p className="text-gray-600 text-sm">{processingStep}</p>

              {/* Batch Progress */}
              {batchProgress.total > 1 && (
                <div className="mt-6 w-full max-w-md">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    ></div>
                  </div>

                  {/* File Status List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {batchProgress.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="text-2xl">
                          {file.status === 'complete' ? '✅' :
                           file.status === 'failed' ? '❌' :
                           '⏳'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          {file.error && (
                            <p className="text-xs text-red-600 truncate">{file.error}</p>
                          )}
                        </div>
                        {file.status === 'processing' && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-gray-500 text-center max-w-md">
                <p>This may take 10-30 seconds per document.</p>
                <p className="mt-2">Steps: Preprocessing → OCR → AI Analysis → Pearls → Questions</p>
              </div>
            </div>
          ) : uploadSuccess ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">
                {processedReports.length > 1
                  ? `${processedReports.length} Reports Processed!`
                  : 'Analysis Complete!'}
              </p>
              <p className="text-gray-600">
                {processedReports.length > 1
                  ? 'Redirecting to reports list...'
                  : 'Redirecting to report...'}
              </p>

              {/* Summary of processed files */}
              {batchProgress.files.length > 1 && (
                <div className="mt-6 w-full max-w-md">
                  <div className="text-sm text-gray-700 mb-2">
                    ✅ {batchProgress.files.filter(f => f.status === 'complete').length} successful
                    {batchProgress.files.filter(f => f.status === 'failed').length > 0 && (
                      <> · ❌ {batchProgress.files.filter(f => f.status === 'failed').length} failed</>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DocumentScanner onCapture={handleCapture} />
          )}
        </div>

        {/* Error Display */}
        {error && !uploading && (
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 text-lg mb-2">Upload Failed</h4>
                <p className="text-red-700 whitespace-pre-wrap">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Tips for Best Results</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Photos from any angle:</strong> Auto-rotation and enhancement enabled</li>
                <li>• <strong>Multiple uploads:</strong> Select up to 10 files at once</li>
                <li>• Use good lighting and avoid shadows</li>
                <li>• Ensure text is clear and in focus</li>
                <li>• Supported: Lab results, imaging reports, clinical notes</li>
                <li>• Formats: JPG, PNG, PDF (up to 10MB each)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
