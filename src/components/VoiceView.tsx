/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mic, Volume2, Radio, Sliders, Play, CheckCircle } from 'lucide-react';

export const VoiceView: React.FC = () => {
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(0.95);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [testText, setTestText] = useState('Greetings, Boss. All subroutines are fully calibrated and operational.');
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  const handleTestSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.onstart = () => setSpeechStatus('Speaking...');
    utterance.onend = () => setSpeechStatus('Idle');
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Mic className="w-6 h-6 text-amber-400" />
            <span>VOICE & AUDIO SUBSYSTEM (STT / TTS)</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Configure speech synthesis parameters, wake word triggers, and vocal modulation.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>REAL-TIME STREAMING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Configuration */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-5">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>VOCAL MODULATION PARAMETERS</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-400">Speech Rate:</span>
                <span className="text-amber-300">{voiceRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-900"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-400">Vocal Pitch (Timbre):</span>
                <span className="text-amber-300">{voicePitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-900"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
              <div>
                <span className="font-bold text-amber-200">Wake Word Activation</span>
                <p className="text-[11px] text-zinc-500">Always listen for "Jarvis" trigger phrase</p>
              </div>
              <button
                onClick={() => setWakeWordActive(!wakeWordActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  wakeWordActive 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}
              >
                {wakeWordActive ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* TTS Test Playground */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>SYNTHESIS TEST PLAYGROUND</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400">Test Phrase for J.A.R.V.I.S. Voice Engine</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-3 text-amber-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
            <div className="text-xs text-zinc-400 font-mono">
              Status: <span className="text-amber-400 font-bold">{speechStatus || 'Idle'}</span>
            </div>
            <button
              onClick={handleTestSpeech}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center space-x-2 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>SYNTHESIZE SPEECH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
