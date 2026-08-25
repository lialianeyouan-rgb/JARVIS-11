/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, Radio, CheckCircle2, Heart, Footprints, Flame, Timer, RefreshCw } from 'lucide-react';
import { getAccessToken, initAuth } from '../lib/firebaseAuth';
import { fetchGoogleFitSummary, GoogleFitDailySummary } from '../lib/googleServices';

export const MonitoringView: React.FC = () => {
  const [fitMetrics, setFitMetrics] = useState<GoogleFitDailySummary>({
    steps: 8420,
    caloriesExpended: 2150,
    distanceMeters: 6200,
    activeMinutes: 45,
    lastUpdated: new Date().toLocaleTimeString(),
  });
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean>(false);
  const [syncingFit, setSyncingFit] = useState<boolean>(false);

  const loadFitData = async () => {
    const token = await getAccessToken();
    if (!token) {
      setHasGoogleAuth(false);
      return;
    }
    setHasGoogleAuth(true);
    setSyncingFit(true);
    try {
      const metrics = await fetchGoogleFitSummary(token);
      setFitMetrics(metrics);
    } catch (err) {
      console.error('Error fetching Google Fit data:', err);
    } finally {
      setSyncingFit(false);
    }
  };

  useEffect(() => {
    loadFitData();
    const unsub = initAuth((user, token) => {
      if (token) {
        setHasGoogleAuth(true);
        loadFitData();
      } else {
        setHasGoogleAuth(false);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const metrics = [
    { label: 'API Response Latency (Avg)', value: '142 ms', status: 'Optimal' },
    { label: 'Gemini Token Consumption', value: '42,850 tokens', status: 'Normal' },
    { label: 'Distributed Trace Success', value: '99.98%', status: 'Stable' },
    { label: 'Active Quantum Nodes', value: '4 / 4 online', status: 'Synchronized' },
  ];

  const recentTraces = [
    { id: 'tr-901', endpoint: '/api/jarvis/chat', duration: '312ms', status: '200 OK', time: '14:24:10' },
    { id: 'tr-902', endpoint: '/api/jarvis/tools (listGoogleCalendarEvents)', duration: '184ms', status: '200 OK', time: '14:22:45' },
    { id: 'tr-903', endpoint: '/api/jarvis/tools (getGoogleFitDailySummary)', duration: '196ms', status: '200 OK', time: '14:20:00' },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-400" />
            <span>OBSERVABILITÉ, TÉLÉMÉTRIE & BIOMÉTRIE (GOOGLE FIT)</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Supervision système J.A.R.V.I.S., santé de l'hôte Stark et métriques d'activité en temps réel.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>TÉLÉMÉTRIE ACTIVE</span>
        </div>
      </div>

      {/* Google Fit & Biometrics Hub */}
      <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold text-amber-300">
              SANTÉ & BIOMÉTRIE DE L'UTILISATEUR (GOOGLE FIT CONNECTÉ)
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-zinc-400">
              Dernière synchro: <strong className="text-amber-300">{fitMetrics.lastUpdated}</strong>
            </span>
            <button
              onClick={loadFitData}
              disabled={syncingFit}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 rounded text-amber-300 text-xs flex items-center gap-1"
              title="Actualiser Google Fit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingFit ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900/80 border border-amber-500/20 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>PAS DU JOUR</span>
              <Footprints className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-100">
              {fitMetrics.steps.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400">Objectif 10,000 pas</div>
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/20 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>CALORIES BRÛLÉES</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-200">
              {fitMetrics.caloriesExpended.toLocaleString()} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className="text-[10px] text-zinc-400">Métabolisme actif</div>
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/20 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>MINUTES ACTIVES</span>
              <Timer className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-200">
              {fitMetrics.activeMinutes} <span className="text-xs font-normal">min</span>
            </div>
            <div className="text-[10px] text-cyan-400">Intensité modérée+</div>
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/20 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>DISTANCE PARCOURUE</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-200">
              {(fitMetrics.distanceMeters / 1000).toFixed(2)} <span className="text-xs font-normal">km</span>
            </div>
            <div className="text-[10px] text-emerald-400">GPS & podomètre</div>
          </div>
        </div>
      </div>

      {/* System Infrastructure Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-4 backdrop-blur-md space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase">{m.label}</span>
            <div className="text-xl font-bold text-amber-200">{m.value}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {m.status}
            </div>
          </div>
        ))}
      </div>

      {/* Distributed Traces */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>TRACES DE PIPELINE & APPELS D'OUTILS RÉCENTS</span>
        </h3>

        <div className="space-y-3">
          {recentTraces.map((trace) => (
            <div key={trace.id} className="p-3.5 rounded-lg bg-zinc-900/80 border border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-amber-400">{trace.id}</span>
                <span className="text-amber-200 font-mono">{trace.endpoint}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-zinc-400">Latence: <strong className="text-amber-300">{trace.duration}</strong></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{trace.status}</span>
                <span className="text-zinc-500">{trace.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
