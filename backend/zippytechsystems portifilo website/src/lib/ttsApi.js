import { supabase, isSupabaseConfigured } from './supabase';

const clientAudioCache = new Map();
let currentAudioInstance = null;
let currentUtteranceInstance = null;

/**
 * Stop any ongoing speech playback immediately (for barge-in or stop button)
 */
export function stopSpeechPlayback() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {
      // Ignore audio interruption error
    }
    currentAudioInstance = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore speech cancellation error
    }
    currentUtteranceInstance = null;
  }
}

/**
 * Play synthesized voice using Edge Function tts-api with device female fallback
 * 
 * @param {Object} options
 * @param {string} options.text - Text to speak (max 500 chars)
 * @param {string} options.lang - Language code ('en-IN' | 'te-IN' | 'hi-IN')
 * @param {number} options.rate - Speaking rate (0.8 to 1.2)
 * @param {string} options.sessionId - Active chat session ID
 * @param {Function} options.onStart - Callback when audio begins
 * @param {Function} options.onEnd - Callback when audio finishes
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<boolean>}
 */
export async function speakText({
  text,
  lang = 'en-IN',
  rate = 1.0,
  sessionId = 'anon',
  onStart = () => {},
  onEnd = () => {},
  onError = () => {}
}) {
  const cleanText = String(text || '').trim().slice(0, 500);
  if (!cleanText) return false;

  // Stop any previous playing audio before starting new one
  stopSpeechPlayback();

  const cacheKey = `${lang}_${rate}_${cleanText.toLowerCase()}`;

  // 1. Check client-side audio cache
  if (clientAudioCache.has(cacheKey)) {
    const cachedBase64 = clientAudioCache.get(cacheKey);
    return playBase64Audio(cachedBase64, onStart, onEnd, onError);
  }

  // 2. Try Supabase Edge Function tts-api (Azure Neural TTS / Provider)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cdrwrbmabcyhxngvyrxh.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_G1oB1splS3Wb92LbNZ90pA_NAxOUXpC';

  try {
    const ttsEndpoint = `${supabaseUrl}/functions/v1/tts-api`;
    const response = await fetch(ttsEndpoint, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        lang,
        rate,
        session_id: sessionId
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.audio_base64) {
        clientAudioCache.set(cacheKey, data.audio_base64);
        return playBase64Audio(data.audio_base64, onStart, onEnd, onError);
      }
    }
  } catch (err) {
    console.warn('tts-api network call failed; falling back to device speech synthesis:', err);
  }

  // 3. Fallback: Browser speechSynthesis with preferred female voice
  return speakWithBrowserTTS({
    text: cleanText,
    lang,
    rate,
    onStart,
    onEnd,
    onError
  });
}

function playBase64Audio(audioBase64, onStart, onEnd, onError) {
  try {
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
    const audio = new Audio(audioUrl);
    currentAudioInstance = audio;

    audio.onplay = () => onStart();
    audio.onended = () => {
      currentAudioInstance = null;
      onEnd();
    };
    audio.onerror = (e) => {
      currentAudioInstance = null;
      onError(e);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // User gesture error or autoplay policy
        console.warn('Audio play catch:', err);
        currentAudioInstance = null;
        onError(err);
      });
    }
    return true;
  } catch (e) {
    onError(e);
    return false;
  }
}

function speakWithBrowserTTS({ text, lang, rate, onStart, onEnd, onError }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError(new Error('Browser speech synthesis is not supported.'));
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceInstance = utterance;

    utterance.rate = Math.max(0.8, Math.min(1.2, rate));
    utterance.lang = lang;

    // Pick best matching female voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split('-')[0].toLowerCase();

    // 1. Priority: female voice matching exact lang
    let matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix) &&
        /female|woman|neerja|shruti|swara|zira|heera|google/i.test(v.name)
    );

    // 2. Secondary: any voice matching exact lang
    if (!matchedVoice) {
      matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
      );
    }

    // 3. Fallback: Indian English female or generic female
    if (!matchedVoice) {
      matchedVoice = voices.find(
        (v) =>
          /en-in|india/i.test(v.lang) ||
          /female|woman|zira/i.test(v.name)
      );
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => onStart();
    utterance.onend = () => {
      currentUtteranceInstance = null;
      onEnd();
    };
    utterance.onerror = (e) => {
      currentUtteranceInstance = null;
      onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    onError(err);
    return false;
  }
}
