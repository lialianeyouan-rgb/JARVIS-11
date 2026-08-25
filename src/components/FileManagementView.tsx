/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Upload, FileText, CheckCircle2, RefreshCw, Trash2, 
  ShieldCheck, Plus, Folder, Table, FilePlus, ExternalLink, Search, 
  AlertCircle, ShieldAlert, Check, Globe 
} from 'lucide-react';
import { getAccessToken, googleSignIn, initAuth } from '../lib/firebaseAuth';
import { 
  listGoogleDriveFiles, 
  createGoogleDriveFolder, 
  createGoogleDoc, 
  createGoogleSheet, 
  deleteGoogleDriveFile, 
  GoogleDriveFile 
} from '../lib/googleServices';

export const FileManagementView: React.FC = () => {
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [hasAuth, setHasAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'docs' | 'sheets' | 'folders'>('all');

  // Modals state
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');

  const [showNewDocModal, setShowNewDocModal] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');

  const [showNewSheetModal, setShowNewSheetModal] = useState<boolean>(false);
  const [sheetTitle, setSheetTitle] = useState<string>('');
  const [sheetHeaders, setSheetHeaders] = useState<string>('Nom, Email, Rôle, Statut');
  const [sheetRows, setSheetRows] = useState<string>('Tony Stark, tony@stark.com, Lead, Actif\nPepper Potts, pepper@stark.com, CEO, Actif');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete_file';
    targetId?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'delete_file',
  });

  const loadDriveFiles = async (queryText?: string) => {
    const token = await getAccessToken();
    if (!token) {
      setHasAuth(false);
      return;
    }
    setHasAuth(true);
    setLoading(true);
    try {
      const files = await listGoogleDriveFiles(token, {
        query: queryText || searchQuery || undefined,
        pageSize: 30,
      });
      setDriveFiles(files);
    } catch (err) {
      console.error('Error loading Google Drive files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriveFiles();
    const unsub = initAuth((user, token) => {
      if (token) {
        setHasAuth(true);
        loadDriveFiles();
      } else {
        setHasAuth(false);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setHasAuth(true);
        loadDriveFiles();
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await createGoogleDriveFolder(token, folderName.trim());
      setFolderName('');
      setShowNewFolderModal(false);
      loadDriveFiles();
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      const res = await createGoogleDoc(token, docTitle.trim(), docContent.trim());
      setDocTitle('');
      setDocContent('');
      setShowNewDocModal(false);
      loadDriveFiles();
      if (res.webViewLink) {
        window.open(res.webViewLink, '_blank');
      }
    } catch (err) {
      console.error('Error creating Doc:', err);
    }
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetTitle.trim()) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      const headers = sheetHeaders.split(',').map((h) => h.trim()).filter(Boolean);
      const rows = sheetRows
        .split('\n')
        .map((line) => line.split(',').map((cell) => cell.trim()))
        .filter((r) => r.length > 0 && r[0] !== '');

      const res = await createGoogleSheet(token, sheetTitle.trim(), headers, rows);
      setSheetTitle('');
      setShowNewSheetModal(false);
      loadDriveFiles();
      if (res.webViewLink) {
        window.open(res.webViewLink, '_blank');
      }
    } catch (err) {
      console.error('Error creating Sheet:', err);
    }
  };

  const triggerDeleteConfirmation = (file: GoogleDriveFile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'SUPPRESSION DÉFINITIVE DANS GOOGLE DRIVE',
      description: `Êtes-vous certain de vouloir supprimer le fichier "${file.name}" de votre Google Drive ? Cette action est irréversible.`,
      actionType: 'delete_file',
      targetId: file.id,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmDialog.targetId) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await deleteGoogleDriveFile(token, confirmDialog.targetId);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      loadDriveFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return <Table className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-zinc-400" />;
  };

  const filteredFiles = driveFiles.filter((file) => {
    if (activeTab === 'folders') return file.mimeType.includes('folder');
    if (activeTab === 'docs') return file.mimeType.includes('document');
    if (activeTab === 'sheets') return file.mimeType.includes('spreadsheet');
    return true;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-400" />
            <span>GOOGLE DRIVE & GESTION WORKSPACE</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Exploration, création de documents Google Docs & Sheets et organisation de vos dossiers Google Drive en direct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasAuth ? (
            <>
              <button
                onClick={() => loadDriveFiles()}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Nouveau Dossier</span>
              </button>
              <button
                onClick={() => setShowNewDocModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 text-xs font-bold flex items-center gap-1.5"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Google Doc</span>
              </button>
              <button
                onClick={() => setShowNewSheetModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Google Sheet</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Connecter Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      {hasAuth && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/70 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
            {(['all', 'docs', 'sheets', 'folders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800'
                }`}
              >
                {tab === 'all' && 'Tous les fichiers'}
                {tab === 'docs' && 'Google Docs'}
                {tab === 'sheets' && 'Google Sheets'}
                {tab === 'folders' && 'Dossiers'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-72 bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles(searchQuery)}
              placeholder="Rechercher dans Drive..."
              className="w-full bg-transparent text-xs text-amber-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Drive File List */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>FICHIERS GOOGLE DRIVE RÉELS ({filteredFiles.length})</span>
          </h3>
          <span className="text-[10px] text-zinc-400">
            {hasAuth ? 'Synchronisé avec votre compte Google' : 'En attente de connexion'}
          </span>
        </div>

        {hasAuth ? (
          filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-lg bg-zinc-900/80 border border-amber-500/20 hover:border-amber-500/40 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      {getMimeIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-amber-100 truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                        {file.modifiedTime && (
                          <span>Modifié le {new Date(file.modifiedTime).toLocaleDateString('fr-FR')}</span>
                        )}
                        {file.size && (
                          <>
                            <span>•</span>
                            <span>{(Number(file.size) / (1024 * 1024)).toFixed(2)} MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs"
                        title="Ouvrir dans Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => triggerDeleteConfirmation(file)}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-red-900/50 text-zinc-500 hover:text-red-400 text-xs"
                      title="Supprimer le fichier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              {loading ? 'Chargement des fichiers Google Drive...' : 'Aucun fichier trouvé avec ces filtres.'}
            </div>
          )
        ) : (
          <div className="p-8 text-center space-y-3 bg-zinc-900/30 rounded-xl border border-dashed border-amber-500/30">
            <FolderOpen className="w-10 h-10 text-amber-500/50 mx-auto" />
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Connectez votre compte Google pour parcourir votre Drive, créer des documents Docs et Sheets, et permettre à J.A.R.V.I.S. de gérer vos fichiers avec votre autorisation.
            </p>
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg"
            >
              Connecter Google Workspace
            </button>
          </div>
        )}
      </div>

      {/* Modal: New Folder */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-xl p-5 max-w-md w-full font-mono text-amber-100 space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-400" />
              <span>CRÉER UN DOSSIER GOOGLE DRIVE</span>
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nom du dossier</label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Projets Q3, Archives, Rapports..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg"
                >
                  Créer Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Google Doc */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-xl p-5 max-w-lg w-full font-mono text-amber-100 space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-blue-400" />
              <span>CRÉER UN DOCUMENT GOOGLE DOCS</span>
            </h3>
            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Titre du document</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Synthèse Stratégique 2026..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Contenu initial (optionnel)</label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={4}
                  placeholder="Texte initial ou plan du document généré..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Créer et Ouvrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Google Sheet */}
      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-xl p-5 max-w-lg w-full font-mono text-amber-100 space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              <span>CRÉER UNE FEUILLE GOOGLE SHEETS</span>
            </h3>
            <form onSubmit={handleCreateSheet} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Titre de la feuille</label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="Ex: Suivi Budgétaire, Inventaire..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">En-têtes de colonnes (séparés par des virgules)</label>
                <input
                  type="text"
                  value={sheetHeaders}
                  onChange={(e) => setSheetHeaders(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Lignes initiales (une ligne par rangée, colonnes séparées par des virgules)</label>
                <textarea
                  value={sheetRows}
                  onChange={(e) => setSheetRows(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowNewSheetModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Créer et Ouvrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Dialog for File Deletions */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-xl p-6 max-w-md w-full font-mono text-amber-100 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
