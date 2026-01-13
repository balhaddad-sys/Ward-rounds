/**
 * Generate device fingerprint for passwordless authentication
 * Uses browser characteristics to create a unique identifier
 */

/**
 * Generate a device fingerprint from browser characteristics
 * @returns {Promise<string>} - SHA-256 hash fingerprint
 */
export async function generateFingerprint() {
  const components = [];

  // Screen resolution
  components.push(`screen:${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);

  // Timezone
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // Language
  components.push(`lang:${navigator.language}`);

  // Platform
  components.push(`platform:${navigator.platform}`);

  // Hardware concurrency
  components.push(`cores:${navigator.hardwareConcurrency || 'unknown'}`);

  // Device memory (if available)
  if (navigator.deviceMemory) {
    components.push(`mem:${navigator.deviceMemory}`);
  }

  // Touch support
  components.push(`touch:${navigator.maxTouchPoints || 0}`);

  // Canvas fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 140, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('MedWard🏥', 2, 2);
    components.push(`canvas:${canvas.toDataURL().substring(0, 100)}`);
  }

  // WebGL fingerprint
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      components.push(`webgl:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
    }
  }

  // Audio context fingerprint
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const analyser = audioCtx.createAnalyser();
      const gainNode = audioCtx.createGain();
      const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      scriptProcessor.onaudioprocess = function () {
        const bins = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(bins);
        const sum = bins.reduce((acc, val) => acc + val, 0);
        components.push(`audio:${sum.toFixed(2)}`);
      };

      oscillator.start(0);
      setTimeout(() => oscillator.stop(), 10);
    }
  } catch (e) {
    // Audio fingerprinting failed, skip
  }

  // Combine all components
  const fingerprintString = components.join('|');

  // Hash the fingerprint
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify if a fingerprint matches the current device
 * @param {string} storedFingerprint - Previously stored fingerprint
 * @returns {Promise<boolean>} - True if fingerprints match
 */
export async function verifyFingerprint(storedFingerprint) {
  const currentFingerprint = await generateFingerprint();
  return currentFingerprint === storedFingerprint;
}

/**
 * Get a readable device identifier (for display purposes)
 * @returns {string} - Human-readable device info
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';

  // Detect device
  if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Android/i.test(ua)) device = 'Android Device';
  else if (/Macintosh/i.test(ua)) device = 'Mac';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Linux/i.test(ua)) device = 'Linux';

  // Detect browser
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge/i.test(ua)) browser = 'Edge';

  return `${device} - ${browser}`;
}
