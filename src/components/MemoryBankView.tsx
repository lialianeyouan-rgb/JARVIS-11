/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, Search, Plus, Trash2, ShieldCheck, Tag, Sparkles, 
  Brain, Bot, Check, HelpCircle, RefreshCw, Layers
} from 'lucide-react';
import { MemoryItem } from '../types';

export const MemoryBankView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([
    { id: '1', category: 'preference', key: 'Protocole d\'Adresse', value: 'S\'adresser à l\'utilisateur en l\'appelant "Maître"', confidence: 1.0, updatedAt: '2026-08-18 10:22' },
    { id: '2', category: 'preference', key: 'Modulation Vocale Favorite', value: 'Profil J.A.R.V.I.S. classique (grave, rate=0.90, pitch=0.50) ou F.R.I.D.A.Y. pour les synthèses', confidence: 0.99, updatedAt: '2026-08-18 11:05' },
    { id: '3', category: 'project', key: 'Architecture J.A.R.V.I.S. OS', value: 'Découpage modulaire en 8 espaces fonctionnels avec Orbe 3D minimaliste à l\'accueil', confidence: 0.98, updatedAt: '2026-08-18 12:40' },
    { id: '4', category: 'fact', key: 'Intégrations Cloud Google', value: 'Accès autorisé aux APIs Google Drive, Docs, Sheets, Calendar et Gmail via OAuth 2.0', confidence: 0.97, updatedAt: '2026-08-18 13:15' },
    { id: '5', category: 'objective', key: 'Sécurité & Garde-fous', value: 'Confirmation obligatoire du Maître avant toute expédition réelle d\'email ou suppression de fichier', confidence: 0.99, updatedAt: '2026-08-18 14:00' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const newItem: MemoryItem = {
      id: `mem_${Date.now()}`,
      category: newCategory,
      key: newKey,
      value: newValue,
      confidence: 1.0,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setMemories([newItem, ...memories]);
    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const filteredMemories = memories.filter(m => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesQuery = 
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleExplainMemory = () => {
    setIsExplaining(true);
    setShowExplanation(true);
    setTimeout(() => {
      setIsExplaining(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Brain className="w-6 h-6 text-amber-400" />
            <span>COGNITIVE MEMORY & KNOWLEDGE BANK</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Banque mnésique sémantique : faits mémorisés, préférences du Maître, projets et garde-fous.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExplainMemory}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXPLICATION RÉFLEXIVE</span>
          </button>
        </div>
      </div>

      {/* Reflexive Explanation Banner */}
      {showExplanation && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>SYNTHÈSE DE LA MÉMOIRE PAR J.A.R.V.I.S.</span>
            </span>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-xs text-zinc-500 hover:text-amber-300"
            >
              Fermer
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            « Maître, ma mémoire active stocke actuellement <strong>{memories.length} entrées clés</strong>. Je sais que vous exigez une interface épurée à 8 espaces, le respect scrupuleux du protocole d'adresse, et la validation préalable des envois d'e-mails et de suppressions de fichiers. Tout élément peut être révoqué instantanément à votre demande. »
          </p>
        </div>
      )}

      {/* Search & Categories Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans la mémoire de J.A.R.V.I.S...."
            className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-lg pl-9 pr-4 py-2 text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'preference', 'project', 'fact', 'objective'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-amber-500/30'
              }`}
            >
              {cat === 'ALL' ? 'TOUT' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inject New Memory */}
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>INJECTER UN SOUVENIR</span>
          </h3>

          <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 mb-1 block">Catégorie :</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="preference">Préférence</option>
                <option value="project">Projet</option>
                <option value="fact">Fait / Savoir</option>
                <option value="objective">Garde-fou / Règle</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Identifiant / Clé :</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Ex: Titre du projet, Clé de contact..."
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-zinc-400 mb-1 block">Contenu mémorisé :</label>
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={3}
                placeholder="Décrivez ce que J.A.R.V.I.S. doit retenir..."
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!newKey.trim() || !newValue.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-lg text-xs transition-all"
            >
              ENREGISTRER EN MÉMOIRE
            </button>
          </form>
        </div>

        {/* Right Column: Memories List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 hover:border-amber-500/50 backdrop-blur-md flex items-start justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    mem.category === 'preference'
                      ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                      : mem.category === 'project'
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                      : mem.category === 'objective'
                      ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                  }`}>
                    {mem.category}
                  </span>
                  <h4 className="text-xs font-bold text-amber-200">{mem.key}</h4>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{mem.value}</p>

                <div className="flex items-center space-x-3 text-[10px] text-zinc-500 pt-1">
                  <span>Mis à jour : {mem.updatedAt}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Confiance : {(mem.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(mem.id)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-all"
                title="Oublier cette information"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filteredMemories.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950/50 rounded-xl border border-zinc-900">
              Aucune mémoire ne correspond à vos critères.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
