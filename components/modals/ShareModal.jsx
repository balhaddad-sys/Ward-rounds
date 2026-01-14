'use client';

import { useState, useEffect } from 'react';
import {
  generateShareLink,
  copyToClipboard,
  shareViaWebShare,
  shareViaEmail,
  shareViaWhatsApp,
  shareViaTelegram,
  generateQRCode,
  getAvailableShareMethods
} from '@/lib/sharing/shareUtils';

/**
 * Share Modal Component
 * Provides various sharing options for presentations
 */
export function ShareModal({ isOpen, onClose, presentation, report }) {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isOpen && report) {
      const link = generateShareLink(report);
      setShareLink(link);
      setQrCodeUrl(generateQRCode(link));
    }
  }, [isOpen, report]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    const success = await shareViaWebShare({
      title: 'Ward Presentation',
      text: presentation.oneLiner || 'Medical presentation',
      url: shareLink
    });

    if (!success) {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      id: 'native',
      name: 'Share',
      icon: '📤',
      description: 'Use device share menu',
      action: handleNativeShare,
      available: typeof navigator !== 'undefined' && 'share' in navigator
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: '🔗',
      description: 'Copy link to clipboard',
      action: handleCopyLink,
      available: true
    },
    {
      id: 'email',
      name: 'Email',
      icon: '📧',
      description: 'Share via email',
      action: () => shareViaEmail(presentation, shareLink),
      available: true
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      description: 'Share on WhatsApp',
      action: () => shareViaWhatsApp(presentation, shareLink),
      available: true
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      description: 'Share on Telegram',
      action: () => shareViaTelegram(presentation, shareLink),
      available: true
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: '📱',
      description: 'Show QR code',
      action: () => setShowQR(!showQR),
      available: true
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Share Presentation</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-white/80 text-sm mt-2">Share with colleagues and students</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Share Link Display */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
            {copied && (
              <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                ✓ Link copied to clipboard!
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Link expires in 7 days
            </p>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center border-2 border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Scan to View
              </h3>
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto w-64 h-64 border-4 border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                Scan with any QR code reader
              </p>
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Share via:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.filter(opt => opt.available).map(option => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 ${
                    option.id === 'qr' && showQR
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-3xl">{option.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {option.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                  About Sharing
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                  Shared presentations are stored locally and expire after 7 days.
                  Anyone with the link can view the presentation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
