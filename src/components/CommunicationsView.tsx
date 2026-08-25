/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, CheckCircle, Clock, ExternalLink, Plus, 
  RefreshCw, FileText, Trash2, ShieldAlert, Sparkles, Inbox, User, 
  Check, Globe, ShieldCheck 
} from 'lucide-react';
import { getAccessToken, googleSignIn, initAuth } from '../lib/firebaseAuth';
import { 
  listGmailMessages, 
  sendGmailMessage, 
  createGmailDraft, 
  GmailMessageSummary 
} from '../lib/googleServices';

interface CommunicationsViewProps {
  onClose?: () => void;
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = () => {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasAuth, setHasAuth] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);

  // Email Composer state
  const [recipient, setRecipient] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Send Confirmation modal
  const [showSendConfirm, setShowSendConfirm] = useState<boolean>(false);

  const fetchGmailMessages = async () => {
    const token = await getAccessToken();
    if (!token) {
      setHasAuth(false);
      return;
    }
    setHasAuth(true);
    setLoading(true);
    try {
      const msgs = await listGmailMessages(token, 10);
      setMessages(msgs);
      if (msgs.length > 0 && !selectedMessage) {
        setSelectedMessage(msgs[0]);
      }
    } catch (e: any) {
      console.error('Failed to fetch Gmail messages:', e);
      setActionStatus(`Erreur synchronisation Gmail: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGmailMessages();
    const unsub = initAuth((user, token) => {
      if (token) {
        setHasAuth(true);
        fetchGmailMessages();
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
        fetchGmailMessages();
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!recipient || !subject || !body) {
      setActionStatus('Veuillez renseigner le destinataire, le sujet et le message.');
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setActionStatus('Veuillez connecter votre compte Google pour enregistrer un brouillon Gmail.');
      return;
    }

    setSending(true);
    try {
      await createGmailDraft(token, { to: recipient, subject, body });
      setActionStatus(`Brouillon enregistré avec succès dans votre boîte Gmail réelle.`);
      setRecipient('');
      setSubject('');
      setBody('');
      fetchGmailMessages();
    } catch (err: any) {
      setActionStatus(`Erreur enregistrement brouillon: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const executeSendEmail = async () => {
    setShowSendConfirm(false);
    const token = await getAccessToken();
    if (!token) {
      setActionStatus('Veuillez connecter votre compte Google pour envoyer des e-mails.');
      return;
    }

    setSending(true);
    try {
      await sendGmailMessage(token, { to: recipient, subject, body });
      setActionStatus(`Email expédié avec succès à ${recipient} via votre compte Gmail.`);
      setRecipient('');
      setSubject('');
      setBody('');
      fetchGmailMessages();
    } catch (err: any) {
      setActionStatus(`Erreur envoi Gmail: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const openMailto = () => {
    const url = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 text-amber-100 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-400" />
            <span>GMAIL & HUB DE COMMUNICATION</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Lecture de votre boîte de réception Gmail en direct, rédaction et expédition sécurisée d'e-mails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasAuth ? (
            <button
              onClick={fetchGmailMessages}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>ACTUALISER GMAIL</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Connecter Gmail</span>
            </button>
          )}
        </div>
      </div>

      {/* Gateway Status Banner */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Passerelle Gmail REST API & OAuth 2.0
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {hasAuth 
                  ? 'Compte Google connecté et prêt pour la synchronisation et les envois.' 
                  : 'Compte Google non connecté. Veuillez vous connecter pour accéder à Gmail.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded border text-[10px] flex items-center gap-1.5 ${
              hasAuth 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasAuth ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
              <span>Gmail API: {hasAuth ? 'Connecté' : 'En attente'}</span>
            </div>
          </div>
        </div>
      </div>

      {actionStatus && (
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{actionStatus}</span>
          </div>
          <button onClick={() => setActionStatus(null)} className="text-amber-400 hover:text-amber-200 text-xs font-bold">
            OK
          </button>
        </div>
      )}

      {/* Main Grid: Inbox / Message list & Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gmail Inbox (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-400" />
              <span>MESSAGES GMAIL RÉCENTS ({messages.length})</span>
            </h3>
          </div>

          {hasAuth ? (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMessage(m)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedMessage?.id === m.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-900/80 border-amber-500/20 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 truncate max-w-[200px]">
                      {m.subject}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.date ? new Date(m.date).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    <span className="truncate">{m.from}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{m.snippet}</p>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center py-10 text-zinc-600 text-xs">
                  {loading ? 'Chargement des messages Gmail...' : 'Aucun message récent trouvé.'}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-zinc-900/30 rounded-xl border border-dashed border-amber-500/30">
              <Mail className="w-8 h-8 text-amber-500/50 mx-auto" />
              <p className="text-xs text-zinc-400">
                Connectez votre compte pour afficher vos e-mails Gmail en direct.
              </p>
              <button
                onClick={handleConnectGoogle}
                className="px-3 py-1.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg"
              >
                Connexion Google
              </button>
            </div>
          )}
        </div>

        {/* Right: Message Reader & Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Selected Message Viewer */}
          {selectedMessage && (
            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>APERÇU DU MESSAGE GMAIL</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-zinc-900/90 p-3 rounded-lg border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">De :</span>
                    <span className="text-amber-200 font-bold">{selectedMessage.from}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Objet :</span>
                    <span className="text-amber-300 font-bold">{selectedMessage.subject}</span>
                  </div>
                  {selectedMessage.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Date :</span>
                      <span className="text-zinc-400">{selectedMessage.date}</span>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900/90 p-4 rounded-lg border border-amber-500/20">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2 font-bold">
                    Extrait du contenu
                  </span>
                  <div className="whitespace-pre-wrap text-zinc-300 text-xs font-mono leading-relaxed">
                    {selectedMessage.snippet}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      const fromMatch = selectedMessage.from.match(/<([^>]+)>/);
                      const replyTo = fromMatch ? fromMatch[1] : selectedMessage.from;
                      setRecipient(replyTo);
                      setSubject(`Re: ${selectedMessage.subject}`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold"
                  >
                    Répondre à ce message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Email Composer Form */}
          <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>RÉDIGER & ENVOYER UN E-MAIL GMAIL</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!recipient || !subject || !body) {
                  setActionStatus('Veuillez remplir tous les champs.');
                  return;
                }
                setShowSendConfirm(true);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 mb-1 block">Destinataire (Email) :</label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="contact@exemple.fr"
                    className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-400 mb-1 block">Objet :</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Objet de votre e-mail"
                    className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 mb-1 block">Corps du message :</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Bonjour, je vous contacte suite à..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-3 text-amber-100 focus:outline-none focus:border-amber-400 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={openMailto}
                  className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir client Mailto</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={sending}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sauvegarder Brouillon</span>
                  </button>

                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer via Gmail</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Sending Email */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-xl p-6 max-w-md w-full font-mono text-amber-100 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                CONFIRMATION D'EXPÉDITION GMAIL
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Vous êtes sur le point d'envoyer un e-mail réel depuis votre compte Gmail avec les paramètres suivants :
            </p>

            <div className="bg-zinc-900/90 p-3 rounded-lg border border-amber-500/20 text-xs space-y-1">
              <div><span className="text-zinc-500">Destinataire :</span> <span className="text-amber-200 font-bold">{recipient}</span></div>
              <div><span className="text-zinc-500">Objet :</span> <span className="text-amber-300 font-bold">{subject}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setShowSendConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeSendEmail}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer l'envoi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
