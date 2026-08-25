/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ListOrdered, Play, CheckCircle2, AlertCircle, Clock, Search, 
  Filter, Terminal, ArrowRight, ShieldAlert, FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import { ActivityEvent } from '../types';

export const ActivityLogsView: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'evt_1',
      timestamp: '2026-08-18T16:14:07.000Z',
      timeFormatted: '22:14:07',
      type: 'RESPONSE_GENERATED',
      level: 'success',
      title: 'Synthèse Vocale & Restitution au Maître',
      details: 'Génération du flux audio TTS avec profil J.A.R.V.I.S. (rate=0.9, pitch=0.5).',
      durationMs: 380,
    },
    {
      id: 'evt_2',
      timestamp: '2026-08-18T16:14:06.000Z',
      timeFormatted: '22:14:06',
      type: 'TOOL_RESULT',
      level: 'tool',
      toolName: 'listGoogleDriveFiles',
      title: 'TOOL_RESULT → SUCCESS (Google Drive)',
      details: 'Récupération de 12 fichiers Drive (Docs, Sheets, PDF). Payload vérifié.',
      payload: { count: 12, quota: '850 MB used', status: 'OK' },
      durationMs: 245,
    },
    {
      id: 'evt_3',
      timestamp: '2026-08-18T16:14:05.000Z',
      timeFormatted: '22:14:05',
      type: 'TOOL_CALL',
      level: 'tool',
      toolName: 'listGoogleDriveFiles',
      title: 'TOOL_CALL → GOOGLE_DRIVE',
      details: 'Appel API OAuth Google Drive pour lister les documents récents.',
      payload: { pageSize: 15, query: "mimeType != 'application/vnd.google-apps.folder'" },
      durationMs: 120,
    },
    {
      id: 'evt_4',
      timestamp: '2026-08-18T16:14:04.000Z',
      timeFormatted: '22:14:04',
      type: 'LLM_REASONING',
      level: 'info',
      title: 'LLM_REASONING (Gemini 2.5 Flash)',
      details: 'Analyse sémantique de la requête: intention = consultation fichiers. Déclenchement listGoogleDriveFiles sélectionné.',
      durationMs: 650,
    },
    {
      id: 'evt_5',
      timestamp: '2026-08-18T16:14:03.000Z',
      timeFormatted: '22:14:03',
      type: 'USER_REQUEST',
      level: 'info',
      title: 'USER_REQUEST (Directive Vocale)',
      details: '« J.A.R.V.I.S., liste mes documents récents sur Google Drive »',
      durationMs: 0,
    },
  ]);

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesFilter = filterType === 'ALL' || e.type === filterType || e.level === filterType;
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.toolName && e.toolName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getBadgeColor = (type: ActivityEvent['type'], level: ActivityEvent['level']) => {
    switch (type) {
      case 'USER_REQUEST':
        return 'bg-sky-950/50 text-sky-300 border-sky-500/30';
      case 'LLM_REASONING':
        return 'bg-purple-950/50 text-purple-300 border-purple-500/30';
      case 'TOOL_CALL':
        return 'bg-amber-950/50 text-amber-300 border-amber-500/30';
      case 'TOOL_RESULT':
        return 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30';
      case 'RESPONSE_GENERATED':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
      case 'SYSTEM_ALERT':
        return 'bg-red-950/50 text-red-300 border-red-500/30';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  
  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-amber-400" />
            <span>ACTIVITY & AGENTIC EXECUTION LOGS</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Traçabilité complète du pipeline agentique en temps réel : Requête → Raisonnement → Outil → Résultat → Synthèse.
          </p>
        </div>

        
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par outil, requête, payload ou mot-clé..."
            className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-lg pl-9 pr-4 py-2 text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'USER_REQUEST', 'LLM_REASONING', 'TOOL_CALL', 'TOOL_RESULT', 'RESPONSE_GENERATED'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold whitespace-nowrap transition-all border ${
                filterType === type
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-amber-500/30'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 text-xs text-zinc-400">
          <span>ÉVÉNEMENTS AGENTIQUES ({filteredEvents.length})</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            STREAMING EN DIRECT
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedId === evt.id;
            return (
              <div
                key={evt.id}
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-xs font-mono text-amber-400/80 mt-0.5 font-bold">
                      {evt.timeFormatted}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getBadgeColor(evt.type, evt.level)}`}>
                      {evt.type}
                    </span>

                    <div>
                      <h4 className="text-xs font-bold text-amber-200">{evt.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{evt.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-zinc-500 text-[10px]">
                    {evt.durationMs ? (
                      <span className="font-mono text-zinc-400">{evt.durationMs}ms</span>
                    ) : null}
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Expanded Payload Inspector */}
                {isExpanded && (
                  <div className="pt-2 border-t border-zinc-800 text-[11px] space-y-2">
                    <div className="p-2.5 rounded bg-black/80 border border-amber-500/20 font-mono text-zinc-300 overflow-x-auto">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold mb-1">Payload Structuré / Détails :</span>
                      <pre className="text-amber-300 text-[10px]">
                        {JSON.stringify(evt.payload || { details: evt.details, timestamp: evt.timestamp }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
