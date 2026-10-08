/**
 * ZippyTechSystems Pvt. Ltd. — Chatbot Client API
 * Domain: https://zippysoftwares.in
 */

/**
 * Generate or retrieve a persistent session UUID from localStorage
 */
export function getOrCreateSessionId() {
  const KEY = 'zippy_chat_session_id';
  let sessionId = localStorage.getItem(KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem(KEY, sessionId);
  }
  return sessionId;
}

/**
 * Reset chat session in localStorage
 */
export function resetChatSession() {
  const KEY = 'zippy_chat_session_id';
  const newSessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  localStorage.setItem(KEY, newSessionId);
  return newSessionId;
}

/**
 * Send messages to Hostinger PHP chat API (/api/chat.php)
 */
export async function sendChatMessage({
  sessionId,
  messages,
  pageUrl,
  channel = 'text',
  fallbackWhatsApp = '916302690251'
}) {
  // 1. Offline detection
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      reply: 'You appear to be offline right now. Please check your internet connection or tap the WhatsApp button below to message founder Lingaswamy directly!',
      whatsapp_url: `https://wa.me/${fallbackWhatsApp}?text=${encodeURIComponent(
        'Hi Lingaswamy, I am offline on your website and would like to ask a question.'
      )}`,
      offline: true
    };
  }

  const endpoint = '/api/chat.php';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        session_id: sessionId,
        channel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        page_url: pageUrl || (typeof window !== 'undefined' ? window.location.pathname : '')
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`chat api returned ${response.status}:`, errText);
      return {
        reply:
          'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized assistance!',
        whatsapp_url: `https://wa.me/${fallbackWhatsApp}?text=${encodeURIComponent(
          'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote.'
        )}`,
        fallback: true
      };
    }

    const data = await response.json();
    return {
      reply: data.reply || 'How else can I help you today?',
      whatsapp_url:
        data.whatsapp_url ||
        `https://wa.me/${fallbackWhatsApp}?text=${encodeURIComponent(
          'Hi Lingaswamy, I would like to ask about your services.'
        )}`,
      rate_limited: Boolean(data.rate_limited),
      daily_capped: Boolean(data.daily_capped),
      disabled: Boolean(data.disabled)
    };
  } catch (err) {
    console.warn('chat api network invocation error:', err);
    return {
      reply:
        'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized assistance!',
      whatsapp_url: `https://wa.me/${fallbackWhatsApp}?text=${encodeURIComponent(
        'Hi Lingaswamy, I was on your website and would like to ask a question.'
      )}`,
      fallback: true
    };
  }
}
