export interface TtsRequestOptions {
  text: string;
  engine?: 'auto' | 'elevenlabs' | 'openai' | 'local_bridge' | 'browser';
  voicePreset?: 'jarvis' | 'friday' | 'edith' | 'tony';
  stability?: number;
  pitch?: number;
  rate?: number;
  lang?: string;
}

export interface TtsResponse {
  success: boolean;
  provider: 'elevenlabs' | 'openai' | 'local_bridge' | 'fallback_browser';
  audioBase64?: string;
  contentType?: string;
  message?: string;
  voiceName?: string;
  error?: string;
}

// Default ElevenLabs Voice IDs
// 'JBFqnCBsd6RMkjVDRZzb' = George (British, warm, articulate gentleman - true Jarvis archetype)
// 'pNInz6obpgDQGcFmaJgB' = Adam (Deep, resonant, calm masculine)
// 'onwK4e9ZLuTAKqWW03F9' = Daniel (Authoritative, refined)
// 'EXAVITQu4vr4xnSDxMaL' = Bella (Soothing, clear feminine - Friday archetype)
// '21m00Tcm4TlvDq8ikWAM' = Rachel (Calm, poise - Edith archetype)
const ELEVENLABS_VOICES = {
  jarvis: 'JBFqnCBsd6RMkjVDRZzb', // George - Refined, calm British/French gentleman (Jarvis)
  jarvis_deep: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep resonant
  friday: 'EXAVITQu4vr4xnSDxMaL', // Bella - Soothing feminine (Friday)
  edith: '21m00Tcm4TlvDq8ikWAM',  // Rachel - Strategic, tactical (Edith)
  tony: 'VR6AewLTigWG4xSOukaG',   // Arnold - Confident, energetic (Stark)
};

// Default OpenAI Voice mappings
const OPENAI_VOICES = {
  jarvis: 'onyx', // Deep, authoritative masculine
  friday: 'nova',  // Warm, calm feminine
  edith: 'alloy',  // Neutral, tactical
  tony: 'echo',    // Confident, expressive
};

export async function synthesizeNeuralSpeech(options: TtsRequestOptions): Promise<TtsResponse> {
  const { 
    text, 
    engine = 'auto', 
    voicePreset = 'jarvis',
    stability = 0.75 
  } = options;

  if (!text || !text.trim()) {
    return { success: false, provider: 'fallback_browser', error: 'Texte vide fourni.' };
  }

  // 1. ElevenLabs Engine - Disabled for 100% local operation
  // const elevenLabsKey = process.env.ELEVENLABS_API_KEY || 'sk_8ff7a39d568e30fcb754d7baf4ad4e945f7bc154d7c31074';
  // if ((engine === 'elevenlabs' || engine === 'auto') && elevenLabsKey) {
  //   try {
  //     // ... existing code ...
  //   } catch (err: any) {
  //     console.warn('[TTS] ElevenLabs synthesis failed:', err.message);
  //   }
  // }

  // 2. OpenAI TTS Engine - Disabled for 100% local operation
  // const openAiKey = process.env.OPENAI_API_KEY;
  // if ((engine === 'openai' || engine === 'auto') && openAiKey) {
  //   try {
  //     // ... existing code ...
  //   } catch (err: any) {
  //     console.warn('[TTS] OpenAI TTS failed:', err.message);
  //   }
  // }

  // 3. Check Local Mac Bridge Neural Engine (Kokoro / Piper on localhost:8765)
  if (engine === 'local_bridge' || engine === 'auto') {
    try {
      const bridgeUrl = process.env.MAC_BRIDGE_URL || 'http://127.0.0.1:8765';
      const bridgeToken = process.env.MAC_BRIDGE_TOKEN || 'jarvis-secure-mac-token-2026';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${bridgeUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeToken}`,
        },
        body: JSON.stringify({ text, voice: voicePreset }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          return {
            success: true,
            provider: 'local_bridge',
            audioBase64: data.audioBase64.startsWith('data:') ? data.audioBase64 : `data:audio/wav;base64,${data.audioBase64}`,
            contentType: 'audio/wav',
            voiceName: 'Local Mac Neural Engine (Kokoro/Piper)',
          };
        }
      }
    } catch (e) {
      // Local daemon offline
    }
  }

  // 4. Default: Return fallback flag so client uses Web Audio DSP Enhanced pipeline
  return {
    success: true,
    provider: 'fallback_browser',
    message: 'Synthèse via processeur DSP Web Audio HD et modulateur prosodique.',
    voiceName: 'Web Speech DSP Enhanced (Acoustique Jarvis)',
  };
}
