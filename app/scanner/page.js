'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';
import { initPostHog, trackOCR, trackAI, trackError, trackUserAction } from '@/lib/analytics/posthog-client';

export default function ScannerPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
    trackUserAction('page_view', { page: 'scanner' });
  }, []);

  const handleCapture = async (file, method) => {
    setUploading(true);
    setUploadSuccess(false);

    const startTime = Date.now();

    try {
      // Step 1: Extract text from document using OCR
      console.log('[Scanner] Starting OCR extraction...');
      trackOCR('start', {
        fileType: file.type,
        fileSize: file.size,
        method
      });

      const documentType = file.type.includes('pdf') ? 'general' : 'lab';
      let ocrResult;
      let ocrMethod = 'unknown';

      // Try server-side Google Cloud Vision API first (better accuracy)
      try {
        console.log('[Scanner] Attempting server-side OCR with Google Cloud Vision...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('[Scanner] ✓ Using Google Cloud Vision API');
          ocrResult = result.ocrResult;
          ocrMethod = 'google-cloud-vision';
        } else if (result.fallbackToClientSide) {
          console.log('[Scanner] ⚠ Server-side OCR not available, falling back to client-side Tesseract.js');
          throw new Error('Fallback to client-side');
        } else {
          throw new Error(result.error || 'Server-side OCR failed');
        }
      } catch (serverError) {
        // Fallback to client-side Tesseract.js
        console.log('[Scanner] Using client-side Tesseract.js OCR...');
        const { processDocument } = await import('@/lib/ocr/textExtractor');
        ocrResult = await processDocument(file, documentType);
        ocrMethod = 'tesseract-js';
      }

      const ocrTime = Date.now() - startTime;
      console.log(`[Scanner] OCR complete using ${ocrMethod}, confidence: ${ocrResult.confidence}`);

      // Track OCR success
      trackOCR('complete', {
        method: ocrMethod,
        confidence: ocrResult.confidence,
        fileType: file.type,
        fileSize: file.size,
        textLength: (ocrResult.rawText || ocrResult.fullText || '').length,
        processingTime: ocrTime
      });

      // Check if OCR detected any text (check both possible field names)
      const extractedText = ocrResult.rawText || ocrResult.fullText || '';
      if (!extractedText || extractedText.trim().length === 0) {
        const noTextError = new Error('No text detected in the image. Please ensure:\n• The image is clear and well-lit\n• The text is in focus\n• The document is properly aligned\n• There is sufficient contrast');
        trackOCR('failed', {
          method: ocrMethod,
          fileType: file.type,
          fileSize: file.size,
          error: noTextError.message,
          processingTime: Date.now() - startTime
        });
        throw noTextError;
      }

      // Check confidence level
      if (ocrResult.confidence < 0.3) {
        console.warn('[Scanner] Low OCR confidence:', ocrResult.confidence);
        trackOCR('low_confidence', {
          method: ocrMethod,
          confidence: ocrResult.confidence,
          fileType: file.type
        });
        alert('Warning: Low text detection confidence. The results may not be accurate. Consider retaking the image with better lighting.');
      }

      // Step 2: Interpret the document with AI
      console.log('[Scanner] Interpreting document...');
      trackAI('start', {
        documentType,
        textLength: extractedText.length
      });

      const aiStartTime = Date.now();
      const { interpretDocument, generateClinicalPearls, generateTeachingQuestions } = await import('@/lib/ai/medicalInterpreter');
      const interpretation = await interpretDocument(ocrResult);

      const aiTime = Date.now() - aiStartTime;
      console.log('[Scanner] Interpretation complete');

      trackAI('complete', {
        provider: interpretation.source,
        documentType,
        processingTime: aiTime,
        findingsCount: interpretation.findings?.length || 0,
        usedAI: interpretation.usedAI
      });

      // Step 3: Generate clinical pearls
      console.log('[Scanner] Generating clinical pearls...');
      const clinicalPearls = await generateClinicalPearls(interpretation, documentType);

      // Step 4: Generate teaching questions
      console.log('[Scanner] Generating teaching questions...');
      const potentialQuestions = await generateTeachingQuestions(interpretation, documentType);

      // Step 5: Generate ward presentation
      console.log('[Scanner] Generating presentation...');
      const { generatePresentation } = await import('@/lib/presentation/generator');

      const patientInfo = {
        age: 'XX',
        gender: 'unknown',
        chiefComplaint: 'presenting'
      };

      // Create complete report structure for presentation generator
      const reportForPresentation = {
        type: documentType,
        interpretation: interpretation,
        clinicalPearls: clinicalPearls,
        potentialQuestions: potentialQuestions,
        extractedText: ocrResult.rawText,
        ocrConfidence: ocrResult.confidence
      };

      const presentationData = generatePresentation(reportForPresentation, patientInfo);

      console.log('[Scanner] Presentation generated');

      // Step 6: Save complete report to localStorage
      const existingReports = JSON.parse(localStorage.getItem('medward_reports') || '[]');

      const newReport = {
        id: Date.now(),
        type: documentType,
        title: file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadMethod: method,
        date: new Date().toISOString(),
        status: 'analyzed',
        patientName: 'New Patient',
        patientMrn: 'TBD',
        // Add OCR results
        extractedText: ocrResult.rawText || ocrResult.fullText,
        ocrConfidence: ocrResult.confidence,
        ocrMethod: ocrMethod, // Track which OCR method was used
        // Add AI interpretation
        interpretation: interpretation,
        // Add presentation
        presentation: presentationData.presentation,
        clinicalPearls: presentationData.clinicalPearls,
        potentialQuestions: presentationData.potentialQuestions
      };

      existingReports.unshift(newReport);
      localStorage.setItem('medward_reports', JSON.stringify(existingReports));

      console.log('[Scanner] Report saved to localStorage');

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
        window.location.href = `/Ward-rounds/reports/view/?id=${newReport.id}`;
      }, 2000);
    } catch (error) {
      console.error('[Scanner] Error:', error);
      console.error('[Scanner] Error stack:', error.stack);

      // Track error with PostHog
      trackError(error, {
        page: 'scanner',
        file_type: file?.type,
        file_size: file?.size,
        upload_method: method,
        processing_time: Date.now() - startTime
      });

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
