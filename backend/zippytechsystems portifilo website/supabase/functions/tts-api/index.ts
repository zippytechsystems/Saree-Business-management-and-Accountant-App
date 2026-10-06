import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// In-memory cache for repeated short audios (e.g. greetings, common prompts)
interface CacheEntry {
  audioBase64: string;
  contentType: string;
  timestamp: number;
}
const audioCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory rate limiting per IP / session
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || '';
  const configuredOrigins = allowedOriginsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  let allowOrigin = '*';

  if (origin) {
    const isLocalhost =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');
    const isNetlify = origin.endsWith('.netlify.app');
    const isExplicitlyAllowed = configuredOrigins.includes(origin);

    if (isLocalhost || isNetlify || isExplicitlyAllowed) {
      allowOrigin = origin;
    } else if (configuredOrigins.length > 0) {
      allowOrigin = configuredOrigins[0];
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const ttsApiKey = Deno.env.get('TTS_API_KEY');
    const provider = (Deno.env.get('TTS_PROVIDER') || 'azure').toLowerCase();
    const azureRegion = Deno.env.get('TTS_REGION') || 'centralindia';

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const {
      text = '',
      lang = 'en-IN',
      rate = 1.0,
      session_id = 'anon_session',
      voice_name = ''
    } = body;

    // 1. Input Validation: text max 500 characters
    const cleanText = String(text || '').trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (cleanText.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds maximum length of 500 characters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalized speed rate (0.8 to 1.2)
    const validRate = Math.max(0.8, Math.min(1.2, Number(rate) || 1.0));

    // 2. Rate Limiting: max 30 TTS calls per 10 minutes per IP / session
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      session_id ||
      'anon';
    const rateLimitKey = `${clientIp}_tts`;
    const now = Date.now();
    const currentLimit = requestCounts.get(rateLimitKey);

    if (currentLimit && currentLimit.resetAt > now) {
      if (currentLimit.count >= 30) {
        return new Response(
          JSON.stringify({
            error: 'TTS rate limit exceeded. Please fall back to browser voice.',
            fallback: true
          }),
          { status: 429, headers: corsHeaders }
        );
      }
      currentLimit.count++;
    } else {
      requestCounts.set(rateLimitKey, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    // 3. Resolve Voice Name (configurable, not hardcoded)
    let selectedVoice = voice_name;
    if (!selectedVoice) {
      if (provider === 'azure') {
        // High quality female voices per language
        if (lang.startsWith('te')) {
          selectedVoice = Deno.env.get('VOICE_TE') || 'te-IN-ShrutiNeural';
        } else if (lang.startsWith('hi')) {
          selectedVoice = Deno.env.get('VOICE_HI') || 'hi-IN-SwaraNeural';
        } else {
          selectedVoice = Deno.env.get('VOICE_EN') || 'en-IN-NeerjaNeural';
        }
      } else if (provider === 'google') {
        if (lang.startsWith('te')) {
          selectedVoice = 'te-IN-Standard-A';
        } else if (lang.startsWith('hi')) {
          selectedVoice = 'hi-IN-Wavenet-D';
        } else {
          selectedVoice = 'en-IN-Wavenet-D';
        }
      } else if (provider === 'elevenlabs') {
        selectedVoice = Deno.env.get('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM';
      }
    }

    // 4. Check Cache for short repeated texts (greetings, standard replies)
    const cacheKey = `${provider}_${lang}_${selectedVoice}_${validRate}_${cleanText.toLowerCase()}`;
    const cachedEntry = audioCache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({
          audio_base64: cachedEntry.audioBase64,
          content_type: cachedEntry.contentType,
          cached: true,
          voice: selectedVoice,
          provider
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // If no provider key is configured in Supabase secrets, signal client to use browser voice
    if (!ttsApiKey) {
      return new Response(
        JSON.stringify({
          fallback: true,
          message: 'TTS_API_KEY secret is not set in Supabase. Using device female voice.'
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 5. Synthesize Audio via Selected Provider
    let audioBytes: Uint8Array;
    let contentType = 'audio/mpeg';

    if (provider === 'azure') {
      // Azure Neural TTS
      const azureEndpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const prosodyRatePercent = `${Math.round((validRate - 1.0) * 100)}%`;
      const ssml = `
<speak version='1.0' xml:lang='${lang}'>
  <voice xml:lang='${lang}' name='${selectedVoice}'>
    <prosody rate='${prosodyRatePercent}'>
      ${escapeXml(cleanText)}
    </prosody>
  </voice>
</speak>`.trim();

      const azureRes = await fetch(azureEndpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': ttsApiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'ZippyTechSystemsVoiceAgent/1.0'
        },
        body: ssml
      });

      if (!azureRes.ok) {
        const errText = await azureRes.text();
        console.error(`Azure TTS error [${azureRes.status}]:`, errText);
        return new Response(
          JSON.stringify({
            fallback: true,
            error: `Azure TTS failed with status ${azureRes.status}`
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      const buffer = await azureRes.arrayBuffer();
      audioBytes = new Uint8Array(buffer);
    } else if (provider === 'google') {
      // Google Cloud TTS
      const googleEndpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`;
      const googleRes = await fetch(googleEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: cleanText },
          voice: {
            languageCode: lang,
            name: selectedVoice,
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: validRate
          }
        })
      });

      if (!googleRes.ok) {
        const errText = await googleRes.text();
        console.error(`Google TTS error [${googleRes.status}]:`, errText);
        return new Response(
          JSON.stringify({ fallback: true, error: 'Google TTS request failed' }),
          { status: 200, headers: corsHeaders }
        );
      }

      const data = await googleRes.json();
      const rawBase64 = data.audioContent;
      // Already base64 encoded
      if (audioCache.size < MAX_CACHE_SIZE) {
        audioCache.set(cacheKey, {
          audioBase64: rawBase64,
          contentType: 'audio/mpeg',
          timestamp: now
        });
      }

      return new Response(
        JSON.stringify({
          audio_base64: rawBase64,
          content_type: 'audio/mpeg',
          cached: false,
          voice: selectedVoice,
          provider: 'google'
        }),
        { status: 200, headers: corsHeaders }
      );
    } else if (provider === 'elevenlabs') {
      // ElevenLabs
      const elevenEndpoint = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`;
      const elevenRes = await fetch(elevenEndpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': ttsApiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      });

      if (!elevenRes.ok) {
        return new Response(
          JSON.stringify({ fallback: true, error: 'ElevenLabs request failed' }),
          { status: 200, headers: corsHeaders }
        );
      }

      const buffer = await elevenRes.arrayBuffer();
      audioBytes = new Uint8Array(buffer);
    } else {
      return new Response(
        JSON.stringify({ fallback: true, error: `Unsupported provider: ${provider}` }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Convert audio to base64
    let binary = '';
    const len = audioBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(audioBytes[i]);
    }
    const audioBase64 = btoa(binary);

    // Save to Cache
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, {
      audioBase64,
      contentType,
      timestamp: now
    });

    return new Response(
      JSON.stringify({
        audio_base64: audioBase64,
        content_type: contentType,
        cached: false,
        voice: selectedVoice,
        provider
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('TTS Edge Function runtime exception:', err);
    return new Response(
      JSON.stringify({
        fallback: true,
        error: 'TTS generation encountered a server error. Using browser speech synthesis.'
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
