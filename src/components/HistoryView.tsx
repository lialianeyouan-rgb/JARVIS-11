/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History, Brain, MessageSquare, Trash2, RefreshCw, Sparkles, Database, CheckCircle } from 'lucide-react';
import { ChatMessage, MemoryItem } from '../types';

interface HistoryViewProps {
  chatMessages: ChatMessage[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  chatMessages,
  onClearHistory,
}) => {
  const [memoryFacts, setMemoryFacts] = useState<MemoryItem[]>([
    { id: 'mem_1', category: 'project', key: 'Nom du Projet', value: 'FinProtect (Intelligence Artificielle & Sécurité)', confidence: 0.99, updatedAt: 'Récemment' },
    { id: 'mem_2', category: 'preference', key: 'Protocole d\'adresse', value: 'Appeler l\'utilisateur "Maître"', confidence: 1.0, updatedAt: 'Système' },
    { id: 'mem_3', category: 'preference', key: 'Modèle Principal', value: 'Gemini (Architecture cascade sans fallback fictif)', confidence: 0.98, updatedAt: 'Récemment' },
    { id: 'mem_4', category: 'fact', key: 'Contrôle Mac', value: 'Daemon python jarvis_mac_bridge.py sur port 8765', confidence: 0.95, updatedAt: 'Récemment' },
  ]);

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>MÉMOIRE QUANTIQUE & HISTORIQUE DES ÉCHANGES</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Conservation multi-tours des faits, des préférences et du fil des conversations de la session.
          </p>
        </div>

        <button
          onClick={onClearHistory}
          className="px-3.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>PURGER LA SESSION</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Memory Facts (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>BANQUE DE CONNAISSANCES EXTRAITES</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {memoryFacts.length} faits actifs
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {memoryFacts.map((fact) => (
              <div key={fact.id} className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{fact.key}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                    {fact.category}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 font-sans mt-1">
                  {fact.value}
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                  <span>Confiance: {(fact.confidence * 100).toFixed(0)}%</span>
                  <span>{fact.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Message Stream (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>JOURNAL DE CONVERSATION DE SESSION ({chatMessages.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                  msg.role === 'user'
                    ? 'bg-zinc-900/80 border-amber-500/30 text-amber-200 ml-4'
                    : 'bg-amber-950/20 border-amber-500/40 text-zinc-200 mr-4'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className={msg.role === 'user' ? 'text-amber-400' : 'text-cyan-400'}>
                    {msg.role === 'user' ? '👤 VOUS' : '⚡ J.A.R.V.I.S.'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                </div>

                {msg.toolTriggered && (
                  <div className="mt-1 pt-1.5 border-t border-amber-500/10 text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Outil déclenché : {msg.toolTriggered.tool} ({msg.toolTriggered.status})</span>
                  </div>
                )}
              </div>
            ))}

            {chatMessages.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-xs">
                Aucun échange enregistré dans la session active.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
