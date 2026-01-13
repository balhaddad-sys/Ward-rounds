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
      // Step 1: Extract text from document using OCR
      console.log('[Scanner] Starting OCR extraction...');
      const { processDocument } = await import('@/lib/ocr/textExtractor');

      const documentType = file.type.includes('pdf') ? 'general' : 'lab';
      const ocrResult = await processDocument(file, documentType);

      console.log('[Scanner] OCR complete, confidence:', ocrResult.confidence);

      // Step 2: Interpret the document with AI
      console.log('[Scanner] Interpreting document...');
      const { interpretDocument, generateClinicalPearls, generateTeachingQuestions } = await import('@/lib/ai/medicalInterpreter');
      const interpretation = await interpretDocument(ocrResult);

      console.log('[Scanner] Interpretation complete');

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
        extractedText: ocrResult.rawText,
        ocrConfidence: ocrResult.confidence,
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
      alert(`Failed to process report: ${error.message}`);
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
              <h4 className="font-semibold text-gray-900 mb-1">Supported Formats</h4>
              <p className="text-sm text-gray-600">
                You can upload lab results, imaging reports, discharge summaries, and other medical documents.
                Supported formats: JPG, PNG, PDF (up to 10MB)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
