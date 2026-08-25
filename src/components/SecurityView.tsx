/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, History } from 'lucide-react';
import { SecurityPermission, AuditLog } from '../types';

interface SecurityViewProps {
  onKillSwitch: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onKillSwitch }) => {
  const [permissions, setPermissions] = useState<SecurityPermission[]>([
    { id: '1', toolName: 'TerminalExecutor', description: 'Run shell commands and system scripts', enabled: true, requiresConfirmation: true },
    { id: '2', toolName: 'FileExplorer', description: 'Read and write local system files and documents', enabled: true, requiresConfirmation: true },
    { id: '3', toolName: 'WebSearch', description: 'Query external intelligence networks and search engines', enabled: true, requiresConfirmation: false },
    { id: '4', toolName: 'DatabaseWriter', description: 'Modify persistent records in PostgreSQL memory bank', enabled: true, requiresConfirmation: false },
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    { id: '101', timestamp: '2026-08-13 14:10:22', action: 'TerminalExecutor: status', actor: 'JARVIS-AGENT', status: 'SUCCESS', details: 'Executed health check across 4 clusters.' },
    { id: '102', timestamp: '2026-08-13 13:55:04', action: 'FileExplorer: /etc/config', actor: 'JARVIS-AGENT', status: 'BLOCKED', details: 'Blocked by sandbox policy (insufficient privilege).' },
    { id: '103', timestamp: '2026-08-13 13:20:11', action: 'WebSearch: Stark Industries', actor: 'COMMANDER', status: 'SUCCESS', details: 'Retrieved secure intelligence briefing.' },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>SECURITY, SANDBOX & PERMISSIONS</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Granular tool permissions, confirmation policies, and immutable audit trails.</p>
        </div>
        <button
          onClick={onKillSwitch}
          className="px-4 py-2 bg-red-950/60 border border-red-500 text-red-400 rounded-lg hover:bg-red-900 font-bold text-xs flex items-center space-x-2"
        >
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span>EMERGENCY KILL SWITCH</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Permissions Table */}
        <div className="lg:col-span-6 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>GRANULAR TOOL PERMISSIONS</span>
          </h3>

          <div className="space-y-3">
            {permissions.map((perm) => (
              <div key={perm.id} className="p-3.5 rounded-lg bg-zinc-900/80 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-200">{perm.toolName}</span>
                    {perm.requiresConfirmation && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">CONFIRM REQUIRED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{perm.description}</p>
                </div>
                <button
                  onClick={() => togglePermission(perm.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    perm.enabled 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-red-950/40 border-red-500/50 text-red-400'
                  }`}
                >
                  {perm.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-6 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <History className="w-4 h-4 text-cyan-400" />
            <span>IMMUTABLE AUDIT LOGS</span>
          </h3>

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-lg bg-zinc-900/80 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-200">{log.action}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-950/40 text-red-400'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{log.details}</p>
                <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Actor: {log.actor}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
