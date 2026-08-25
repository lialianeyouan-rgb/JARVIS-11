/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('J.A.R.V.I.S. Uncaught UI Exception:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('jarvis_voice_config');
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#030407] text-amber-100 flex flex-col items-center justify-center p-6 font-mono select-none">
          <div className="max-w-md w-full bg-black/90 border border-amber-500/40 rounded-2xl p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold tracking-wider text-amber-300">
                PROTOCOLE DE SÉCURITÉ J.A.R.V.I.S.
              </h2>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Une exception matérielle ou d'affichage a été interceptée. Les modules de secours maintiennent l'intégrité du système.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-950/80 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-400/80 text-left font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RÉINITIALISER LES NOYAUX</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/60" />
              <span>STARK SECURITY ARCHITECTURE v10.4</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
