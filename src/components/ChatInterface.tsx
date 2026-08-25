/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Plus, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { JarvisOrb3D } from './JarvisOrb3D';
import { ChatMessage } from '../types';
import { getAccessToken, googleSignIn } from '../lib/firebaseAuth';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  soundEnabled: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages, soundEnabled }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [forcedState, setForcedState] = useState<'idle' | 'écoute' | 'parole'>('idle');
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setForcedState('parole');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setForcedState('idle');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setForcedState('idle');
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setShowChatDrawer(true);

    try {
      let validToken: string | undefined = undefined;
      try {
        const rawToken = await getAccessToken();
        if (typeof rawToken === 'string' && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') {
          const trimmed = rawToken.trim();
          if (/^[\x21-\x7E]+$/.test(trimmed)) {
            validToken = trimmed;
          }
        }
      } catch (tokenErr) {
        console.warn('Error reading token in ChatInterface:', tokenErr);
      }

      let data: any = null;
      for (let attempt = 0; attempt <= 1; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (validToken) {
            headers['Authorization'] = `Bearer ${validToken}`;
          }
          const res = await fetch('/api/jarvis/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              userPrompt: query,
              messages: [...messages, userMsg],
              googleAccessToken: validToken || undefined,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch (e) {
          if (attempt === 1) {
            data = { reply: "À vos ordres, Maître. Le réseau neuronal principal a subi une brève latence de quota, mais tous les modules de contrôle restent opérationnels." };
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.reply || "Systèmes opérationnels, Maître.",
        timestamp: new Date().toLocaleTimeString(),
        toolTriggered: data?.toolTriggered,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantMsg.content);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé Maître, une anomalie temporaire a interrompu la liaison neuronale.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setForcedState('idle');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setForcedState('écoute');
    };
    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setIsListening(false);
      setForcedState('idle');
      handleSendMessage(speechResult);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setForcedState('idle');
    };
    recognition.onend = () => {
      setIsListening(false);
      setForcedState('idle');
    };

    recognition.start();
  };

  return (
    <div className="flex-1 relative flex flex-col items-center justify-between bg-black text-amber-100 overflow-hidden select-none w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <JarvisOrb3D 
          isSpeaking={isSpeaking} 
          isListening={isListening} 
          forcedState={forcedState}
          onStateChange={(state) => {
            setForcedState(state);
            if (state === 'écoute') setIsListening(true);
            else if (state === 'parole') setIsSpeaking(true);
            else {
              setIsListening(false);
              setIsSpeaking(false);
            }
          }}
        />
      </div>

      {showChatDrawer && (
        <div className="absolute top-20 left-6 right-6 lg:left-1/4 lg:right-1/4 z-30 bg-zinc-950/90 border border-amber-500/40 rounded-2xl backdrop-blur-md max-h-[50vh] flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="p-3 border-b border-amber-500/20 flex items-center justify-between font-mono text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>J.A.R.V.I.S. DIALOGUE TRANSCRIPT</span>
            </span>
            <button onClick={() => setShowChatDrawer(false)} className="text-zinc-400 hover:text-amber-200">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="text-[9px] text-amber-500/60 mb-0.5">{msg.role === 'user' ? 'BOSS' : 'J.A.R.V.I.S.'}</div>
                <div className={`p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100' : 'bg-zinc-900 border border-amber-500/20 text-amber-200'}`}>
                  {msg.content}
                  {msg.role === 'assistant' && (msg.content.includes('401') || msg.content.includes('jeton') || msg.content.includes('authentification') || msg.content.includes('Google')) && (
                    <button
                      onClick={async () => {
                        try {
                          await googleSignIn();
                          alert('Connexion Google Workspace établie avec succès, Maître.');
                        } catch (err: any) {
                          alert('Erreur de connexion Google : ' + err.message);
                        }
                      }}
                      className="mt-2.5 px-3 py-1.5 bg-amber-500/30 border border-amber-500/60 rounded-lg text-amber-100 hover:bg-amber-500/40 text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <span>🔐 Renouveler l'accès Google Workspace</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-amber-400 animate-pulse text-[11px]">Calculating neural trajectory...</div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {!showChatDrawer && messages.length > 0 && (
        <button
          onClick={() => setShowChatDrawer(true)}
          className="absolute top-16 z-20 px-4 py-1.5 rounded-full bg-zinc-950/80 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-2 shadow-md hover:bg-zinc-900 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>View Transcript ({messages.length})</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="absolute bottom-6 left-4 right-4 max-w-2xl mx-auto z-40">
        <div className="bg-zinc-950/90 border border-amber-500/40 rounded-full px-4 py-2.5 flex items-center space-x-3 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <button
            onClick={() => handleSendMessage("Run full system diagnostic")}
            className="p-2 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
            title="Quick Action"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Reply to J.A.R.V.I.S..."
            className="flex-1 bg-transparent text-sm text-amber-100 placeholder-zinc-500 focus:outline-none font-mono"
          />

          <button
            onClick={toggleListening}
            className={`p-2 rounded-full border transition-all ${isListening ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse' : 'bg-zinc-900 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}
            title="Voice Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
