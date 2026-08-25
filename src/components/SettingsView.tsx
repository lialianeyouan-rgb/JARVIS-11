/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Volume2, Shield, Sparkles, Sliders, Check, 
  Cpu, Terminal, Layers, Play, Key, RefreshCw
} from 'lucide-react';
import { NavigationTab, VoiceConfig } from '../types';
import { VOICE_PRESETS } from './VoiceSettingsView';

interface SettingsViewProps {
  onNavigate: (tab: NavigationTab) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: (val: boolean) => void;
  autoListen?: boolean;
  onToggleAutoListen?: (val: boolean) => void;
  showTranscript?: boolean;
  onToggleShowTranscript?: (val: boolean) => void;
  voiceConfig?: VoiceConfig;
  onUpdateVoiceConfig?: (cfg: Partial<VoiceConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  autoSpeak,
  onToggleAutoSpeak,
  autoListen = true,
  onToggleAutoListen,
  showTranscript = false,
  onToggleShowTranscript,
  voiceConfig,
  onUpdateVoiceConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'voice' | 'ai' | 'security' | 'appearance'>('general');
  const [honorific, setHonorific] = useState<string>('Maître');
  const [assistantName, setAssistantName] = useState<string>('J.A.R.V.I.S.');
  const [language, setLanguage] = useState<string>('fr-FR');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxContextMessages, setMaxContextMessages] = useState<number>(20);
  const [daemonUrl, setDaemonUrl] = useState<string>('http://127.0.0.1:8765');
  const [securityToken, setSecurityToken] = useState<string>('jarvis-secure-mac-token-2026');
  const [requireEmailConfirm, setRequireEmailConfirm] = useState<boolean>(true);
  const [requireFileDeleteConfirm, setRequireFileDeleteConfirm] = useState<boolean>(true);
  const [particleDensity, setParticleDensity] = useState<'LOW' | 'MEDIUM' | 'ULTRA'>('ULTRA');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const testSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = voiceConfig?.rate ?? 0.90;
      utt.pitch = voiceConfig?.pitch ?? 0.50;
      utt.lang = voiceConfig?.lang ?? 'fr-FR';
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>GLOBAL SYSTEM SETTINGS & CONFIGURATION</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Personnalisation complète : Général, Modulation Vocale, Intelligence Artificielle, Sécurité et Apparence.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Check className="w-4 h-4" />
          <span>ENREGISTRER LES MODIFICATIONS</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Configuration sauvegardée avec succès et appliquée au Quantum Core.</span>
        </div>
      )}

      {/* Categorized Tabs Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        {[
          { id: 'general', label: '1. GÉNÉRAL', icon: Sparkles },
          { id: 'voice', label: '2. VOIX & AUDIO', icon: Volume2 },
          { id: 'ai', label: '3. MODÈLE IA & REASONING', icon: Cpu },
          { id: 'security', label: '4. SÉCURITÉ & MAC BRIDGE', icon: Shield },
          { id: 'appearance', label: '5. APPARENCE & ORBE', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-amber-500/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General */}
      {activeSubTab === 'general' && (
        <div className="p-6 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3">
            Paramètres Généraux & Protocole d'Adresse
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-zinc-400 mb-1 block">Nom du Système :</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Titre honorifique par défaut :</label>
              <input
                type="text"
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Exemple: "Maître", "Monsieur Stark", "Boss"</span>
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Langue principale du Système :</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="fr-FR">Français (France) - fr-FR</option>
                <option value="en-US">English (United States) - en-US</option>
                <option value="en-GB">English (British) - en-GB</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Voice */}
      {activeSubTab === 'voice' && (
        <div className="p-6 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h3 className="text-sm font-bold text-amber-300">Modulation Vocale & Profils de Synthèse</h3>
            <button
              onClick={() => onNavigate('voice_settings')}
              className="text-xs text-amber-400 hover:underline"
            >
              Ouvrir le modulateur complet →
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-amber-500/20">
              <div>
                <span className="font-bold text-amber-200 block">Restitution vocale automatique (TTS)</span>
                <span className="text-[11px] text-zinc-400">J.A.R.V.I.S. énonce vocalement chacune de ses réponses</span>
              </div>
              <button
                onClick={() => onToggleAutoSpeak(!autoSpeak)}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                  autoSpeak
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}
              >
                {autoSpeak ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-200 block">Mode Conversation Continue (Mains-libres / Auto-Listen)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">Par Défaut</span>
                </div>
                <span className="text-[11px] text-zinc-300">
                  Réouvre automatiquement le micro dès que J.A.R.V.I.S. a fini de parler, sans avoir à cliquer.
                </span>
              </div>
              <button
                onClick={() => onToggleAutoListen && onToggleAutoListen(!autoListen)}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                  autoListen
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}
              >
                {autoListen ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-sky-950/30 border border-sky-500/30">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sky-200 block">Affichage de la transcription à l'écran (Sous-titres en direct)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold uppercase">Optionnel</span>
                </div>
                <span className="text-[11px] text-zinc-300">
                  Affiche ou masque les sous-titres écrits de votre voix et des réponses sur l'écran d'accueil.
                </span>
              </div>
              <button
                onClick={() => onToggleShowTranscript && onToggleShowTranscript(!showTranscript)}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                  showTranscript
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}
              >
                {showTranscript ? 'ACTIVÉ' : 'MASQUÉ'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VOICE_PRESETS.slice(0, 4).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    if (onUpdateVoiceConfig) {
                      onUpdateVoiceConfig({
                        profile: preset.id as any,
                        gender: preset.gender,
                        rate: preset.rate,
                        pitch: preset.pitch,
                      });
                    }
                    testSpeech(`Profil vocal ${preset.name} activé, Maître.`);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    voiceConfig?.profile === preset.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-amber-500/30'
                  }`}
                >
                  <span className="font-bold block text-xs">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500 block">{preset.characteristic}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => testSpeech("Test de modulation vocale J.A.R.V.I.S. terminé avec succès, Maître.")}
                className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tester la voix actuelle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI & Models */}
      {activeSubTab === 'ai' && (
        <div className="p-6 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3">
            Moteur d'Inférence & Modèles Gemini
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-zinc-400 mb-1 block">Modèle LLM Actif :</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Haut Quota Quotidien & Faible Latence)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest (Équilibré & Multi-Outils)</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Raisonnement Complexe & Code)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Température : {temperature}</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>Précis (0.1)</span>
                <span>Équilibré (0.7)</span>
                <span>Créatif (1.0)</span>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Taille du Contexte Mnésique (Messages) :</label>
              <input
                type="number"
                value={maxContextMessages}
                onChange={(e) => setMaxContextMessages(parseInt(e.target.value) || 20)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Bridge */}
      {activeSubTab === 'security' && (
        <div className="p-6 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3">
            Sécurité, Garde-fous & Daemon Mac Bridge
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 mb-1 block">URL du Daemon Mac Bridge :</label>
                <input
                  type="text"
                  value={daemonUrl}
                  onChange={(e) => setDaemonUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-400 mb-1 block">Jeton d'Authentification Sécurisé :</label>
                <input
                  type="password"
                  value={securityToken}
                  onChange={(e) => setSecurityToken(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-200">Confirmation obligatoire avant tout envoi réel d'e-mail</span>
                <input
                  type="checkbox"
                  checked={requireEmailConfirm}
                  onChange={(e) => setRequireEmailConfirm(e.target.checked)}
                  className="w-4 h-4 accent-amber-400"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-200">Confirmation obligatoire avant suppression de fichier Drive/Local</span>
                <input
                  type="checkbox"
                  checked={requireFileDeleteConfirm}
                  onChange={(e) => setRequireFileDeleteConfirm(e.target.checked)}
                  className="w-4 h-4 accent-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Appearance */}
      {activeSubTab === 'appearance' && (
        <div className="p-6 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3">
            Apparence, Particules & Rendu de l'Orbe 3D
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-zinc-400 mb-1 block">Densité des Particules Quantiques :</label>
              <select
                value={particleDensity}
                onChange={(e) => setParticleDensity(e.target.value as any)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="LOW">Basse (Économie GPU)</option>
                <option value="MEDIUM">Moyenne (Fluide)</option>
                <option value="ULTRA">Ultra / Cinématique (Recommandé)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
