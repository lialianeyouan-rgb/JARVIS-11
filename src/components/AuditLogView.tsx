/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ListOrdered, ShieldCheck, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: '1', timestamp: '2026-08-15 15:02:14', action: 'Tool execution: getLiveWeather', actor: 'J.A.R.V.I.S. Kernel', status: 'SUCCESS', details: 'Queried weather forecast for Global Grid.' },
    { id: '2', timestamp: '2026-08-15 14:55:30', action: 'Database query: executePostgresQuery', actor: 'PG Keling Kernel', status: 'SUCCESS', details: 'Executed SELECT * FROM system_logs.' },
    { id: '3', timestamp: '2026-08-15 14:40:12', action: 'Unauthorized file access attempt', actor: 'External IP 192.168.1.45', status: 'BLOCKED', details: 'Blocked by firewall security sandbox policy.' },
    { id: '4', timestamp: '2026-08-15 14:10:05', action: 'Web scraping: scrapeWebPage', actor: 'Cheerio Parser', status: 'SUCCESS', details: 'Extracted 1500 chars from target URL.' },
  ]);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-amber-400" />
            <span>AUDIT DES ACTIONS & TRAÇABILITÉ</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Journal immuable de toutes les actions, appels d'outils et tentatives d'accès système.</p>
        </div>
        
      </div>

      <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>JOURNAL DES ÉVÉNEMENTS & SÉCURITÉ</span>
        </h3>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-lg bg-zinc-900/90 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-amber-400 font-bold">{log.action}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400">{log.actor}</span>
                </div>
                <p className="text-xs text-zinc-300">{log.details}</p>
                <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
              </div>

              <div>
                {log.status === 'SUCCESS' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                  </span>
                )}
                {log.status === 'BLOCKED' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-950/40 border border-red-500/30 px-2.5 py-1 rounded">
                    <ShieldAlert className="w-3.5 h-3.5" /> BLOCKED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
