/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Brain, Mic, Compass, Mail, Terminal, FileSpreadsheet, Database, Shield, Globe, 
  Cpu, Layers, Sparkles, ChevronRight, CheckCircle2, ArrowUpRight, X, ExternalLink, Activity, Eye
} from 'lucide-react';
import { NavigationTab } from '../types';

interface CapabilitiesViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

interface CapabilityDetail {
  id: string;
  title: string;
  category: string;
  status: 'ACTIVE' | 'CONNECTED' | 'OPÉRATIONNEL' | 'CONFIGURABLE';
  color: string;
  desc: string;
  apisUsed: string[];
  permissions: string[];
  actionTab?: NavigationTab;
  actionLabel: string;
}

export const CapabilitiesView: React.FC<CapabilitiesViewProps> = ({ onNavigate }) => {
  const capabilities: CapabilityDetail[] = [
    {
      id: 'web_intel',
      title: 'Web Intelligence & Recherche Live',
      category: 'Intelligence & Recherche',
      status: 'ACTIVE',
      color: 'amber',
      desc: 'Grounding temps réel, scraping de pages web, actualités mondiales et cours de bourse sans hallucinations.',
      apisUsed: ['Gemini Grounding API', 'Cheerio Web Scraper', 'OpenMeteo API', 'Yahoo Finance Endpoint'],
      permissions: ['Accès Réseau Externe', 'Lecture Publique Web'],
      actionTab: 'home',
      actionLabel: 'Poser une question à J.A.R.V.I.S.',
    },
    {
      id: 'google_workspace',
      title: 'Google Workspace (Drive, Docs, Sheets)',
      category: 'Bureautique Cloud',
      status: 'ACTIVE',
      color: 'cyan',
      desc: 'Parcours complet de votre Google Drive, création automatique de Google Docs et génération de feuilles Google Sheets.',
      apisUsed: ['Google Drive API v3', 'Google Docs API v1', 'Google Sheets API v4'],
      permissions: ['drive.file', 'documents', 'spreadsheets'],
      actionTab: 'files',
      actionLabel: 'Ouvrir Google Drive',
    },
    {
      id: 'database_access',
      title: 'Database & Mémoire Vectorielle',
      category: 'Base de Données & Mémoire',
      status: 'ACTIVE',
      color: 'amber',
      desc: 'Persistance structurée, requêtage relationnel PostgreSQL et mémoire vectorielle pgvector pour le contexte long terme.',
      apisUsed: ['PostgreSQL 16 Cloud Engine', 'pgvector Semantic Indexer'],
      permissions: ['Lecture/Écriture Tables Relationnelles', 'Génération d\'Embeddings'],
      actionTab: 'memory',
      actionLabel: 'Consulter la mémoire',
    },
    {
      id: 'voice_modulation',
      title: 'Modulation Vocale & Synthèse STT/TTS',
      category: 'Interface Audio',
      status: 'ACTIVE',
      color: 'purple',
      desc: 'Reconnaissance continue de la voix du Maître, 8 profils de timbre (J.A.R.V.I.S., Friday, Homer, etc.) et modulation de hauteur/vitesse.',
      apisUsed: ['Web Speech Recognition API', 'Web SpeechSynthesis Engine'],
      permissions: ['Accès Microphone', 'Restitution Audio Navigateur'],
      actionTab: 'voice_settings',
      actionLabel: 'Configurer les voix',
    },
    {
      id: 'computer_control',
      title: 'Contrôle Ordinateur & Daemon Mac Bridge',
      category: 'Contrôle Matériel',
      status: 'CONNECTED',
      color: 'emerald',
      desc: 'Lancement d\'applications locales macOS (VS Code, Chrome, Spotify, Terminal) et exécution de commandes sous liste blanche stricte.',
      apisUsed: ['Mac OS Bridge Daemon (Port 8765)', 'Native Process Spawn Sandbox'],
      permissions: ['Exécution Locale Whitelistée', 'Ouverture Applications Systèmes'],
      actionTab: 'computer',
      actionLabel: 'Contrôler le Mac',
    },
    {
      id: 'email_messaging',
      title: 'Gmail & Messagerie Réelle',
      category: 'Communications',
      status: 'ACTIVE',
      color: 'cyan',
      desc: 'Lecture des boîtes de réception, préparation assistée de brouillons et expédition certifiée sous confirmation explicite du Maître.',
      apisUsed: ['Gmail API v1 (OAuth 2.0)', 'SMTP Stark Gateway'],
      permissions: ['gmail.readonly', 'gmail.compose', 'gmail.send'],
      actionTab: 'communications',
      actionLabel: 'Ouvrir la messagerie',
    },
    {
      id: 'vision_ocr',
      title: 'Vision & Analyse Multimodale',
      category: 'Perception Visuelle',
      status: 'ACTIVE',
      color: 'amber',
      desc: 'Inspection de documents, OCR haute précision, analyse de captures d\'écran et reconnaissance d\'objets via le modèle multimodal.',
      apisUsed: ['Gemini 2.5 Flash Vision API', 'HTML5 Canvas Stream Capture'],
      permissions: ['Accès Caméra', 'Téléversement Fichiers Images'],
      actionTab: 'vision',
      actionLabel: 'Ouvrir le module Vision',
    },
    {
      id: 'autonomous_tasks',
      title: 'Planificateur Agentique & Multi-Étapes',
      category: 'Autonomie & Processus',
      status: 'ACTIVE',
      color: 'purple',
      desc: 'Décomposition d\'objectifs complexes en sous-tâches ordonnées avec suivi de la progression et requêtes d\'autorisation à chaque étape clé.',
      apisUsed: ['Agentic Task Scheduler', 'Tool Calling Loop Synthesizer'],
      permissions: ['Exécution Asynchrone', 'Coordination Multi-Outils'],
      actionTab: 'tasks',
      actionLabel: 'Voir les tâches',
    },
  ];

  const [selectedCap, setSelectedCap] = useState<CapabilityDetail | null>(null);

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>RÉPERTOIRE DES CAPACITÉS OPÉRATIONNELLES</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Cartographie exhaustive des modules, APIs connectées et permissions détenues par J.A.R.V.I.S.
          </p>
        </div>
      </div>

      {/* Grid of Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map((cap) => (
          <div
            key={cap.id}
            onClick={() => setSelectedCap(cap)}
            className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 hover:border-amber-500/60 backdrop-blur-md space-y-3 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-500/70 uppercase tracking-widest font-bold block">
                  {cap.category}
                </span>
                <h3 className="text-sm font-bold text-amber-200 group-hover:text-amber-300 flex items-center gap-1.5">
                  <span>{cap.title}</span>
                </h3>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                cap.status === 'ACTIVE' || cap.status === 'CONNECTED' || cap.status === 'OPÉRATIONNEL'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
              }`}>
                ● {cap.status}
              </span>
            </div>

            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              {cap.desc}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
              <span className="text-[10px] text-zinc-500 font-mono">
                {cap.apisUsed.length} APIs associées
              </span>
              <span className="text-amber-400 text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Inspecter les détails</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Modal Drawer */}
      {selectedCap && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-zinc-950 border border-amber-500/50 rounded-2xl p-6 space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.2)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-amber-500/30 pb-3">
              <div>
                <span className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider">
                  {selectedCap.category}
                </span>
                <h3 className="text-base font-bold text-amber-300 mt-0.5">{selectedCap.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCap(null)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-amber-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-400 font-bold block mb-1">Description & Périmètre :</span>
                <p className="text-zinc-200 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-amber-500/20">
                  {selectedCap.desc}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 font-bold block mb-1">APIs & Bibliothèques utilisées :</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCap.apisUsed.map((api, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                      {api}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 font-bold block mb-1">Permissions & Portées accordées :</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCap.permissions.map((perm, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px]">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-zinc-300">État du module en mémoire :</span>
                <span className="text-emerald-400 font-bold">● {selectedCap.status} (NOMINAL)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-amber-500/20">
              <button
                onClick={() => setSelectedCap(null)}
                className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-bold"
              >
                FERMER
              </button>
              {selectedCap.actionTab && (
                <button
                  onClick={() => {
                    const tab = selectedCap.actionTab!;
                    setSelectedCap(null);
                    onNavigate(tab);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>{selectedCap.actionLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
