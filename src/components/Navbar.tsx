/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Radio, LogIn, LogOut, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from '../lib/firebaseAuth';

interface NavbarProps {
  onKillSwitch?: () => void;
  soundEnabled?: boolean;
  setSoundEnabled?: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [timeStr, setTimeStr] = useState('');
  const [systemStatus] = useState({ coreTemp: '32.4°C', powerLevel: '99.8%' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => {
      clearInterval(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="h-16 border-b border-amber-500/30 bg-black/90 backdrop-blur-md px-6 flex items-center justify-between text-amber-500 select-none z-50">
      {/* Brand & System Title */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-widest text-amber-300 font-mono">
            J.A.R.V.I.S.
          </h1>
        </div>
      </div>

      {/* Telemetry HUD metrics */}
      <div className="hidden lg:flex items-center space-x-6 text-xs font-mono bg-zinc-950/80 border border-amber-500/20 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-400">CORE STATUS:</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div className="h-4 w-[1px] bg-amber-500/20" />
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span className="text-zinc-400">TEMP:</span>
          <span className="text-amber-300">{systemStatus.coreTemp}</span>
        </div>
        <div className="h-4 w-[1px] bg-amber-500/20" />
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-zinc-400">POWER:</span>
          <span className="text-yellow-400">{systemStatus.powerLevel}</span>
        </div>
        <div className="h-4 w-[1px] bg-amber-500/20" />
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-mono">{timeStr}</span>
        </div>
      </div>

      {/* Google Account Connection Status / Sign In Button */}
      <div className="flex items-center space-x-3">
        {currentUser ? (
          <div className="flex items-center space-x-2.5 bg-zinc-950 border border-amber-500/40 rounded-lg px-3 py-1.5 font-mono text-xs">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Google User'}
                className="w-5 h-5 rounded-full border border-amber-400/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                {currentUser.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-bold text-amber-200 truncate max-w-[130px]">
                {currentUser.displayName || currentUser.email}
              </div>
              <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> GOOGLE SYNC
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnecter le compte Google"
              className="p-1 text-zinc-400 hover:text-red-400 transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-200 font-mono text-xs font-semibold transition-all hover:border-amber-400 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.64l3.88 3.01c2.27-2.09 3.665-5.17 3.665-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.01c-1.07.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93L1.27 17.43C3.25 21.36 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.31c-.25-.72-.38-1.49-.38-2.31s.13-1.59.38-2.31L1.27 6.57C.46 8.19 0 10.03 0 12s.46 3.81 1.27 5.43l4.01-3.12z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.57l4.01 3.12c.95-2.83 3.6-4.94 6.72-4.94z"
              />
            </svg>
            <span>{isLoggingIn ? 'Liaison...' : 'Lier Google'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

