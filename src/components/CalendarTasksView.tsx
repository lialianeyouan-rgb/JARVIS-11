/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Plus, CheckCircle2, Clock, Trash2, 
  ExternalLink, RefreshCw, AlertCircle, ShieldAlert, Check
} from 'lucide-react';
import { CalendarTask } from '../types';
import { getAccessToken, googleSignIn, initAuth } from '../lib/firebaseAuth';
import { 
  listGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent, 
  GoogleCalendarEvent 
} from '../lib/googleServices';

export const CalendarTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<CalendarTask[]>([
    { id: '1', title: 'Calibration du réacteur arc', time: '16:30 - Aujourd\'hui', priority: 'HIGH', status: 'in_progress' },
    { id: '2', title: 'Mise à jour des protocoles de défense', time: '18:00 - Aujourd\'hui', priority: 'MEDIUM', status: 'pending' },
  ]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Google Calendar creation modal state
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventSummary, setEventSummary] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('14:00');
  const [eventEndTime, setEventEndTime] = useState('15:00');
  const [eventDescription, setEventDescription] = useState('');

  // Confirmation modal state for destructive / mutation actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'create_event' | 'delete_event';
    targetId?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'create_event',
  });

  const loadGoogleCalendar = async () => {
    const token = await getAccessToken();
    if (!token) {
      setHasToken(false);
      return;
    }
    setHasToken(true);
    setLoadingCalendar(true);
    try {
      const events = await listGoogleCalendarEvents(token, 10);
      setGoogleEvents(events);
    } catch (err) {
      console.error('Error loading Google Calendar events:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    loadGoogleCalendar();
    const unsub = initAuth((user, token) => {
      if (token) {
        setHasToken(true);
        loadGoogleCalendar();
      } else {
        setHasToken(false);
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
        setHasToken(true);
        loadGoogleCalendar();
      }
    } catch (e) {
      console.error('Google Sign In error:', e);
    }
  };

  const handleRequestCreateGoogleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer la création sur Google Calendar',
      description: `Voulez-vous ajouter l'événement "${eventSummary}" le ${eventDate} de ${eventStartTime} à ${eventEndTime} directement sur votre Google Calendar réel ?`,
      actionType: 'create_event',
    });
  };

  const handleRequestDeleteGoogleEvent = (eventId: string, summary: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer l\'événement Google Calendar',
      description: `Êtes-vous sûr de vouloir supprimer définitivement l'événement "${summary}" de votre Google Calendar ? Cette action est irréversible.`,
      actionType: 'delete_event',
      targetId: eventId,
    });
  };

  const executeConfirmedAction = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert('Veuillez vous authentifier avec Google.');
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      return;
    }

    if (confirmDialog.actionType === 'create_event') {
      try {
        const startIso = `${eventDate}T${eventStartTime}:00`;
        const endIso = `${eventDate}T${eventEndTime}:00`;
        await createGoogleCalendarEvent(token, {
          summary: eventSummary,
          description: eventDescription,
          startTime: startIso,
          endTime: endIso,
        });
        setShowEventModal(false);
        setEventSummary('');
        setEventDescription('');
        await loadGoogleCalendar();
      } catch (err: any) {
        alert(`Erreur lors de la création : ${err.message}`);
      }
    } else if (confirmDialog.actionType === 'delete_event' && confirmDialog.targetId) {
      try {
        await deleteGoogleCalendarEvent(token, confirmDialog.targetId);
        await loadGoogleCalendar();
      } catch (err: any) {
        alert(`Erreur lors de la suppression : ${err.message}`);
      }
    }

    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  const addInternalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: CalendarTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      time: 'Aujourd\'hui',
      priority: 'MEDIUM',
      status: 'pending',
    };
    setTasks([task, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <span>GOOGLE CALENDAR & MISSIONS J.A.R.V.I.S.</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">
            Synchronisation en direct avec votre agenda Google réel et ordonnancement Stark.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasToken ? (
            <>
              <button
                onClick={loadGoogleCalendar}
                disabled={loadingCalendar}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCalendar ? 'animate-spin' : ''}`} />
                <span>Synchroniser</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Événement Google</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <span>Connecter Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Calendar Section */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>ÉVÉNEMENTS GOOGLE CALENDAR RÉELS</span>
          </h3>
          <span className="text-[10px] text-zinc-400">
            {hasToken ? `${googleEvents.length} événements à venir` : 'Non connecté'}
          </span>
        </div>

        {hasToken ? (
          googleEvents.length > 0 ? (
            <div className="space-y-3">
              {googleEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-lg bg-zinc-900/80 border border-amber-500/20 hover:border-amber-500/40 flex items-center justify-between transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-amber-100">{evt.summary}</span>
                      {evt.location && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {evt.location}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-400/80 flex items-center gap-3">
                      <span>
                        📅 {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : evt.start?.date}
                      </span>
                      {evt.description && (
                        <span className="text-zinc-500 truncate max-w-[200px]">
                          {evt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200"
                        title="Ouvrir dans Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleRequestDeleteGoogleEvent(evt.id, evt.summary)}
                      className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                      title="Supprimer de Google Calendar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 text-xs">
              Aucun événement immédiat trouvé sur votre Google Calendar principal.
            </div>
          )
        ) : (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-zinc-400">
              Liez votre compte Google pour synchroniser vos réunions et permettre à J.A.R.V.I.S. de gérer votre agenda en temps réel.
            </p>
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs"
            >
              Autoriser Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Internal Task Management */}
      <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>TÂCHES INTERNES & RAPPELS J.A.R.V.I.S.</span>
        </h3>

        {/* Add Quick Task Form */}
        <form onSubmit={addInternalTask} className="flex space-x-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nouvelle tâche Stark (ex: Calibration réacteur, audit pare-feu)..."
            className="flex-1 bg-zinc-900 border border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </form>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 rounded-lg bg-zinc-900/90 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleStatus(task.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 border-zinc-700 text-transparent hover:border-amber-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <span className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-amber-200'}`}>
                  {task.title}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">{task.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Google Calendar Event */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-xl p-6 max-w-md w-full font-mono text-amber-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span>NOUVEL ÉVÉNEMENT GOOGLE CALENDAR</span>
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-zinc-400 hover:text-zinc-200 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestCreateGoogleEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Titre de l'événement *</label>
                <input
                  type="text"
                  required
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder="Ex: Point d'avancement IA avec l'équipe"
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-2 py-2 text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Début</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-2 py-2 text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Fin</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-2 py-2 text-amber-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description / Notes</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  placeholder="Ordre du jour, lien visio, ou détails..."
                  className="w-full bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg"
                >
                  Suivant (Confirmation)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Dialog (Required for Workspace Mutating Operations) */}
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
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer & Exécuter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
