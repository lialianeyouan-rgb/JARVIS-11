/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, Volume2, VolumeX, Send, ArrowLeft, X, Sparkles, Key, Radio, Captions, CaptionsOff
} from 'lucide-react';
import { JarvisOrb3D } from './components/JarvisOrb3D';
import { VoiceSettingsView, VOICE_PRESETS } from './components/VoiceSettingsView';
import { CapabilitiesView } from './components/CapabilitiesView';
import { CommunicationsView } from './components/CommunicationsView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { HistoryView } from './components/HistoryView';
import { TasksView } from './components/TasksView';
import { ComputerControlView } from './components/ComputerControlView';
import { ComputerUseView } from './components/ComputerUseView';
import { SecurityView } from './components/SecurityView';
import { SystemMonitoringView } from './components/SystemMonitoringView';
import { MonitoringView } from './components/MonitoringView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { MemoryBankView } from './components/MemoryBankView';
import { NavigationLauncher } from './components/NavigationLauncher';
import { VisionView } from './components/VisionView';
import { FileManagementView } from './components/FileManagementView';
import { GoogleWorkspaceAuditModal } from './components/GoogleWorkspaceAuditModal';
import { initAuth, googleSignIn, getAccessToken, getStoredGoogleUser } from './lib/firebaseAuth';
import { NavigationTab, VoiceConfig, ChatMessage } from './types';
import { playNeuralVoice, stopNeuralVoice } from './lib/neuralAudioPlayer';

