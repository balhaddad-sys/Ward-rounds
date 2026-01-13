'use client';

import { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';

// Dynamically import Webcam to avoid SSR issues
const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

/**
 * Enhanced Document Scanner Component
 * Supports camera capture and file upload for medical documents
 */
export function DocumentScanner({ onCapture }) {
  const [mode, setMode] = useState('camera');
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const webcamRef = useRef(null);

  const videoConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;

    setCapturing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080
      });

      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });

      onCapture(file, 'camera');
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, [onCapture]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      onCapture(acceptedFiles[0], 'upload');
    }
  }, [onCapture]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Mode toggle */}
      <div className="flex gap-2 p-4 bg-slate-800">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            mode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          📷 Camera
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          📁 Upload
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="relative flex-1 bg-black">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full text-white p-8">
              <span className="text-6xl mb-4">📷</span>
              <h3 className="text-xl font-semibold mb-2">Camera Access Needed</h3>
              <p className="text-sm text-slate-400 text-center mb-4">
                {cameraError}
              </p>
              <button
                onClick={() => setMode('upload')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Use File Upload Instead
              </button>
            </div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.95}
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMediaError={(error) => {
                  console.error('Camera error:', error);
                  setCameraError('Unable to access camera. Please check permissions or use file upload.');
                }}
              />

              {/* Guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
                    Align document within frame
                  </div>
                  {/* Corner guides */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500" />
                </div>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 items-center">
                {/* Flash button */}
                <button className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur flex items-center justify-center text-white">
                  ⚡
                </button>

                {/* Capture button */}
                <button
                  onClick={capturePhoto}
                  disabled={capturing}
                  className="w-20 h-20 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {capturing ? (
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-600" />
                  )}
                </button>

                {/* Gallery button */}
                <button
                  onClick={() => setMode('upload')}
                  className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur flex items-center justify-center text-white"
                >
                  🖼️
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${
            isDragActive
              ? 'bg-blue-900/20 border-2 border-blue-500 border-dashed'
              : 'bg-slate-800'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center mb-6">
            <span className="text-6xl">
              {isDragActive ? '📥' : '📄'}
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            {isDragActive ? 'Drop file here' : 'Upload Document'}
          </h3>
          <p className="text-slate-400 text-center mb-6">
            {isDragActive ? (
              'Release to upload'
            ) : (
              <>
                Tap to select or drag and drop<br />
                Supports: JPG, PNG, PDF (up to 10MB)
              </>
            )}
          </p>
          <div className="flex gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span>✓</span> Lab Reports
            </span>
            <span className="flex items-center gap-1">
              <span>✓</span> X-rays
            </span>
            <span className="flex items-center gap-1">
              <span>✓</span> CT/MRI
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentScanner;
