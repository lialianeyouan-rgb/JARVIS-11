/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Mic, Volume2, Sliders, Play, Sparkles, Check, AudioWaveform, 
  User, Globe, Shield, Zap, Radio, Cpu, HeartHandshake, Compass,
  Layers, Waves, Activity
} from 'lucide-react';
import { VoiceConfig, VoicePreset } from '../types';
import { playNeuralVoice, stopNeuralVoice } from '../lib/neuralAudioPlayer';

interface VoiceSettingsViewProps {
  voiceConfig: VoiceConfig;
  onUpdateConfig: (config: Partial<VoiceConfig>) => void;
  onClose?: () => void;
  autoListen?: boolean;
  onToggleAutoListen?: (val: boolean) => void;
  showTranscript?: boolean;
  onToggleShowTranscript?: (val: boolean) => void;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S. Classique',
    subtitle: 'Paul Bettany Style',
    description: 'Timbre masculin noble, grave, posé et solennel.',
    gender: 'masculine',
    characteristic: 'grave',
    rate: 0.90,
    pitch: 0.75,
    icon: 'Radio',
  },
  {
    id: 'friday',
    name: 'F.R.I.D.A.Y.',
    subtitle: 'Élégante & Synthétique',
    description: 'Voix féminine douce, fluide, chaleureuse et claire.',
    gender: 'feminine',
    characteristic: 'calme',
    rate: 1.02,
    pitch: 1.10,
    icon: 'Sparkles',
  },
  {
    id: 'homer',
    name: 'H.O.M.E.R.',
    subtitle: 'Militaire & Tactique',
    description: 'Voix masculine très basse, autoritaire et résonante.',
    gender: 'masculine',
    characteristic: 'tactique',
    rate: 0.85,
    pitch: 0.38,
    icon: 'Shield',
  },
  {
    id: 'karen',
    name: 'K.A.R.E.N.',
    subtitle: 'Amicale & Proactive',
    description: 'Intonation naturelle, bienveillante et enjouée.',
    gender: 'feminine',
    characteristic: 'dynamique',
    rate: 1.05,
    pitch: 1.18,
    icon: 'HeartHandshake',
  },
  {
    id: 'edith',
    name: 'E.D.I.T.H.',
    subtitle: 'Cyber & Précision Chirurgicale',
    description: 'Diction vive, concise et analytique.',
    gender: 'feminine',
    characteristic: 'dynamique',
    rate: 1.12,
    pitch: 0.95,
    icon: 'Zap',
  },
  {
    id: 'vision',
    name: 'V.I.S.I.O.N.',
    subtitle: 'Philosophique & Profond',
    description: 'Rythme ralenti, timbre profond et contemplatif.',
    gender: 'masculine',
    characteristic: 'philosophique',
    rate: 0.80,
    pitch: 0.62,
    icon: 'Compass',
  },
  {
    id: 'neo',
    name: 'N.E.O.',
    subtitle: 'Dynamique & Moderne',
    description: 'Ton énergique, direct et réactif.',
    gender: 'masculine',
    characteristic: 'dynamique',
    rate: 1.10,
    pitch: 0.85,
    icon: 'Zap',
  },
  {
    id: 'robot',
    name: 'Q.U.A.N.T.U.M. Robot',
    subtitle: 'Synthétique & Métallique',
    description: 'Résonance bionique robotique avec modulation basse.',
    gender: 'masculine',
    characteristic: 'robotique',
    rate: 0.95,
    pitch: 0.45,
    icon: 'Cpu',
  },
];

