'use client';

import { useCallback } from 'react';

/**
 * Simplified Document Scanner Component
 * Allows file upload for medical documents
 */
export function DocumentScanner({ onCapture }) {
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (file && onCapture) {
      onCapture(file, 'upload');
    }
  }, [onCapture]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && onCapture) {
      onCapture(file, 'upload');
    }
  }, [onCapture]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-800">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex-1 flex flex-col items-center justify-center p-8"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/20">
          <span className="text-5xl">📄</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Upload Document
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
          Select or drag and drop a medical document
          <br />
          Supports: JPG, PNG, PDF
        </p>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg">
            <span className="text-xl">📁</span>
            Choose File
          </span>
        </label>

        <p className="text-xs text-slate-400 mt-4">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}

export default DocumentScanner;