// Helper to pick the best matching browser voice for a given VoiceConfig
function findBestVoiceForConfig(config: VoiceConfig, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined;

  // 1. If exact URI is specified and available, use it
  if (config.voiceURI) {
    const exact = voices.find(v => v.voiceURI === config.voiceURI);
    if (exact) return exact;
  }

  const langCode = (config.lang || 'fr-FR').substring(0, 2).toLowerCase();
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));
  const pool = langVoices.length > 0 ? langVoices : voices;

  if (config.gender === 'feminine') {
    const female = pool.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('amelie') || name.includes('julie') || name.includes('marie') ||
             name.includes('female') || name.includes('celine') || name.includes('samantha') ||
             name.includes('audrey') || name.includes('hortense') || name.includes('zira') ||
             name.includes('denise') || name.includes('alice') || name.includes('charlotte') ||
             name.includes('manon') || name.includes('lea') || name.includes('google français');
    });
    if (female) return female;
  } else {
    const male = pool.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('thomas') || name.includes('paul') || name.includes('male') ||
             name.includes('nicolas') || name.includes('daniel') || name.includes('guy') ||
             name.includes('david') || name.includes('georges') || name.includes('alain') ||
             name.includes('pierre') || name.includes('antoine');
    });
    if (male) return male;
  }

  return pool[0];
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  profile: 'jarvis',
  gender: 'masculine',
  characteristic: 'grave',
  rate: 0.90,
  pitch: 0.50,
  lang: 'fr-FR',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoListen, setAutoListen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jarvis_auto_listen');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {}
    return true; // Activé par défaut pour conversation naturelle et fluide
  });
  const [showTranscript, setShowTranscript] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jarvis_show_transcript');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {}
    return false; // Désactivé par défaut pour un écran épuré, activable au choix
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [lastResponse, setLastResponse] = useState<string>(
    'À votre service, Maître.'
  );
  const [transcript, setTranscript] = useState<string>('');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init_msg',
      role: 'assistant',
      content: 'Bonjour Maître. Tous les systèmes quantiques et vocaux sont en ligne.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Google Workspace Integration State
  const [isGoogleAuditOpen, setIsGoogleAuditOpen] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Initialize and synchronize Google Auth state
  useEffect(() => {
    const stored = getStoredGoogleUser();
    setGoogleUserEmail(stored.email);
    setHasGoogleToken(stored.hasToken);

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUserEmail(user.email);
        setHasGoogleToken(!!token);
      },
      () => {
        setGoogleUserEmail(null);
        setHasGoogleToken(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleQuickConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUserEmail(res.user.email);
        setHasGoogleToken(true);
      }
    } catch (e: any) {
      if (
        e?.code === 'auth/popup-closed-by-user' ||
        e?.code === 'auth/cancelled-popup-request' ||
        e?.message?.includes('popup-closed-by-user')
      ) {
        // User closed popup intentionally
        return;
      }
      console.warn('Quick Google Connect incomplete:', e?.message || e);
      setIsGoogleAuditOpen(true);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Voice Configuration with Persistent LocalStorage Initialization
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    try {
      const saved = localStorage.getItem('jarvis_voice_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_VOICE_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not read voice config from localStorage:', e);
    }
    return DEFAULT_VOICE_CONFIG;
  });

  // Mutable References to eliminate any React Stale Closure issues during speech & multi-turn flows
  const voiceConfigRef = useRef<VoiceConfig>(voiceConfig);
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoListenRef = useRef<boolean>(autoListen);
  const showTranscriptRef = useRef<boolean>(showTranscript);
  const transcriptBufferRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const isListeningRef = useRef<boolean>(isListening);
  const isLoadingRef = useRef<boolean>(isLoading);

  // Synchronize Refs and LocalStorage
  useEffect(() => {
    autoListenRef.current = autoListen;
    try {
      localStorage.setItem('jarvis_auto_listen', String(autoListen));
    } catch (e) {}
  }, [autoListen]);

  useEffect(() => {
    showTranscriptRef.current = showTranscript;
    try {
      localStorage.setItem('jarvis_show_transcript', String(showTranscript));
    } catch (e) {}
  }, [showTranscript]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    voiceConfigRef.current = voiceConfig;
    try {
      localStorage.setItem('jarvis_voice_config', JSON.stringify(voiceConfig));
    } catch (e) {
      console.warn('Could not save voice config to localStorage:', e);
    }
  }, [voiceConfig]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Safe Speech Recognition control methods with Continuous Keep-Alive
  const startListeningSafely = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isSpeakingRef.current) {
      stopNeuralVoice();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    transcriptBufferRef.current = '';
    setTranscript('');
    isListeningRef.current = true;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Ignored if already started or transitioning
    }
  }, []);

  const stopListeningSafely = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListeningSafely();
    } else {
      startListeningSafely();
    }
  }, [startListeningSafely, stopListeningSafely]);

  // Central method to update voice configuration and lock it permanently
  const applyAndSaveVoiceConfig = useCallback((newConfig: Partial<VoiceConfig>): VoiceConfig => {
    let preset: any = undefined;
    if (newConfig.profile) {
      preset = VOICE_PRESETS.find(p => p.id === newConfig.profile);
    }

    const voices = typeof window !== 'undefined' && 'speechSynthesis' in window 
      ? window.speechSynthesis.getVoices() 
      : [];

    const merged: VoiceConfig = {
      ...voiceConfigRef.current,
      profile: newConfig.profile || preset?.id || voiceConfigRef.current.profile,
      gender: newConfig.gender || preset?.gender || voiceConfigRef.current.gender,
      characteristic: newConfig.characteristic || preset?.characteristic || voiceConfigRef.current.characteristic,
      pitch: newConfig.pitch ?? preset?.pitch ?? voiceConfigRef.current.pitch,
      rate: newConfig.rate ?? preset?.rate ?? voiceConfigRef.current.rate,
      lang: newConfig.lang || voiceConfigRef.current.lang || 'fr-FR',
      voiceURI: newConfig.voiceURI || voiceConfigRef.current.voiceURI,
    };

    // If voiceURI is not matching or needs update, pick the best one
    const bestVoice = findBestVoiceForConfig(merged, voices);
    if (bestVoice) {
      merged.voiceURI = bestVoice.voiceURI;
    }

    // Immediately update ref and state
    voiceConfigRef.current = merged;
    setVoiceConfig(merged);

    try {
      localStorage.setItem('jarvis_voice_config', JSON.stringify(merged));
    } catch (e) {
      console.warn('Could not save voice config:', e);
    }

    return merged;
  }, []);

  // Speech Synthesis Function with Auto-Listen Loop Trigger
  const speakText = useCallback((text: string, overrideConfig?: Partial<VoiceConfig>) => {
    if (!soundEnabledRef.current || !text) return;

    // Safety: ensure mic is closed while J.A.R.V.I.S. is vocalizing
    stopListeningSafely();
    stopNeuralVoice();
    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) return;

    let activeConfig = voiceConfigRef.current;
    if (overrideConfig) {
      activeConfig = applyAndSaveVoiceConfig(overrideConfig);
    }

    playNeuralVoice(
      cleanText,
      activeConfig,
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        stopListeningSafely();
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // Hands-Free Auto-Listen: immediately re-arm microphone after vocal response
        if (autoListenRef.current && soundEnabledRef.current) {
          setTimeout(() => {
            if (!isSpeakingRef.current && !isLoadingRef.current) {
              startListeningSafely();
            }
          }, 350);
        }
      }
    ).catch((err) => {
      console.warn('[Speech] playNeuralVoice error:', err);
    });
  }, [applyAndSaveVoiceConfig, startListeningSafely, stopListeningSafely]);

  // Main conversational handler
  const handleSendCommand = useCallback(async (promptToSend: string) => {
    if (!promptToSend.trim() || isLoadingRef.current) return;

    // Immediate mic closure to prevent capturing echoes
    stopListeningSafely();

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = [...chatMessagesRef.current, userMessage];
    setChatMessages(currentHistory);
    setTextInput('');
    setTranscript('');
    setIsLoading(true);
    isLoadingRef.current = true;

    try {
      // Retrieve Google OAuth token to grant access to Drive/Docs/Sheets/Gmail/Calendar
      let validGoogleToken: string | undefined = undefined;
      try {
        const rawToken = await getAccessToken();
        if (typeof rawToken === 'string' && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') {
          const trimmed = rawToken.trim();
          if (/^[\x21-\x7E]+$/.test(trimmed)) {
            validGoogleToken = trimmed;
          }
        }
      } catch (tokenErr) {
        console.warn('Error reading Google token:', tokenErr);
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (validGoogleToken) {
        headers['Authorization'] = `Bearer ${validGoogleToken}`;
      }

      // Robust chat communication with retry and timeout
      const postChatWithRetry = async (payload: any, customHeaders: Record<string, string>, maxRetries = 1): Promise<any> => {
        let lastErr: any = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 35000);
            const res = await fetch('/api/jarvis/chat', {
              method: 'POST',
              headers: customHeaders,
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              return {
                reply: "À vos ordres, Maître. Le réseau neuronal principal a subi une brève latence de quota, mais tous les modules de contrôle restent opérationnels.",
                error: true,
                message: errBody?.message || `Server status ${res.status}`,
              };
            }

            return await res.json();
          } catch (err: any) {
            lastErr = err;
            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
        return {
          reply: "À vos ordres, Maître. La liaison réseau est rétablie et vos modules de contrôle direct restent disponibles.",
          error: true,
          message: lastErr?.message || "Timeout",
        };
      };

      const data = await postChatWithRetry({
        sessionId: 'jarvis_main_session',
        userPrompt: promptToSend,
        messages: currentHistory.map(m => ({ role: m.role, content: m.content })),
        googleAccessToken: validGoogleToken || undefined,
      }, headers);

      const reply = data.reply || (data.error ? `Anomalie système : ${data.message}` : "À vos ordres, Maître.");
      const toolInfo = data.toolTriggered;

      setLastResponse(reply);

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolTriggered: toolInfo ? toolInfo.map(t => ({
          tool: t.tool,
          status: t.status,
          result: t.result,
        })) : undefined,
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      // Tool Side-Effects Handling
      if (toolInfo && toolInfo.tool) {
        // 1. Navigation
        if (toolInfo.tool === 'navigateTo' && toolInfo.result?.view) {
          const targetView = toolInfo.result.view as NavigationTab;
          setCurrentTab(targetView);
        }

        // 2. Voice Configuration
        if (toolInfo.tool === 'configureVoice' && toolInfo.result?.voiceConfig) {
          const newCfg = toolInfo.result.voiceConfig;
          const updatedVoiceConfig = applyAndSaveVoiceConfig(newCfg);

          if (toolInfo.result.openSettings) {
            setCurrentTab('voice_settings');
          }
          if (autoSpeak) {
            speakText(reply, updatedVoiceConfig);
          }
          return;
        }

        // 3. Hands-Free Mode Toggle via Tool
        if (toolInfo.tool === 'setContinuousConversation' && toolInfo.result) {
          const nextAutoListen = !!toolInfo.result.autoListen;
          setAutoListen(nextAutoListen);
          autoListenRef.current = nextAutoListen;
        }

        // 4. Live On-Screen Transcription Subtitles Toggle via Tool
        if (toolInfo.tool === 'setTranscriptDisplay' && toolInfo.result) {
          const nextShow = !!toolInfo.result.showTranscript;
          setShowTranscript(nextShow);
          showTranscriptRef.current = nextShow;
          try {
            localStorage.setItem('jarvis_show_transcript', String(nextShow));
          } catch (e) {}
        }

        // 5. Communications Draft
        if (toolInfo.tool === 'draftMessage' || toolInfo.tool === 'sendEmail') {
          setCurrentTab('communications');
        }
      }

      // Default Speech for standard multi-turn conversation
      if (autoSpeak) {
        speakText(reply);
      }
    } catch (err: any) {
      console.error('Error invoking J.A.R.V.I.S.:', err);
      const errMsg = "Désolé Maître, une anomalie temporaire a interrompu la liaison neuronale.";
      setLastResponse(errMsg);
      if (autoSpeak) {
        speakText(errMsg);
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [autoSpeak, speakText, applyAndSaveVoiceConfig, stopListeningSafely]);

  // Keep a ref to handleSendCommand for SpeechRecognition callbacks
  const handleSendCommandRef = useRef(handleSendCommand);
  useEffect(() => {
    handleSendCommandRef.current = handleSendCommand;
  }, [handleSendCommand]);

  // Initialize Robust Continuous Speech Recognition with Keep-Alive & Debounced Silence Detection
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let recognition: any = null;
    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Continuous listening to avoid premature cutoff
        recognition.interimResults = true;
        recognition.lang = voiceConfig.lang || 'fr-FR';

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let newlyFinalized = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newlyFinalized += chunk + ' ';
            } else {
              currentInterim += chunk;
            }
          }

          if (newlyFinalized) {
            transcriptBufferRef.current = (transcriptBufferRef.current + ' ' + newlyFinalized).trim();
          }

          const combinedTranscript = (transcriptBufferRef.current + ' ' + currentInterim).trim();
          setTranscript(combinedTranscript);

          // Reset silence timer on every new speech detection
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          // If speech content is present, wait 1400ms of complete silence before auto-dispatching
          if (combinedTranscript) {
            silenceTimerRef.current = setTimeout(() => {
              const textToSend = (transcriptBufferRef.current + ' ' + currentInterim).trim();
              if (textToSend && isListeningRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
                transcriptBufferRef.current = '';
                stopListeningSafely();
                handleSendCommandRef.current(textToSend);
              }
            }, 1400);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition status/error:', e.error);
          if (e.error === 'no-speech') {
            // Harmless browser silence timeout, maintain listening state for natural speech flow
            return;
          }
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setIsListening(false);
            isListeningRef.current = false;
            return;
          }
        };

        recognition.onend = () => {
          // Keep-Alive Loop: If listening was not deliberately stopped by user/system, auto-restart seamlessly
          if (isListeningRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
              if (isListeningRef.current && !isSpeakingRef.current && !isLoadingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (err) {
                  // Transitioning or already active
                }
              }
            }, 60);
          } else {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Could not initialize SpeechRecognition:', e);
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {}
      }
    };
  }, [voiceConfig.lang, stopListeningSafely]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setShowTextInput(false);
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      if (e.key === ' ' && currentTab === 'home') {
        e.preventDefault();
        toggleListening();
      } else if (e.key === 'Enter' || e.key === '/') {
        e.preventDefault();
        setShowTextInput(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && currentTab !== 'home') {
        setCurrentTab('home');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, toggleListening]);

  const handleClearHistory = () => {
    setChatMessages([
      {
        id: `init_${Date.now()}`,
        role: 'assistant',
        content: 'Session réinitialisée, Maître.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setLastResponse('Session réinitialisée, Maître.');
  };

  return (
    <div className="w-screen h-screen bg-[#030407] text-amber-100 flex flex-col overflow-hidden font-mono select-none relative">
      {/* Background Cosmic Deep Space Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/15 via-black to-black pointer-events-none z-0" />

      {/* Central Pure 3D Orb Stage (Permanent Background & Home State) */}
      <div 
        onClick={() => {
          if (currentTab === 'home') toggleListening();
        }}
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 z-10 ${
          currentTab === 'home' ? 'opacity-100 cursor-pointer' : 'opacity-15 pointer-events-none'
        }`}
      >
        <JarvisOrb3D isSpeaking={isSpeaking} isListening={isListening} />
      </div>

      {/* Discrete Corner Controls (Google Workspace, Hands-Free Auto-Listen, Sound, Mute, Text Mode) */}
      <div className="absolute top-5 right-5 z-40 flex items-center space-x-2">
        <button
          onClick={() => setIsGoogleAuditOpen(true)}
          className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md transition-all ${
            hasGoogleToken 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60' 
              : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 animate-pulse'
          }`}
          title="Diagnostic & Audit Google Workspace (Drive, Docs, Sheets, Gmail)"
        >
          <span className={`w-2 h-2 rounded-full ${hasGoogleToken ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
          <span className="hidden sm:inline">
            {hasGoogleToken ? (googleUserEmail ? googleUserEmail.split('@')[0] : 'GOOGLE ACTIF') : 'GOOGLE (AUDIT)'}
          </span>
          <span className="sm:hidden">
            {hasGoogleToken ? 'GOOGLE' : 'AUDIT'}
          </span>
        </button>

        {/* Hands-Free Quick-Toggle in Header */}
        <button
          onClick={() => setAutoListen(!autoListen)}
          className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md transition-all ${
            autoListen 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60' 
              : 'bg-black/40 border-zinc-700/50 text-zinc-400 hover:border-amber-400 hover:text-amber-300'
          }`}
          title={autoListen ? "Mode Mains-Libres ACTIF : Réouverture automatique du micro. Cliquez pour désactiver." : "Mode Manuel ACTIF : Cliquez pour activer la reprise automatique d'écoute."}
        >
          <Radio className={`w-3.5 h-3.5 ${autoListen ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="hidden md:inline">{autoListen ? 'MAINS-LIBRES : ON' : 'MAINS-LIBRES : OFF'}</span>
        </button>

        {/* Live Transcription On-Screen Quick-Toggle in Header */}
        <button
          onClick={() => {
            const nextState = !showTranscript;
            setShowTranscript(nextState);
            showTranscriptRef.current = nextState;
            try {
              localStorage.setItem('jarvis_show_transcript', String(nextState));
            } catch (e) {}
          }}
          className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md transition-all ${
            showTranscript 
              ? 'bg-sky-950/70 border-sky-400 text-sky-300 hover:bg-sky-900/70 shadow-[0_0_15px_rgba(56,189,248,0.25)]' 
              : 'bg-black/40 border-zinc-700/50 text-zinc-400 hover:border-sky-400/50 hover:text-sky-300'
          }`}
          title={
            showTranscript 
              ? "Transcription à l'écran ACTIVE : Paroles et sous-titres visibles. Cliquez pour masquer." 
              : "Transcription MASQUÉE : Écran épuré. Cliquez pour afficher la transcription et les sous-titres."
          }
        >
          {showTranscript ? <Captions className="w-3.5 h-3.5 text-sky-400" /> : <CaptionsOff className="w-3.5 h-3.5 text-zinc-500" />}
          <span className="hidden md:inline">{showTranscript ? 'SOUS-TITRES : ON' : 'SOUS-TITRES : OFF'}</span>
        </button>

        <button
          onClick={() => {
            const nextState = !soundEnabled;
            setSoundEnabled(nextState);
            if (!nextState) stopNeuralVoice();
          }}
          className="p-2.5 rounded-full bg-black/40 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:border-amber-400 transition-all backdrop-blur-md"
          title={soundEnabled ? "Couper le son" : "Activer la voix"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
        </button>

        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className={`p-2.5 rounded-full border transition-all backdrop-blur-md ${
            showTextInput 
              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
              : 'bg-black/40 border-amber-500/20 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20'
          }`}
          title="Mode clavier / directive écrite"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Discrete Top Left Status Indicator with Active Voice Badge */}
      <div className="absolute top-5 left-5 z-40 flex items-center space-x-3 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-amber-400 animate-ping' : isListening ? 'bg-sky-400 animate-ping' : 'bg-amber-500/60'}`} />
          <span className="text-[10px] text-amber-500/70 tracking-[0.25em] font-bold">J.A.R.V.I.S.</span>
        </div>

        {voiceConfig.profile && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 uppercase font-mono tracking-wider">
            {voiceConfig.profile}
          </span>
        )}
      </div>

      {/* Discrete Top Center Floating Spaces Launcher */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40">
        <NavigationLauncher currentTab={currentTab} onNavigate={setCurrentTab} />
      </div>

      {/* Main Viewport Content */}
      {currentTab === 'home' ? (
        /* Pure Minimalist Screen: Subtitle Transcript and Mic Pulsar */
        <div className="flex-1 flex flex-col justify-end items-center pb-12 px-6 z-20 pointer-events-none">
          {/* Evanescent Speech / Dialogue Line (Controlled by showTranscript) */}
          {showTranscript && (
            <div className="w-full max-w-2xl text-center space-y-3 pointer-events-auto transition-all duration-300 mb-4">
              {/* Live speech recognition transcription */}
              {isListening && transcript && (
                <div className="text-sm font-sans text-sky-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] animate-pulse">
                  « {transcript} »
                </div>
              )}

              {/* Response Subtitle */}
              {!isListening && (
                <div className="inline-block px-6 py-3 rounded-2xl bg-black/50 border border-amber-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all">
                  <div className="text-sm font-sans text-amber-100/90 leading-relaxed tracking-wide">
                    {(() => {
                      try {
                        const parsed = JSON.parse(lastResponse);
                        return (
                          <div className="space-y-1">
                            {parsed.summary && <div className="font-bold text-amber-200">{parsed.summary}</div>}
                            {parsed.result && <div className="text-zinc-300">{parsed.result}</div>}
                          </div>
                        );
                      } catch (e) {
                        return lastResponse;
                      }
                    })()}
                  </div>
                  {isLoading && (
                    <span className="inline-block mt-1 text-[10px] text-amber-400 animate-pulse font-mono tracking-widest">
                      ● CALCUL NEURONAL EN COURS...
                    </span>
                  )}
                  {/* Inline Google Workspace Quick Action if unauthenticated */}
                  {!hasGoogleToken && (
                    <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-center">
                      <button
                        onClick={handleQuickConnectGoogle}
                        disabled={isConnectingGoogle}
                        className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>{isConnectingGoogle ? 'Connexion en cours...' : 'Connecter Google Workspace (Drive, Docs, Sheets)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Minimalist Central Mic Touch Target, Hands-Free Pill Switch & Pulsar */}
          <div className="flex flex-col items-center space-y-3 pointer-events-auto">
            {/* Quick Controls Pill Row: Hands-Free and Subtitles Toggle */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setAutoListen(!autoListen)}
                className={`px-3.5 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center space-x-2 backdrop-blur-xl transition-all shadow-md ${
                  autoListen
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-zinc-950/80 border-zinc-700/60 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300 hover:bg-zinc-900/80'
                }`}
                title={
                  autoListen
                    ? "Mode Mains-Libres ACTIF : J.A.R.V.I.S. réouvre le micro automatiquement après chaque réponse. Cliquez pour passer en mode manuel."
                    : "Mode Manuel ACTIF : Nécessite de cliquer sur le micro ou d'appuyer sur Espace pour parler. Cliquez pour activer le mode mains-libres."
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoListen ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                <span>{autoListen ? '⚡ MAINS-LIBRES : ACTIF' : '🎙️ MANUEL'}</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !showTranscript;
                  setShowTranscript(nextState);
                  showTranscriptRef.current = nextState;
                  try {
                    localStorage.setItem('jarvis_show_transcript', String(nextState));
                  } catch (e) {}
                }}
                className={`px-3 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center space-x-1.5 backdrop-blur-xl transition-all shadow-md ${
                  showTranscript
                    ? 'bg-sky-950/80 border-sky-400/60 text-sky-300 hover:bg-sky-900/80 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'bg-zinc-950/80 border-zinc-700/60 text-zinc-400 hover:border-sky-500/40 hover:text-sky-300 hover:bg-zinc-900/80'
                }`}
                title={
                  showTranscript
                    ? "Sous-titres & Transcription VISIBLES. Cliquez pour masquer."
                    : "Sous-titres MASQUÉS. Cliquez pour afficher la transcription en direct."
                }
              >
                {showTranscript ? <Captions className="w-3.5 h-3.5 text-sky-400" /> : <CaptionsOff className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{showTranscript ? '💬 SOUS-TITRES : ON' : '💬 SOUS-TITRES : OFF'}</span>
              </button>
            </div>

            {/* Central Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-4 rounded-full border transition-all duration-300 relative group ${
                isListening
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.6)] scale-110'
                  : isSpeaking
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.6)] scale-105'
                  : 'bg-black/60 border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20 hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              }`}
              title={
                isListening
                  ? "Microphone ouvert : J.A.R.V.I.S. écoute. Cliquez pour couper l'écoute."
                  : isSpeaking
                  ? "J.A.R.V.I.S. parle. Cliquez pour interrompre."
                  : "Cliquer pour parler ou appuyer sur Espace"
              }
            >
              {isListening ? (
                <Mic className="w-6 h-6 animate-pulse text-sky-400" />
              ) : isSpeaking ? (
                <Volume2 className="w-6 h-6 animate-pulse text-amber-400" />
              ) : (
                <Mic className="w-6 h-6 group-hover:text-amber-300" />
              )}
            </button>
            
            <div className="text-center">
              <span className={`text-[10px] tracking-widest uppercase font-mono font-bold ${
                isListening 
                  ? 'text-sky-300 animate-pulse' 
                  : isSpeaking 
                  ? 'text-amber-300 animate-pulse' 
                  : 'text-amber-500/50'
              }`}>
                {isListening 
                  ? '● ÉCOUTE ACTIVE — PARLEZ LIBREMENT' 
                  : isSpeaking 
                  ? '● J.A.R.V.I.S. PARLE...' 
                  : autoListen 
                  ? 'CLIQUEZ OU PARLEZ (MAINS-LIBRES PRÊT)' 
                  : 'CLIQUEZ OU ESPACE POUR PARLER'}
              </span>
            </div>
          </div>

          {/* Optional Sleek Translucent Input Bar (Revealed on demand or Enter) */}
          {showTextInput && (
            <div className="w-full max-w-xl mt-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textInput.trim()) {
                    handleSendCommand(textInput);
                    setShowTextInput(false);
                  }
                }}
                className="flex items-center space-x-2 bg-black/80 border border-amber-500/40 rounded-full px-4 py-2 shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Tapez votre directive (ex: 'Mets la voix Friday', 'Quelle heure est-il ?')..."
                  className="flex-1 bg-transparent text-xs text-amber-100 placeholder-zinc-500 focus:outline-none font-mono"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() || isLoading}
                  className="p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Floating Holographic View Overlay (Opened strictly on user request) */
        <div className="flex-1 flex flex-col p-4 md:p-8 z-30 overflow-y-auto">
          <div className="max-w-5xl w-full mx-auto bg-black/90 border border-amber-500/40 rounded-2xl p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(245,158,11,0.15)] relative animate-in fade-in zoom-in-95 duration-200 flex flex-col space-y-6">
            {/* Holographic Header with Navigation Shortcuts & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 gap-3">
              <button
                onClick={() => setCurrentTab('home')}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-2 transition-all group shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>RETOUR À L'ORBE (HOME)</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
                {[
                  { id: 'computer_use', label: 'COMPUTER USE' },
                  { id: 'system', label: 'SYSTEM' },
                  { id: 'tasks', label: 'TASKS' },
                  { id: 'memory', label: 'MEMORY' },
                  { id: 'capabilities', label: 'CAPABILITIES' },
                  { id: 'integrations', label: 'INTEGRATIONS' },
                  { id: 'activity', label: 'ACTIVITY' },
                  { id: 'settings', label: 'SETTINGS' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id as NavigationTab)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      currentTab === item.id || (item.id === 'system' && currentTab === 'monitoring') || (item.id === 'activity' && currentTab === 'agent')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-amber-200 hover:bg-zinc-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Render 8 Core Spaces + Auxiliary Views */}
            {currentTab === 'computer_use' && <ComputerUseView />}
            {(currentTab === 'system' || currentTab === 'monitoring') && <SystemMonitoringView />}
            {currentTab === 'tasks' && <TasksView />}
            {(currentTab === 'memory' || currentTab === 'history') && <MemoryBankView />}
            {currentTab === 'capabilities' && <CapabilitiesView onNavigate={setCurrentTab} />}
            {currentTab === 'integrations' && <IntegrationsView />}
            {(currentTab === 'activity' || currentTab === 'agent') && <ActivityLogsView />}
            {currentTab === 'settings' && (
              <SettingsView
                onNavigate={setCurrentTab}
                autoSpeak={autoSpeak}
                onToggleAutoSpeak={setAutoSpeak}
                autoListen={autoListen}
                onToggleAutoListen={setAutoListen}
                showTranscript={showTranscript}
                onToggleShowTranscript={setShowTranscript}
                voiceConfig={voiceConfig}
                onUpdateVoiceConfig={applyAndSaveVoiceConfig}
              />
            )}
            {currentTab === 'voice_settings' && (
              <VoiceSettingsView
                voiceConfig={voiceConfig}
                onUpdateConfig={applyAndSaveVoiceConfig}
                autoListen={autoListen}
                onToggleAutoListen={setAutoListen}
                showTranscript={showTranscript}
                onToggleShowTranscript={setShowTranscript}
                onClose={() => setCurrentTab('home')}
              />
            )}
            {currentTab === 'communications' && <CommunicationsView onClose={() => setCurrentTab('home')} />}
            {currentTab === 'computer' && <ComputerControlView />}
            {currentTab === 'security' && <SecurityView onKillSwitch={() => {}} />}
            {currentTab === 'vision' && <VisionView />}
            {currentTab === 'files' && <FileManagementView />}
          </div>
        </div>
      )}

      {/* Google Workspace Audit Modal */}
      <GoogleWorkspaceAuditModal
        isOpen={isGoogleAuditOpen}
        onClose={() => setIsGoogleAuditOpen(false)}
        onAuthSuccess={() => {
          const stored = getStoredGoogleUser();
          setGoogleUserEmail(stored.email);
          setHasGoogleToken(stored.hasToken);
        }}
      />
    </div>
  );
}