export const VoiceSettingsView: React.FC<VoiceSettingsViewProps> = ({
  voiceConfig,
  onUpdateConfig,
  onClose,
  autoListen = true,
  onToggleAutoListen,
  showTranscript = false,
  onToggleShowTranscript,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(voiceConfig.voiceURI || '');
  const [currentProfile, setCurrentProfile] = useState<string>(voiceConfig.profile || 'jarvis');
  const [rate, setRate] = useState<number>(voiceConfig.rate || 0.90);
  const [pitch, setPitch] = useState<number>(voiceConfig.pitch || 0.50);
  const [gender, setGender] = useState<'masculine' | 'feminine' | 'auto'>(voiceConfig.gender || 'masculine');
  const [characteristic, setCharacteristic] = useState<any>(voiceConfig.characteristic || 'grave');
  const [lang, setLang] = useState<string>(voiceConfig.lang || 'fr-FR');
  const [testPhrase, setTestPhrase] = useState<string>(
    "Bonjour Maître. Tous les systèmes vocaux et les sous-routines quantiques sont parfaitement synchronisés."
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Noyau audio prêt');

  // Load browser speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        if (!selectedVoiceURI && voices.length > 0) {
          const frVoice = voices.find(v => v.lang.startsWith('fr') || v.lang.includes('FR'));
          if (frVoice) {
            setSelectedVoiceURI(frVoice.voiceURI);
          } else {
            setSelectedVoiceURI(voices[0].voiceURI);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  // Sync incoming props
  useEffect(() => {
    if (voiceConfig.profile) setCurrentProfile(voiceConfig.profile);
    if (voiceConfig.rate) setRate(voiceConfig.rate);
    if (voiceConfig.pitch) setPitch(voiceConfig.pitch);
    if (voiceConfig.gender) setGender(voiceConfig.gender);
    if (voiceConfig.characteristic) setCharacteristic(voiceConfig.characteristic);
    if (voiceConfig.voiceURI) setSelectedVoiceURI(voiceConfig.voiceURI);
  }, [voiceConfig]);

  const handleSelectPreset = (preset: VoicePreset) => {
    setCurrentProfile(preset.id);
    setGender(preset.gender);
    setCharacteristic(preset.characteristic);
    setPitch(preset.pitch);
    setRate(preset.rate);

    // Pick best matching voice from available list
    const matchedVoice = availableVoices.find(v => {
      const name = v.name.toLowerCase();
      if (!v.lang.startsWith(lang.substring(0, 2))) return false;
      if (preset.gender === 'masculine') {
        return name.includes('male') || name.includes('paul') || name.includes('thomas') || name.includes('guy') || name.includes('nicolas') || name.includes('daniel');
      }
      return name.includes('female') || name.includes('amelie') || name.includes('julie') || name.includes('marie') || name.includes('celine') || name.includes('samantha');
    });

    if (matchedVoice) {
      setSelectedVoiceURI(matchedVoice.voiceURI);
    }

    const updatedCfg: Partial<VoiceConfig> = {
      profile: preset.id as any,
      gender: preset.gender,
      characteristic: preset.characteristic as any,
      pitch: preset.pitch,
      rate: preset.rate,
      voiceURI: matchedVoice ? matchedVoice.voiceURI : selectedVoiceURI,
      lang,
    };

    onUpdateConfig(updatedCfg);
    setStatusMessage(`Profil appliqué : ${preset.name}`);

    // Trigger test speech sample with new settings
    previewCustomSpeech(preset.pitch, preset.rate, matchedVoice ? matchedVoice.voiceURI : selectedVoiceURI);
  };

  const handleAutoCalibrate = () => {
    const defaultJarvis = VOICE_PRESETS[0];
    handleSelectPreset(defaultJarvis);
  };

  const previewCustomSpeech = (customPitch?: number, customRate?: number, customVoiceUri?: string) => {
    stopNeuralVoice();
    setIsSpeaking(true);
    setStatusMessage('Génération neuronale HD en cours...');

    const activeConfig: VoiceConfig = {
      profile: currentProfile as any,
      gender,
      characteristic,
      rate: customRate ?? rate,
      pitch: customPitch ?? pitch,
      voiceURI: customVoiceUri || selectedVoiceURI,
      lang,
    };

    playNeuralVoice(
      testPhrase,
      activeConfig,
      () => {
        setIsSpeaking(true);
        setStatusMessage('Émission vocale neuronale HD active');
      },
      () => {
        setIsSpeaking(false);
        setStatusMessage('Synthèse terminée avec succès');
      }
    );
  };

  const handleSaveAndSync = () => {
    onUpdateConfig({
      profile: currentProfile as any,
      gender,
      characteristic,
      rate,
      pitch,
      voiceURI: selectedVoiceURI,
      lang,
    });
    setStatusMessage('Paramètres vocaux synchronisés avec le Quantum Core');
    previewCustomSpeech();
  };

  const filteredVoices = availableVoices.filter(v => lang ? v.lang.startsWith(lang.substring(0, 2)) : true);

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Mic className="w-6 h-6 text-amber-400" />
            <span>GESTION & TYPES DE VOIX DE J.A.R.V.I.S.</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Sélectionnez un profil préconfiguré ou personnalisez le timbre, la hauteur (pitch) et le rythme.
          </p>
        </div>
        <button
          onClick={handleAutoCalibrate}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>CALIBRATION J.A.R.V.I.S. CLASSIQUE</span>
        </button>
      </div>

      {/* Top Banner with Active ElevenLabs Neural Engine */}
      <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900/90 to-amber-950/70 border border-amber-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-200 tracking-wider">MOTEUR NEURONAL :</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ELEVENLABS MULTILINGUAL V2 CONNECTÉ & ACTIF
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Rendu vocal haute fidélité avec grain naturel, micro-respirations et intonations humaines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-400/80 bg-zinc-900/90 border border-amber-500/30 px-2.5 py-1 rounded">
            Modèle: eleven_multilingual_v2
          </span>
        </div>
      </div>

      {/* Hands-Free Continuous Conversation Loop Configuration */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-900/90 to-emerald-950/50 border border-emerald-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-200 tracking-wider">CONVERSATION CONTINUE & MAINS-LIBRES :</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1 ${
                autoListen 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}>
                {autoListen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                {autoListen ? 'BOUCLE AUTOMATIQUE ACTIVE' : 'MODE MANUEL'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Dès que J.A.R.V.I.S. termine de parler, le microphone s'active automatiquement pour recueillir votre réponse sans avoir à cliquer.
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleAutoListen && onToggleAutoListen(!autoListen)}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all border shrink-0 flex items-center gap-1.5 ${
            autoListen
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-amber-300'
          }`}
        >
          {autoListen ? 'DÉSACTIVER LE MODE CONTINU' : 'ACTIVER LE MODE MAINS-LIBRES'}
        </button>
      </div>

      {/* On-Screen Speech Transcription / Subtitles Display Control */}
      <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900/90 to-sky-950/40 border border-sky-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-200 tracking-wider">TRANSCRIPTION & SOUS-TITRES À L'ÉCRAN :</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1 ${
                showTranscript 
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}>
                {showTranscript ? 'AFFICHAGE VISIBLE' : 'MASQUÉ (HUD ÉPURÉ)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Contrôle l'affichage en direct de la transcription de vos paroles et des sous-titres de réponse sur l'écran principal.
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleShowTranscript && onToggleShowTranscript(!showTranscript)}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all border shrink-0 flex items-center gap-1.5 ${
            showTranscript
              ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-amber-300'
          }`}
        >
          {showTranscript ? 'MASQUER LA TRANSCRIPTION' : 'AFFICHER LA TRANSCRIPTION'}
        </button>
      </div>

      {/* Preset Profiles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>8 PROFILS VOCAUX PRÉCONFIGURÉS</span>
          </h3>
          <span className="text-[11px] text-zinc-500">Cliquez sur un profil pour l'écouter instantanément</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VOICE_PRESETS.map((preset) => {
            const isSelected = currentProfile === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-zinc-950/80 border-amber-500/20 text-zinc-400 hover:border-amber-500/50 hover:bg-zinc-900/90 hover:text-amber-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                      {preset.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-amber-500/30 text-amber-400 uppercase">
                      {preset.gender === 'masculine' ? 'Masc' : 'Fém'}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-500/80 font-mono mt-0.5">{preset.subtitle}</div>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 border-t border-amber-500/10">
                  <span>Pitch: {preset.pitch.toFixed(2)}</span>
                  <span>Vitesse: {preset.rate.toFixed(2)}x</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine Modulation and Realtime Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Fine Modulation Sliders */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>MODULATION MANUELLE AVANCÉE</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Language Selection */}
            <div>
              <label className="text-zinc-400 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Langue du système vocal :</span>
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="fr-FR">Français (France - fr-FR)</option>
                <option value="en-US">English (United States - en-US)</option>
                <option value="en-GB">English (United Kingdom - en-GB)</option>
                <option value="es-ES">Español (España - es-ES)</option>
                <option value="de-DE">Deutsch (Deutschland - de-DE)</option>
              </select>
            </div>

            {/* Voice selection */}
            <div>
              <label className="text-zinc-400 mb-1 block">Voix système détectée ({filteredVoices.length} disponibles) :</label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                {filteredVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang}) {voice.default ? '★ Défaut' : ''}
                  </option>
                ))}
                {filteredVoices.length === 0 && (
                  <option value="">Voix système par défaut du navigateur</option>
                )}
              </select>
            </div>

            {/* Pitch slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-400">Hauteur / Timbre (Pitch) :</span>
                <span className="text-amber-300 font-bold">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.35"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>Grave / Profond (0.35)</span>
                <span>Neutre (1.00)</span>
                <span>Aigu / Clair (1.50)</span>
              </div>
            </div>

            {/* Speed slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-400">Vitesse de diction (Rate) :</span>
                <span className="text-amber-300 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>Posé (0.6x)</span>
                <span>Standard (1.0x)</span>
                <span>Rapide (1.5x)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Voice Control */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <AudioWaveform className="w-4 h-4 text-amber-400" />
              <span>TEST & ÉCOUTE IMMÉDIATE</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400">Phrase d'échantillonnage pour J.A.R.V.I.S. :</label>
              <textarea
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900/90 border border-amber-500/30 rounded-lg p-3 text-amber-100 focus:outline-none focus:border-amber-400 resize-none text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/50 border border-amber-500/20 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Commandes vocales orales reconnues :</span>
              </div>
              <p className="leading-relaxed">
                Vous pouvez dire à tout moment : <span className="text-amber-200 italic">« Mets la voix Friday »</span>, <span className="text-amber-200 italic">« Passe en voix Homer »</span>, <span className="text-amber-200 italic">« Voix masculine très grave »</span> ou <span className="text-amber-200 italic">« Change ta voix »</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-amber-500/20">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Statut du synthétiseur :</span>
              <span className={`font-bold ${isSpeaking ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                {statusMessage}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => previewCustomSpeech()}
                disabled={isSpeaking}
                className="flex-1 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-amber-400" />
                <span>TESTER L'ÉCHANTILLON</span>
              </button>

              <button
                onClick={handleSaveAndSync}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>APPLIQUER LA VOIX</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
