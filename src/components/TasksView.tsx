/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckSquare, Play, CheckCircle2, Clock, AlertCircle, 
  RotateCw, Plus, ShieldCheck, ArrowRight, Pause, Check, X, FileSpreadsheet, Mail, Brain
} from 'lucide-react';
import { AgentTask } from '../types';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([
    {
      id: 'task_1',
      title: 'Recherche & Analyse Stratégique FinProtect',
      category: 'research',
      status: 'running',
      progress: 42,
      currentStep: 'Scraping des sources réglementaires et synthèse comparative',
      startedAt: 'Il y a 6 min',
      steps: [
        { id: 's1', label: 'Extraction des index documentaires', status: 'done', timestamp: '14:20:10' },
        { id: 's2', label: 'Analyse sémantique par modèle Gemini', status: 'active', timestamp: '14:22:30' },
        { id: 's3', label: 'Génération du rapport exécutif Google Doc', status: 'pending' },
      ],
    },
    {
      id: 'task_2',
      title: 'Indexation & Analyse Google Drive',
      category: 'workspace',
      status: 'completed',
      progress: 100,
      currentStep: '12 fichiers analysés et catégorisés avec succès',
      startedAt: 'Il y a 22 min',
      completedAt: 'Il y a 18 min',
      steps: [
        { id: 's1', label: 'Connexion OAuth Google Drive', status: 'done' },
        { id: 's2', label: 'Parcours de l\'arborescence racine', status: 'done' },
        { id: 's3', label: 'Création du cache vectoriel local', status: 'done' },
      ],
    },
    {
      id: 'task_3',
      title: 'Audit Git & Revue de Code Locale',
      category: 'code',
      status: 'completed',
      progress: 100,
      currentStep: 'Dépôt propre, 0 vulnérabilité détectée',
      startedAt: 'Il y a 45 min',
      completedAt: 'Il y a 43 min',
      steps: [
        { id: 's1', label: 'git status via Daemon Mac Bridge', status: 'done' },
        { id: 's2', label: 'Analyse statique TypeScript / ESLint', status: 'done' },
      ],
    },
    {
      id: 'task_4',
      title: 'Préparation & Expédition d\'E-mail',
      category: 'email',
      status: 'waiting_confirmation',
      progress: 80,
      currentStep: 'Brouillon prêt. En attente d\'autorisation d\'expédition par le Maître',
      startedAt: 'Il y a 10 min',
      requiresAction: {
        actionType: 'confirm_email',
        prompt: 'Confirmez-vous l\'envoi de la synthèse hebdomadaire à l\'équipe projet ?',
        payload: { recipient: 'equipe-projet@stark.com', subject: 'Compte-rendu d\'avancement J.A.R.V.I.S.' },
      },
      steps: [
        { id: 's1', label: 'Rédaction du contenu par le LLM', status: 'done' },
        { id: 's2', label: 'Formatage HTML et vérification des pièces', status: 'done' },
        { id: 's3', label: 'Autorisation finale du Maître', status: 'active' },
        { id: 's4', label: 'Envoi via API Gmail', status: 'pending' },
      ],
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleConfirmAction = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'completed',
          progress: 100,
          currentStep: 'Action validée et expédiée avec succès',
          requiresAction: undefined,
          steps: t.steps.map(s => ({ ...s, status: 'done' })),
        };
      }
      return t;
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: AgentTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle,
      category: 'research',
      status: 'running',
      progress: 15,
      currentStep: 'Initialisation de la boucle agentique...',
      startedAt: 'À l\'instant',
      steps: [
        { id: 's1', label: 'Planification des sous-objectifs', status: 'active', timestamp: new Date().toLocaleTimeString() },
        { id: 's2', label: 'Exécution des outils nécessaires', status: 'pending' },
        { id: 's3', label: 'Validation des livrables', status: 'pending' },
      ],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>ACTIVE TASKS & AGENTIC WORKFLOWS</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Supervision des missions autonomes exécutées par J.A.R.V.I.S., progression des sous-tâches et points de validation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>NOUVELLE MISSION AGENTIQUE</span>
        </button>
      </div>

      {/* Modal to add task */}
      {showAddModal && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3 animate-in fade-in">
          <h3 className="text-sm font-bold text-amber-300">Lancer une nouvelle tâche agentique</h3>
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ex: Analyse concurrentielle, Nettoyage des logs, Rapport PDF..."
              className="flex-1 bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-lg hover:bg-amber-400"
            >
              DÉMARRER
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-2 bg-zinc-900 text-zinc-400 text-xs font-bold rounded-lg hover:text-zinc-200"
            >
              ANNULER
            </button>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-3 transition-all hover:border-amber-500/50"
          >
            {/* Task Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                {task.status === 'running' && (
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Play className="w-4 h-4 animate-pulse fill-current" />
                  </span>
                )}
                {task.status === 'completed' && (
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
                {task.status === 'waiting_confirmation' && (
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </span>
                )}

                <div>
                  <h3 className="text-sm font-bold text-amber-200">{task.title}</h3>
                  <span className="text-[11px] text-zinc-400">{task.currentStep}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  task.status === 'running' 
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' 
                    : task.status === 'completed' 
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {task.status === 'running' && `RUNNING · ${task.progress}%`}
                  {task.status === 'completed' && 'COMPLETED'}
                  {task.status === 'waiting_confirmation' && 'EN ATTENTE DE CONFIRMATION'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  task.status === 'completed'
                    ? 'bg-emerald-400'
                    : task.status === 'waiting_confirmation'
                    ? 'bg-cyan-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>

            {/* Confirmation Action Box if needed */}
            {task.requiresAction && (
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-cyan-300 block">POINT DE VALIDATION REQUIS</span>
                    <p className="text-xs text-zinc-300 mt-0.5">{task.requiresAction.prompt}</p>
                    {task.requiresAction.payload && (
                      <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                        Destinataire : {task.requiresAction.payload.recipient} | Objet : {task.requiresAction.payload.subject}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleConfirmAction(task.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>AUTORISER</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-steps Progression */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-900 text-xs">
              {task.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-2 rounded border flex items-center space-x-2 ${
                    step.status === 'done'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : step.status === 'active'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 animate-pulse'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-[10px] font-bold">{idx + 1}.</span>
                  <span className="truncate text-[11px]">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
