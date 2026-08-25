/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Play, Cpu, RefreshCw, StopCircle, HardDrive } from 'lucide-react';
import { SystemProcess } from '../types';

export const ComputerControlView: React.FC = () => {
  const [commandInput, setCommandInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['Type a command or select a quick script below.']);

  const [processes, setProcesses] = useState<SystemProcess[]>([]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || commandInput;
    if (!cmd.trim()) return;

    setTerminalLogs(prev => [...prev, `$ ${cmd}`, `Executing '${cmd}' via Rust subsystem...`]);
    if (!cmdToRun) setCommandInput('');

    try {
      const res = await fetch('/api/jarvis/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: 'TerminalExecutor', payload: { command: cmd } }),
      });
      const data = await res.json();
      setTerminalLogs(prev => [...prev, data.result?.output || 'Execution complete. Exit code 0.']);
    } catch (err) {
      setTerminalLogs(prev => [...prev, '[ERROR] Failed to communicate with system subprocess.']);
    }
  };

  const toggleProcess = (pid: number) => {
    setProcesses(prev => prev.map(p => {
      if (p.pid === pid) {
        return { ...p, status: p.status === 'running' ? 'suspended' : 'running' };
      }
      return p;
    }));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-amber-400" />
            <span>COMPUTER CONTROL & SYSTEM SUBSYSTEMS</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Direct system interaction, process control, and secure terminal execution.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
          <HardDrive className="w-4 h-4" />
          <span>RUST SECURITY SANDBOX</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Section */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>SECURE SHELL TERMINAL</span>
            </h3>
            <button
              onClick={() => setTerminalLogs(['Terminal buffer cleared.'])}
              className="text-[11px] text-zinc-500 hover:text-amber-300"
            >
              CLEAR
            </button>
          </div>

          <div className="flex-1 bg-black border border-amber-500/20 rounded-lg p-3 overflow-y-auto space-y-1.5 text-xs text-amber-200">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith('$') ? 'text-amber-400 font-bold' : log.includes('[ERROR]') ? 'text-red-400' : 'text-zinc-300'}>
                {log}
              </div>
            ))}
          </div>

          <div className="mt-3 flex space-x-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
              placeholder="Enter system command (e.g. status, diag, scan)..."
              className="flex-1 bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => handleRunCommand()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center space-x-1"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RUN</span>
            </button>
          </div>
        </div>

        {/* Process Manager Section */}
        lg:col-span-5 flex flex-col space-y-6
        <div className="lg:col-span-5 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>PROCESS MANAGER</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">4 ACTIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {processes.map((proc) => (
              <div key={proc.pid} className="p-3 rounded-lg bg-zinc-900/80 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-200">{proc.name}</span>
                    <span className="text-[10px] text-zinc-500">PID {proc.pid}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex space-x-3 mt-1">
                    <span>CPU: {proc.cpu}</span>
                    <span>MEM: {proc.memory}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    proc.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {proc.status}
                  </span>
                  <button
                    onClick={() => toggleProcess(proc.pid)}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-300"
                    title={proc.status === 'running' ? 'Suspend Process' : 'Resume Process'}
                  >
                    {proc.status === 'running' ? <StopCircle className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
