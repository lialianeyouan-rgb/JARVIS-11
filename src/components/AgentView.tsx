/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Brain, Cpu, Play, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const AgentView: React.FC = () => {
  const [goal, setGoal] = useState('Perform automated security audit and optimize quantum memory indices.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState([
    { id: 1, title: 'Intent Parsing & Validation', status: 'completed', desc: 'Identified secure multi-cluster audit directive.' },
    { id: 2, title: 'Task Decomposition', status: 'completed', desc: 'Split into 3 sub-tasks: Network sweep, pgvector sync, encryption check.' },
    { id: 3, title: 'Tool Selection & Dispatch', status: 'completed', desc: 'Dispatched SystemMonitor, TerminalExecutor, and VectorIndex tools.' },
    { id: 4, title: 'Verification & Self-Correction', status: 'running', desc: 'Validating response consistency against security baseline.' },
  ]);

  const handleRunPipeline = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setIsExecuting(false);
    }, 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Brain className="w-6 h-6 text-amber-400" />
            <span>AGENT & REASONING CORE</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Autonomous task planning, intent decomposition, and self-correction pipeline.</p>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={isExecuting}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all flex items-center space-x-2 text-xs disabled:opacity-50"
        >
          {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isExecuting ? 'EXECUTING PIPELINE...' : 'EXECUTE NEW GOAL'}</span>
        </button>
      </div>

      {/* Goal Input Card */}
      <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-3">
        <label className="text-xs text-amber-400 font-bold">CURRENT AGENT GOAL / OBJECTIVE</label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="flex-1 bg-zinc-900 border border-amber-500/30 rounded-lg px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
          />
          <button 
            onClick={handleRunPipeline}
            className="px-4 py-2.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-lg hover:bg-amber-500/30 text-xs font-bold"
          >
            RE-PLAN
          </button>
        </div>
      </div>

      {/* Execution Steps Pipeline */}
      <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>DECOMPOSED TASK PIPELINE</span>
        </h3>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="p-4 rounded-lg bg-zinc-900/90 border border-amber-500/20 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step.status === 'completed' 
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' 
                    : step.status === 'running'
                    ? 'bg-amber-500/20 border border-amber-500 text-amber-400 animate-pulse'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                  {step.id}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200">{step.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{step.desc}</p>
                </div>
              </div>
              <div>
                {step.status === 'completed' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                  </span>
                )}
                {step.status === 'running' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
