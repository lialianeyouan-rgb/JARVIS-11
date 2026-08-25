/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, Activity, CheckSquare, Brain, Layers, 
  Network, ListOrdered, Settings, ChevronDown, Sparkles, Laptop
} from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationLauncherProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const NavigationLauncher: React.FC<NavigationLauncherProps> = ({
  currentTab,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const spaces: { id: NavigationTab; label: string; icon: any; desc: string }[] = [
    { id: 'home', label: 'HOME', icon: Home, desc: 'Orbe 3D & Synthèse Vocale' },
    { id: 'computer_use', label: 'COMPUTER USE', icon: Laptop, desc: 'Agent GUI & Boucle Plan → Action' },
    { id: 'system', label: 'SYSTEM', icon: Activity, desc: 'Monitoring & Télémétrie Mac' },
    { id: 'tasks', label: 'TASKS', icon: CheckSquare, desc: 'Missions & Tâches Agentiques' },
    { id: 'memory', label: 'MEMORY', icon: Brain, desc: 'Banque Cognitive & Faits' },
    { id: 'capabilities', label: 'CAPABILITIES', icon: Layers, desc: 'Répertoire des Modules' },
    { id: 'integrations', label: 'INTEGRATIONS', icon: Network, desc: 'Google Workspace & Gemini' },
    { id: 'activity', label: 'ACTIVITY', icon: ListOrdered, desc: 'Journal des Traces & Logs' },
    { id: 'settings', label: 'SETTINGS', icon: Settings, desc: 'Configuration & Paramètres' },
  ];

  return (
    <div className="relative font-mono z-50">
      {/* Discrete Launcher Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] group"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:animate-ping" />
        <span className="tracking-wider uppercase">
          {currentTab === 'home' ? 'J.A.R.V.I.S. ESPACES' : currentTab.toUpperCase()}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-300' : 'text-zinc-500'}`} />
      </button>

      {/* Expanded Holographic Spaces Menu */}
      {isOpen && (
        <>
          {/* Backdrop click dismiss */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-zinc-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-3 py-1.5 border-b border-amber-500/20 text-[10px] text-amber-500/70 font-bold uppercase tracking-widest flex items-center justify-between">
              <span>ESPACES FONCTIONNELS</span>
              <span className="text-zinc-500">8 MODULES</span>
            </div>

            <div className="grid grid-cols-1 gap-1 pt-1">
              {spaces.map((sp) => {
                const Icon = sp.icon;
                const isActive = currentTab === sp.id || (sp.id === 'system' && currentTab === 'monitoring') || (sp.id === 'memory' && currentTab === 'history') || (sp.id === 'activity' && currentTab === 'agent');
                return (
                  <button
                    key={sp.id}
                    onClick={() => {
                      onNavigate(sp.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center space-x-3 transition-all ${
                      isActive
                        ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                        : 'bg-zinc-900/40 border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-black/50 text-zinc-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200 tracking-wider">{sp.label}</span>
                        {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">ACTIF</span>}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{sp.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
