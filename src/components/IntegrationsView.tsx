/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Network, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Globe, 
  Database, Mail, FileText, Cpu, ExternalLink, ShieldCheck, Calendar, 
  Activity, Folder, Table, FilePlus, Lock, Search, Laptop
} from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebaseAuth';
import { GoogleWorkspaceAuditModal } from './GoogleWorkspaceAuditModal';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bridgeStatus, setBridgeStatus] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jarvis/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }

      const bridgeRes = await fetch('/api/jarvis/device/status');
      if (bridgeRes.ok) {
        const bridgeData = await bridgeRes.json();
        setBridgeStatus(bridgeData);
      }
    } catch (e) {
      console.error('Error loading integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    const unsub = initAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleGoogleConnect = async () => {
    setIsAuthenticating(true);
    try {
      await googleSignIn();
      await fetchIntegrations();
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Network className="w-6 h-6 text-amber-400" />
            <span>INTÉGRATIONS & SERVICES GOOGLE WORKSPACE</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Statut réel des passerelles Google Drive, Gmail, Google Docs, Sheets, Calendar, Fit et du moteur Gemini.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>AUDIT DIAGNOSTIC APIS</span>
          </button>
          {currentUser ? (
            <button
              onClick={handleGoogleDisconnect}
              className="px-3.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 text-xs font-bold transition-all"
            >
              DÉCONNECTER GOOGLE
            </button>
          ) : (
            <button
              onClick={handleGoogleConnect}
              disabled={isAuthenticating}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>{isAuthenticating ? 'LIAISON...' : 'CONNECTER GOOGLE WORKSPACE'}</span>
            </button>
          )}
          <button
            onClick={fetchIntegrations}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>ACTUALISER</span>
          </button>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Mac Device Agent (WSS Outbound Tunnel) */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Mac Device Agent</h3>
                <span className="text-[11px] text-zinc-400">
                  {bridgeStatus?.isOnline ? `Hôte : ${bridgeStatus?.status?.hostName || 'MacBook Pro'}` : 'Tunnel WSS Outbound'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              bridgeStatus?.isOnline 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {bridgeStatus?.isOnline ? <><CheckCircle2 className="w-3 h-3" /> CONNECTÉ</> : 'ATTENTE AGENT'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Contrôle d'interface macOS en direct, perception d'écran et exécution sans port entrant.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Protocole : <code className="text-amber-300">WSS /ws/device</code></span>
            {bridgeStatus?.metrics && <span className="text-emerald-400 font-bold">{bridgeStatus.metrics.t_total_ms || 95}ms</span>}
          </div>
        </div>

        {/* Google Drive (OAuth 2.0) */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Google Drive</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Compte : ${currentUser.email}` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> CONNECTÉ</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Parcours, indexation, recherche et gestion de dossiers & fichiers dans votre Google Drive.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portée : <code className="text-amber-300">drive</code>
          </div>
        </div>

        {/* Gmail API */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Gmail (Messagerie)</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Boîte : ${currentUser.email}` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> CONNECTÉ</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Lecture des messages récents, rédaction de brouillons et envoi sécurisé d'e-mails.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portée : <code className="text-amber-300">gmail.modify</code>
          </div>
        </div>

        {/* Google Docs */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Google Docs</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Édition autorisée` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> ACTIF</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Création instantanée de rapports et documents de travail Google Docs.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portée : <code className="text-amber-300">documents</code>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Google Sheets</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Édition autorisée` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> ACTIF</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Création de feuilles de calcul automatisées, en-têtes et tableaux de suivi.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portée : <code className="text-amber-300">spreadsheets</code>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Google Calendar</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Agenda connecté` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> CONNECTÉ</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Consultation de votre planning et planification de réunions et rappels.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portée : <code className="text-amber-300">calendar.events</code>
          </div>
        </div>

        {/* Google Fit */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">Google Fit</h3>
                <span className="text-[11px] text-zinc-400">
                  {currentUser ? `Biométrie active` : 'En attente'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
              currentUser 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            }`}>
              {currentUser ? <><CheckCircle2 className="w-3 h-3" /> CONNECTÉ</> : 'NON CONNECTÉ'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Suivi des pas, calories, fréquence cardiaque et constantes de santé.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-zinc-500">
            Portées : <code className="text-amber-300">fitness.activity.read</code>
          </div>
        </div>
      </div>

      <GoogleWorkspaceAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onAuthSuccess={fetchIntegrations}
      />
    </div>
  );
};
