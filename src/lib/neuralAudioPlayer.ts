/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceConfig } from '../types';

let currentAudioElement: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function stopNeuralVoice(): void {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Synthesize and play voice with Neural HD engine or Web Audio DSP enhancement.
 */
export async function playNeuralVoice(
  text: string,
  voiceConfig: VoiceConfig,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopNeuralVoice();

  // Clean and prepare spoken text
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/\[AIS_METADATA[\s\S]*?\]/g, '') // remove metadata
    .replace(/[*#_~`]/g, '') // remove markdown symbols
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // 1. Attempt High-Definition Neural TTS via Backend
    const response = await fetch('/api/jarvis/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voicePreset: voiceConfig.profile || 'jarvis',
        stability: 0.80,
        pitch: voiceConfig.pitch || 0.50,
        rate: voiceConfig.rate || 0.92,
        lang: voiceConfig.lang || 'fr-FR',
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data && data.audioBase64 && typeof data.audioBase64 === 'string' && (data.audioBase64.startsWith('data:audio/') || data.audioBase64.startsWith('http'))) {
        try {
          // Play generated neural audio
          const audio = new Audio();
          audio.src = data.audioBase64;
          currentAudioElement = audio;

          // Connect Web Audio Analyser if supported
          try {
            const ctx = getAudioContext();
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyserNode = analyser;
            source.connect(analyser);
            analyser.connect(ctx.destination);
          } catch (e) {
            // Fallback direct audio output without analyser
          }

          audio.onplay = () => {
            if (onStart) onStart();
          };

          audio.onended = () => {
            currentAudioElement = null;
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            currentAudioElement = null;
            // Fallback to browser DSP
            playBrowserDspVoice(cleanText, voiceConfig, onStart, onEnd);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise.catch((playErr) => {
              console.warn('[NeuralVoice] Autoplay blocked or failed, falling back:', playErr);
              currentAudioElement = null;
              playBrowserDspVoice(cleanText, voiceConfig, onStart, onEnd);
            });
          }
          return;
        } catch (audioInitErr) {
          console.warn('[NeuralVoice] Audio init failed, using browser DSP:', audioInitErr);
        }
      }
    }
  } catch (err) {
    console.warn('[NeuralVoice] Backend TTS fetch error, switching to browser DSP:', err);
  }

  // 2. Fallback: Browser Web Speech with DSP Formant Optimization
  try {
    playBrowserDspVoice(cleanText, voiceConfig, onStart, onEnd);
  } catch (dspErr) {
    console.warn('[NeuralVoice] Browser DSP playback error:', dspErr);
    if (onEnd) onEnd();
  }
}

function playBrowserDspVoice(
  cleanText: string,
  voiceConfig: VoiceConfig,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utterance;

  // Determine language and voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = (voiceConfig.lang || 'fr-FR').substring(0, 2).toLowerCase();
  const availableVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));
  const pool = availableVoices.length > 0 ? availableVoices : voices;

  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (voiceConfig.voiceURI) {
    selectedVoice = pool.find(v => v.voiceURI === voiceConfig.voiceURI);
  }

  if (!selectedVoice) {
    if (voiceConfig.gender === 'feminine') {
      selectedVoice = pool.find(v => {
        const n = v.name.toLowerCase();
        return n.includes('amelie') || n.includes('audrey') || n.includes('hortense') || n.includes('zira') || n.includes('female');
      });
    } else {
      // Prioritize natural deep masculine voices (e.g. Thomas, Paul, Nicolas, Daniel)
      selectedVoice = pool.find(v => {
        const n = v.name.toLowerCase();
        return n.includes('thomas') || n.includes('paul') || n.includes('daniel') || n.includes('male') || n.includes('google');
      });
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Refined acoustics for J.A.R.V.I.S. presence
  utterance.rate = voiceConfig.rate || 0.90;
  utterance.pitch = voiceConfig.pitch || 0.50; // Deep resonant pitch
  utterance.lang = voiceConfig.lang || 'fr-FR';

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
