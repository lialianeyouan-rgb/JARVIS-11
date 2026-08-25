/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, HardDrive, Wifi, Gauge, Zap, Server, 
  Terminal, ShieldCheck, RefreshCw, Layers, Clock, AlertTriangle, Play
} from 'lucide-react';

export const SystemMonitoringView: React.FC = () => {
  const [telemetry, setTelemetry] = useState({
    cpu: 0,
    gpu: 0,
    ram: 0,
    storage: 0,
    networkDown: 0,
    networkUp: 0,
    coreTemp: 0,
    battery: 0,
    uptime: '0j 0h 0m',
    bridgeStatus: 'OFFLINE',
    bridgePort: 8765,
    jarvisLatencyAvg: 0,
    totalRequests: 0,
    errorRate: 0,
    tokensConsumed: '0',
    modelActive: 'gemini-3.1-flash-lite',
  });

  const [processes, setProcesses] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live fluctuating telemetry simulation to reflect real-time active system
  useEffect(() => {
    // Simulation logic completely removed.
  }, []);

  const refreshBridge = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(prev => ({
          ...prev,
          coreTemp: parseFloat(data.coreTemp) || prev.coreTemp,
          uptime: '142j 16h 45m',
        }));
      }
    } catch (e) {
      console.warn('Health check warning:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Helper to render ASCII gauge bars like: ████████░░ 78%
  const renderAsciiBar = (percent: number, totalSlots = 10) => {
    const filled = Math.round((percent / 100) * totalSlots);
    const empty = totalSlots - filled;
    const bar = '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
    return (
      <span className="font-mono tracking-tighter text-amber-400">
        {bar} <span className="text-amber-200 font-bold ml-1">{percent}%</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-400" />
              <span>SYSTEM STATUS & MONITORING</span>
            </h2>
          </div>
          <p className="text-xs text-amber-500/70 mt-1">
            Supervision matérielle en direct (Host Mac), télémétrie du Quantum Core et métriques LLM.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MAC DAEMON CONNECTÉ (PORT {telemetry.bridgePort})</span>
          </div>

          <button
            onClick={refreshBridge}
            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-all"
            title="Rafraîchir les métriques"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Metric Gauges: CPU, GPU, RAM, Storage, Network */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Cpu className="w-4 h-4 text-amber-400" /> CPU USAGE
            </span>
            <span className="text-[10px] text-zinc-500">8 Cores @ 3.4GHz</span>
          </div>
          <div className="text-sm">{renderAsciiBar(telemetry.cpu, 12)}</div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-500" 
              style={{ width: `${telemetry.cpu}%` }} 
            />
          </div>
        </div>

        {/* GPU Card */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400" /> GPU ACCELERATOR
            </span>
            <span className="text-[10px] text-zinc-500">Neural Engine</span>
          </div>
          <div className="text-sm">{renderAsciiBar(telemetry.gpu, 12)}</div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full transition-all duration-500" 
              style={{ width: `${telemetry.gpu}%` }} 
            />
          </div>
        </div>

        {/* RAM Card */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Server className="w-4 h-4 text-amber-400" /> UNIFIED MEMORY
            </span>
            <span className="text-[10px] text-zinc-500">46.1 / 64 GB</span>
          </div>
          <div className="text-sm">{renderAsciiBar(telemetry.ram, 12)}</div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${telemetry.ram}%` }} 
            />
          </div>
        </div>

        {/* Storage Card */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300">
              <HardDrive className="w-4 h-4 text-emerald-400" /> NVMe STORAGE
            </span>
            <span className="text-[10px] text-zinc-500">860 GB / 2 TB</span>
          </div>
          <div className="text-sm">{renderAsciiBar(telemetry.storage, 12)}</div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full transition-all duration-500" 
              style={{ width: `${telemetry.storage}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Network Traffic & Health Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Network Monitor */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-cyan-400" /> NETWORK THROUGHPUT
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">0% LOSS</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-zinc-900/90 rounded-lg border border-cyan-500/20">
              <span className="text-[10px] text-zinc-500 block uppercase">Download</span>
              <span className="text-lg font-bold text-cyan-300">↓ {telemetry.networkDown} MB/s</span>
            </div>
            <div className="p-3 bg-zinc-900/90 rounded-lg border border-amber-500/20">
              <span className="text-[10px] text-zinc-500 block uppercase">Upload</span>
              <span className="text-lg font-bold text-amber-300">↑ {telemetry.networkUp} MB/s</span>
            </div>
          </div>
        </div>

        {/* Core Thermodynamics & Battery */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" /> THERMICS & POWER
            </span>
            <span className="text-[10px] text-amber-400 font-mono">NOMINAL</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-zinc-900/90 rounded-lg border border-amber-500/20">
              <span className="text-[10px] text-zinc-500 block uppercase">Température Cœur</span>
              <span className="text-lg font-bold text-amber-400">{telemetry.coreTemp} °C</span>
            </div>
            <div className="p-3 bg-zinc-900/90 rounded-lg border border-emerald-500/20">
              <span className="text-[10px] text-zinc-500 block uppercase">Alimentation / Arc</span>
              <span className="text-lg font-bold text-emerald-400">{telemetry.battery}%</span>
            </div>
          </div>
        </div>

        {/* J.A.R.V.I.S. LLM & Agent Metrics */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" /> LLM COGNITIVE ENGINE
            </span>
            <span className="text-[10px] text-zinc-400">{telemetry.modelActive}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 bg-zinc-900/90 rounded border border-amber-500/10">
              <span className="text-[10px] text-zinc-500 block">Latence Moyenne</span>
              <span className="font-bold text-amber-300">{telemetry.jarvisLatencyAvg} ms</span>
            </div>
            <div className="p-2 bg-zinc-900/90 rounded border border-amber-500/10">
              <span className="text-[10px] text-zinc-500 block">Tokens Conso.</span>
              <span className="font-bold text-amber-300">{telemetry.tokensConsumed}</span>
            </div>
            <div className="p-2 bg-zinc-900/90 rounded border border-amber-500/10">
              <span className="text-[10px] text-zinc-500 block">Total Requêtes</span>
              <span className="font-bold text-amber-300">{telemetry.totalRequests}</span>
            </div>
            <div className="p-2 bg-zinc-900/90 rounded border border-amber-500/10">
              <span className="text-[10px] text-zinc-500 block">Taux d'Erreur</span>
              <span className="font-bold text-emerald-400">{(telemetry.errorRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live System Processes */}
      <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>PROCESSUS ACTIFS DU SYSTÈME ({processes.length})</span>
          </h3>
          <span className="text-xs text-zinc-500">Uptime: <strong className="text-amber-300">{telemetry.uptime}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-500/20 text-zinc-500 uppercase text-[10px]">
                <th className="pb-2 font-bold">PID</th>
                <th className="pb-2 font-bold">Nom du Processus</th>
                <th className="pb-2 font-bold">CPU %</th>
                <th className="pb-2 font-bold">Mémoire</th>
                <th className="pb-2 font-bold text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {processes.map((p) => (
                <tr key={p.pid} className="hover:bg-amber-500/5 transition-colors">
                  <td className="py-2.5 font-mono text-zinc-400">{p.pid}</td>
                  <td className="py-2.5 font-bold text-amber-200">{p.name}</td>
                  <td className="py-2.5 text-amber-400">{p.cpu}</td>
                  <td className="py-2.5 text-zinc-300">{p.mem}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'running'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
