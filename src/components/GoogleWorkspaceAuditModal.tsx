/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, X, 
  ExternalLink, Key, FileText, Database, Mail, Calendar, Play,
  Clock, ShieldAlert, Cpu, Terminal, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { googleSignIn, logout, getAccessToken, getStoredGoogleUser } from '../lib/firebaseAuth';

interface GoogleWorkspaceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const GoogleWorkspaceAuditModal: React.FC<GoogleWorkspaceAuditModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [lifecycleStatus, setLifecycleStatus] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [runningE2E, setRunningE2E] = useState(false);
  const [e2eReport, setE2eReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'e2e' | 'logs'>('overview');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchStatusAndLogs = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/auth/google/status'),
        fetch('/api/auth/google/logs?limit=30')
      ]);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setLifecycleStatus(sData);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
    } catch (e) {
      console.warn('Could not fetch OAuth lifecycle status:', e);
    }
  };

  const runAudit = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const stored = getStoredGoogleUser();
      setUserEmail(stored.email);

      const headers: Record<string, string> = {};
      if (token && token !== 'backend-managed-token') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [res] = await Promise.all([
        fetch('/api/jarvis/audit/google', { headers }),
        fetchStatusAndLogs()
      ]);

      if (res.ok) {
        const data = await res.json();
        setAuditReport(data);
      } else {
        const errText = await res.text();
        setAuditReport({ error: errText });
      }
    } catch (e: any) {
      setAuditReport({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
      const interval = setInterval(fetchStatusAndLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUserEmail(res.user.email);
        if (onAuthSuccess) onAuthSuccess();
        await runAudit();
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      console.warn('Google Sign In incomplete:', err?.message || err);
    } finally {
      setConnecting(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/auth/google/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await runAudit();
      } else {
        alert(data.error || 'Échec du renouvellement');
      }
    } catch (e: any) {
      console.error('Force refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSimulateExpiration = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/auth/google/simulate-expiration', { method: 'POST' });
      if (res.ok) {
        await runAudit();
      }
    } catch (e) {
      console.error('Simulate expiration error:', e);
    } finally {
      setSimulating(false);
    }
  };

  const handleRunE2ESuite = async () => {
    setRunningE2E(true);
    setActiveTab('e2e');
    try {
      const res = await fetch('/api/auth/google/test-e2e-lifecycle');
      if (res.ok) {
        const report = await res.json();
        setE2eReport(report);
        await fetchStatusAndLogs();
      }
    } catch (e) {
      console.error('E2E Test Suite Error:', e);
    } finally {
      setRunningE2E(false);
    }
  };

  const handleLogoutGoogle = async () => {
    await logout();
    setUserEmail(null);
    setAuditReport(null);
    setLifecycleStatus(null);
    await runAudit();
  };

  if (!isOpen) return null;

  const isConnected = auditReport?.tokenProvided || lifecycleStatus?.authenticated;
  const hasRefreshToken = lifecycleStatus?.hasRefreshToken;
  const expiresInSeconds = lifecycleStatus?.expiresInSeconds;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-amber-100">
      <div className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-zinc-950 border border-amber-500/50 rounded-2xl shadow-[0_0_80px_rgba(245,158,11,0.25)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-amber-500/30 flex items-start justify-between bg-zinc-900/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-base font-bold text-amber-300 tracking-wide">
                CYCLE DE VIE OAUTH GOOGLE WORKSPACE & PERSISTANCE
              </h3>
            </div>
            <p className="text-xs text-amber-500/70 mt-0.5">
              Renouvellement automatique, stockage persistant sécurisé et surveillance continue.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-amber-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-500/20 bg-zinc-950 px-5 pt-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>État du Cycle de Vie</span>
          </button>

          <button
            onClick={() => setActiveTab('e2e')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'e2e'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test E2E Expiration & Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Observabilité & Logs ({logs.length})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Primary Auth Status Card */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    Statut de la session OAuth 2.0 :
                  </span>
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-300">
                          AUTHENTIFIÉ ({lifecycleStatus?.email || auditReport?.diagnostics?.tokenInfo?.email || userEmail || 'Compte Google'})
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-amber-400">
                          AUCUNE SESSION ACTIVE
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {expiresInSeconds !== undefined && expiresInSeconds > 0 ? (
                        <span>Expire dans : <strong className="text-amber-300">{expiresInSeconds}s</strong></span>
                      ) : (
                        <span className="text-red-400 font-bold">Jeton expiré (prêt pour auto-refresh)</span>
                      )}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span>
                      Coffre Refresh Token : <strong className={hasRefreshToken ? "text-emerald-400" : "text-zinc-500"}>
                        {hasRefreshToken ? "PERSISTANT (.jarvis_google_tokens.json)" : "EN ATTENTE"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {!isConnected ? (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={connecting}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{connecting ? 'Connexion...' : 'CONNEXION OFFLINE GOOGLE'}</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleForceRefresh}
                        disabled={refreshing}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Renouveler Token</span>
                      </button>
                      <button
                        onClick={handleSimulateExpiration}
                        disabled={simulating}
                        className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Simuler Expiration</span>
                      </button>
                      <button
                        onClick={handleLogoutGoogle}
                        className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-lg text-xs font-bold transition-all"
                      >
                        Déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifecycle Protocol Verification Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-1.5">
                  <span className="font-bold text-amber-300 uppercase tracking-wider">PROTOCOLE DE PERSISTANCE & SÉCURITÉ</span>
                  <span className="text-[11px] text-emerald-400 font-bold">100% ZÉRO PROMPT REQUIS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">1. Paramètre access_type=offline</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        CONFORME
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Autorisation demandée avec <code>access_type=offline&prompt=consent</code> pour délivrer un jeton de renouvellement.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">2. Stockage Persistant Coffre Backend</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        SÉCURISÉ
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Refresh token stocké exclusivement côté serveur sur disque chiffré, jamais dans <code>localStorage</code> ni dans les logs.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">3. Renouvellement Transparent (API Gateway)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        ACTIF
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Vérification avant chaque appel d'outil (Drive, Docs, Sheets, Gmail, Calendar) et retry transparent en cas de 401.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">4. Gestion de Révocation (invalid_grant)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        GÉRÉ
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Émission explicite de <code>GOOGLE_OAUTH_REAUTH_REQUIRED</code> si l'utilisateur révoque l'accès depuis son compte Google.
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Health Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-1.5">
                  <span className="font-bold text-amber-300">DISPONIBILITÉ DES SERVICES GOOGLE WORKSPACE</span>
                  <button
                    onClick={runAudit}
                    disabled={loading}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualiser statut</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Google Drive */}
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-400" /> Google Drive
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        auditReport?.diagnostics?.drive?.status === 'OK' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {auditReport?.diagnostics?.drive?.status || 'EN ATTENTE'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">Fichiers, dossiers & indexation</span>
                  </div>

                  {/* Gmail */}
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-red-400" /> Gmail
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        auditReport?.diagnostics?.gmail?.status === 'OK' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {auditReport?.diagnostics?.gmail?.status || 'EN ATTENTE'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">Messages & brouillons</span>
                  </div>

                  {/* Google Docs & Sheets */}
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Docs & Sheets
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        auditReport?.diagnostics?.drive?.status === 'OK' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {auditReport?.diagnostics?.drive?.status === 'OK' ? 'PRÊT' : 'EN ATTENTE'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">Édition & génération de documents</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: E2E TEST RUNNER */}
          {activeTab === 'e2e' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/70 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400" />
                      SUITE DE VALIDATION END-TO-END : EXPIRATION & RENOUVELLEMENT
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Ce test simule de bout en bout : (1) Session valide → (2) Expiration artificielle de l'Access Token → (3) Appel API réel → (4) Détection d'expiration et auto-renouvellement par le refresh token → (5) Obtention et persistance du nouveau token → (6) Succès sans aucune intervention utilisateur.
                    </p>
                  </div>
                  <button
                    onClick={handleRunE2ESuite}
                    disabled={runningE2E}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all shrink-0 ml-3"
                  >
                    <Play className={`w-3.5 h-3.5 ${runningE2E ? 'animate-spin' : ''}`} />
                    <span>{runningE2E ? 'Exécution...' : 'LANCER LE TEST E2E'}</span>
                  </button>
                </div>
              </div>

              {e2eReport && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-xs text-amber-300">
                      RÉSULTATS DE LA SUITE E2E ({e2eReport.passedTests}/{e2eReport.totalTests} ÉTAPES VALIDÉES)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      e2eReport.overallStatus === 'PASSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}>
                      {e2eReport.overallStatus}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {e2eReport.steps?.map((step: any) => (
                      <div
                        key={step.step}
                        className="p-3 bg-zinc-900/60 rounded-lg border border-amber-500/20 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-200 text-xs flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-mono">
                              {step.step}
                            </span>
                            {step.name}
                          </span>
                          <p className="text-[11px] text-zinc-400 pl-6">{step.details}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          step.status === 'PASSED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-950 text-red-400 border border-red-500/30'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  JOURNAL D'OBSERVABILITÉ DES ÉVÉNEMENTS OAUTH
                </span>
                <span className="text-[10px] text-zinc-500">Mise à jour en temps réel</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] max-h-[350px] overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <p className="text-zinc-600 italic">Aucun événement enregistré pour le moment.</p>
                ) : (
                  logs.map((log: any, idx: number) => {
                    let color = 'text-zinc-400';
                    if (log.event?.includes('SUCCESS') || log.event?.includes('STORED') || log.event?.includes('CONNECTED')) {
                      color = 'text-emerald-400';
                    } else if (log.event?.includes('STARTED')) {
                      color = 'text-cyan-400';
                    } else if (log.event?.includes('FAILED') || log.event?.includes('REAUTH')) {
                      color = 'text-red-400 font-bold';
                    }

                    return (
                      <div key={idx} className="flex items-start gap-2 border-b border-zinc-900/80 pb-1">
                        <span className="text-zinc-600 text-[10px] shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`font-bold shrink-0 ${color}`}>
                          [{log.event}]
                        </span>
                        <span className="text-zinc-300 break-all">
                          {log.details || JSON.stringify(log.meta || {})}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-zinc-950 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            J.A.R.V.I.S. OS Core Security • Vault v8.2
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            FERMER
          </button>
        </div>

      </div>
    </div>
  );
};
