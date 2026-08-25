/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Cpu, 
  Brain, 
  Database, 
  Terminal, 
  Mic, 
  ShieldCheck, 
  Activity,
  FolderOpen,
  Eye,
  Calendar,
  ListOrdered,
  Settings,
  Sliders,
  Mail,
  Network,
  Home,
  Layers,
  History,
  CheckSquare,
  Laptop
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  setTab: (tab: NavigationTab) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, onClose }) => {
  const [isMacConnected, setIsMacConnected] = React.useState<boolean>(false);
  const [macHostName, setMacHostName] = React.useState<string>('MacBook Pro');

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/jarvis/device/status');
        if (res.ok) {
          const data = await res.json();
          setIsMacConnected(Boolean(data.isOnline || data.status?.connected || data.device?.connected));
          if (data.status?.hostName) setMacHostName(data.status.hostName);
        }
      } catch {}
    };
    checkStatus();
    const timer = setInterval(checkStatus, 4000);
    return () => clearInterval(timer);
  }, []);

  const menuItems: { id: NavigationTab; label: string; icon: any; badge?: string; badgeColor?: string }[] = [
    { id: 'home', label: 'Orbe Centrale (Accueil)', icon: Home, badge: 'CORE' },
    { 
      id: 'computer_use', 
      label: 'Computer Use (Agent GUI)', 
      icon: Laptop, 
      badge: isMacConnected ? 'MAC EN LIGNE' : 'ATTENTE AGENT',
      badgeColor: isMacConnected ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' : undefined 
    },
    { id: 'capabilities', label: 'Fonctionnalités', icon: Layers, badge: 'AGENTIC' },
    { id: 'files', label: 'Google Drive & Fichiers', icon: FolderOpen, badge: 'DRIVE' },
    { id: 'communications', label: 'Gmail & Messages', icon: Mail, badge: 'GMAIL' },
    { id: 'integrations', label: 'Intégrations & APIs', icon: Network },
    { id: 'voice_settings', label: 'Modulation Vocale', icon: Sliders, badge: 'VOICE' },
    { id: 'history', label: 'Mémoire & Historique', icon: History },
    { id: 'tasks', label: 'Activités & Tâches', icon: CheckSquare },
    { id: 'settings', label: 'Paramètres Système', icon: Settings },
    { 
      id: 'computer', 
      label: 'Contrôle Mac (Host)', 
      icon: Terminal,
      badge: isMacConnected ? 'ACTIF' : undefined,
      badgeColor: isMacConnected ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' : undefined 
    },
    { id: 'security', label: 'Bouclier & Sécurité', icon: ShieldCheck },
    { id: 'monitoring', label: 'Télémétrie Réseau', icon: Activity },
    { id: 'vision', label: 'Vision & Analyse', icon: Eye },
  ];

  return (
    <aside className="w-72 h-full border-r border-amber-500/30 bg-zinc-950/95 backdrop-blur-xl flex flex-col justify-between select-none z-50">
      <div className="p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-amber-500/20">
          <div className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>MODULES J.A.R.V.I.S.</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-amber-300 text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
            >
              Fermer ✕
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'text-zinc-400 hover:text-amber-200 hover:bg-zinc-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className="font-medium tracking-wide truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 ${
                    isActive 
                      ? 'bg-amber-400 text-zinc-950' 
                      : (item.badgeColor || 'bg-zinc-900 border border-zinc-800 text-zinc-400')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-amber-500/20 text-xs font-mono space-y-2 bg-black/60">
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span>PROTECTION :</span>
          <span className="text-emerald-400 font-bold">ARMURE QUANTIQUE</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span>PASSERELLE MAC :</span>
          <span className="text-amber-400 font-bold">PORT 8765</span>
        </div>
        <div className="pt-2 border-t border-amber-500/10 flex items-center justify-center text-[10px] text-zinc-500">
          STARK INDUSTRIES PROTOCOL v8.4
        </div>
      </div>
    </aside>
  );
};

