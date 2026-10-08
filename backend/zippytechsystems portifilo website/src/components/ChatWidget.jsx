import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getOrCreateSessionId, resetChatSession, sendChatMessage } from '../lib/chatApi';
import { speakText, stopSpeechPlayback } from '../lib/ttsApi';
import '../styles/chatbot.css';

/**
 * Safely render message text with support for bold formatting and simple lists without raw HTML injection
 */
function SafeMessageContent({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="zippy-bubble-content">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} style={{ height: '6px' }} />;
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^[-•]\s*/, '');
          return (
            <div key={lineIdx} style={{ display: 'flex', gap: '6px', margin: '3px 0' }}>
              <span style={{ color: '#ffe500' }}>•</span>
              <span>{formatBoldSpans(itemText)}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} style={{ margin: '0 0 4px 0' }}>
            {formatBoldSpans(line)}
          </p>
        );
      })}
    </div>
  );
}

function formatBoldSpans(str) {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: '#ffffff', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatWidget() {
  const { chatbotSettings, settingsData } = useData() || {};

  // If chatbot is disabled in settings, hide widget completely
  if (chatbotSettings && chatbotSettings.enabled === false) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(getOrCreateSessionId());
  const [activeWhatsAppUrl, setActiveWhatsAppUrl] = useState('');

  // Voice Agent State
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingBot, setIsSpeakingBot] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState(
    () => localStorage.getItem('zippy_voice_lang') || chatbotSettings?.voiceDefaultLang || 'en-IN'
  );
  const [voiceRate, setVoiceRate] = useState(
    () => Number(localStorage.getItem('zippy_voice_rate')) || 1.0
  );
  const [isMuted, setIsMuted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [handsFree, setHandsFree] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSpeakingBotRef = useRef(false);
  isSpeakingBotRef.current = isSpeakingBot;

  const rawWa = settingsData?.whatsappNumber || '6302690251';
  const cleanWa = String(rawWa).replace(/[^0-9]/g, '');
  const activeWa = cleanWa.startsWith('91') ? cleanWa : `91${cleanWa}`;

  const defaultWelcome =
    chatbotSettings?.welcomeMessage ||
    'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?';

  // Check SpeechRecognition browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceSupported(false);
      }
    }
  }, []);

  // Load session & history
  useEffect(() => {
    const currentSession = getOrCreateSessionId();
    setSessionId(currentSession);

    const savedHistory = localStorage.getItem(`zippy_chat_${currentSession}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        // Fallback
      }
    }

    const initialWelcome = [
      {
        role: 'assistant',
        content: defaultWelcome,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initialWelcome);
    localStorage.setItem(`zippy_chat_${currentSession}`, JSON.stringify(initialWelcome));
  }, [defaultWelcome]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isVoiceMode, voiceTranscript]);

  // Handle Voice Mode Initialization & Spoken Greeting
  const handleOpenVoiceMode = () => {
    const consent = localStorage.getItem('zippy_voice_consent');
    if (!consent) {
      setShowPrivacyModal(true);
      return;
    }

    setIsOpen(true);
    setIsVoiceMode(true);
    triggerVoiceGreeting();
  };

  const handleConsentAllow = () => {
    localStorage.setItem('zippy_voice_consent', 'true');
    setShowPrivacyModal(false);
    setIsOpen(true);
    setIsVoiceMode(true);
    triggerVoiceGreeting();
  };

  const triggerVoiceGreeting = () => {
    const greetedSession = sessionStorage.getItem(`zippy_voice_greeted_${sessionId}`);
    if (!greetedSession) {
      sessionStorage.setItem(`zippy_voice_greeted_${sessionId}`, 'true');

      let greetingText =
        'Hello! I am the ZippyTechSystems AI assistant. Which language do you prefer? English, Telugu, or Hindi?';
      if (voiceLang.startsWith('te')) {
        greetingText =
          'నమస్కారం! నేను జిప్పీటెక్ సిస్టమ్స్ AI అసిస్టెంట్‌ని. మీరు ఏ భాషలో మాట్లాడాలనుకుంటున్నారు? తెలుగు, ఇంగ్లీష్, లేదా హిందీ?';
      } else if (voiceLang.startsWith('hi')) {
        greetingText =
          'नमस्ते! मैं ज़िप्पीटेक सिस्टम्स AI असिस्टेंट हूँ। आप किस भाषा में बात करना पसंद करेंगे? अंग्रेज़ी, तेलुगु या हिंदी?';
      }

      const greetMsg = {
        role: 'assistant',
        content: greetingText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, greetMsg]);

      if (!isMuted) {
        setIsSpeakingBot(true);
        speakText({
          text: greetingText,
          lang: voiceLang,
          rate: voiceRate,
          sessionId,
          onStart: () => setIsSpeakingBot(true),
          onEnd: () => {
            setIsSpeakingBot(false);
            if (handsFree) startListening();
          },
          onError: () => {
            setIsSpeakingBot(false);
            if (handsFree) startListening();
          }
        });
      } else if (handsFree) {
        startListening();
      }
    } else if (handsFree) {
      startListening();
    }
  };

  // Start Speech Recognition with Barge-in capability
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    // If bot is currently speaking, barge-in stops the bot immediately
    if (isSpeakingBotRef.current) {
      stopSpeechPlayback();
      setIsSpeakingBot(false);
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onspeechstart = () => {
        // BARGE-IN: User started speaking while assistant was talking
        if (isSpeakingBotRef.current) {
          stopSpeechPlayback();
          setIsSpeakingBot(false);
        }
      };

      recognition.onresult = (event) => {
        // BARGE-IN safeguard
        if (isSpeakingBotRef.current) {
          stopSpeechPlayback();
          setIsSpeakingBot(false);
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setVoiceTranscript(currentText);

        if (final) {
          recognition.stop();
          handleSendVoiceMessage(final.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  };

  // Close / Switch cleanup
  const handleClose = () => {
    stopSpeechPlayback();
    stopListening();
    setIsSpeakingBot(false);
    setIsOpen(false);
  };

  // Send voice message
  const handleSendVoiceMessage = async (transcriptText) => {
    if (!transcriptText || isTyping) return;
    setVoiceTranscript('');

    const userMsg = {
      role: 'user',
      content: transcriptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`zippy_chat_${sessionId}`, JSON.stringify(updatedMessages));

    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        sessionId,
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        channel: 'voice',
        fallbackWhatsApp: activeWa
      });

      const assistantMsg = {
        role: 'assistant',
        content: response.reply,
        whatsapp_url: response.whatsapp_url || fallbackHandoffUrl,
        showWhatsAppButton: Boolean(response.whatsapp_url) || /whatsapp|contact|phone|call|touch/i.test(response.reply || ''),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      localStorage.setItem(`zippy_chat_${sessionId}`, JSON.stringify(finalMessages));

      if (response.whatsapp_url) {
        setActiveWhatsAppUrl(response.whatsapp_url);
      }

      // Speak reply aloud via Edge Function TTS (female voice) with fallback
      if (!isMuted && isVoiceMode) {
        setIsSpeakingBot(true);
        speakText({
          text: response.reply,
          lang: voiceLang,
          rate: voiceRate,
          sessionId,
          onStart: () => setIsSpeakingBot(true),
          onEnd: () => {
            setIsSpeakingBot(false);
            if (handsFree) {
              setTimeout(() => startListening(), 400);
            }
          },
          onError: () => {
            setIsSpeakingBot(false);
            if (handsFree) {
              setTimeout(() => startListening(), 400);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Voice send failed:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Send regular text message
  const handleSend = async (messageText) => {
    const textToSend = String(messageText || inputMessage).trim();
    if (!textToSend || isTyping) return;

    setInputMessage('');

    const userMsg = {
      role: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`zippy_chat_${sessionId}`, JSON.stringify(updatedMessages));

    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        sessionId,
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        channel: 'text',
        fallbackWhatsApp: activeWa
      });

      const isContactOrHandoff =
        Boolean(response.whatsapp_url) ||
        /whatsapp|contact|phone|call|touch|lingaswamy/i.test(response.reply || '');

      const assistantMsg = {
        role: 'assistant',
        content: response.reply,
        whatsapp_url: response.whatsapp_url || fallbackHandoffUrl,
        showWhatsAppButton: isContactOrHandoff,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      localStorage.setItem(`zippy_chat_${sessionId}`, JSON.stringify(finalMessages));

      if (response.whatsapp_url) {
        setActiveWhatsAppUrl(response.whatsapp_url);
      }
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick replies
  const quickReplies = Array.isArray(chatbotSettings?.quickReplies) && chatbotSettings.quickReplies.length > 0
    ? chatbotSettings.quickReplies
    : [
        'Website services',
        'App for my shop',
        'AI chatbot / WhatsApp automation',
        'Prices',
        'Talk to Lingaswamy'
      ];

  const fallbackHandoffUrl =
    activeWhatsAppUrl ||
    `https://wa.me/${activeWa}?text=${encodeURIComponent(
      'Hi Lingaswamy, I visited ZippyTechSystems and would like to talk with you.'
    )}`;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING LAUNCHERS (Bottom-Left: Opposite of WhatsApp button) */}
      {/* ========================================================================= */}
      <div className="zippy-floating-triggers" role="region" aria-label="Customer AI Assistant Controls">
        {/* Voice Trigger (Stacked Directly Above Chatbot) */}
        {voiceSupported && (
          <div className="zippy-trigger-wrapper">
            <button
              className={`zippy-voice-launcher ${isVoiceMode && isOpen ? 'zippy-voice-launcher-active' : ''}`}
              onClick={handleOpenVoiceMode}
              aria-label="Talk to us with voice"
            >
              <Mic size={20} />
              <span className="zippy-voice-tooltip">Talk to us</span>
            </button>
          </div>
        )}

        {/* Text Chat Launcher */}
        <div className="zippy-trigger-wrapper">
          {!isOpen && (
            <div className="zippy-chatbot-tooltip" aria-hidden="true">
              Ask AI Assistant
            </div>
          )}

          <button
            className="zippy-chatbot-launcher"
            onClick={() => {
              if (isOpen) {
                handleClose();
              } else {
                setIsOpen(true);
                setIsVoiceMode(false);
              }
            }}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close AI Chat Assistant' : 'Open AI Chat Assistant'}
          >
            <span className="zippy-launcher-badge" aria-hidden="true" />
            {isOpen ? <X size={26} /> : <Bot size={28} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ONE-TIME VOICE PRIVACY CONSENT MODAL */}
      {/* ========================================================================= */}
      {showPrivacyModal && (
        <div className="zippy-consent-backdrop" role="dialog" aria-modal="true" aria-labelledby="zippy-consent-title">
          <div className="zippy-consent-modal">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={22} color="#1d5cf0" />
              <h3 id="zippy-consent-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                ZippyTechSystems Voice Assistant
              </h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '16px' }}>
              Our AI voice assistant uses your browser’s speech recognition to transcribe what you say. 
              <strong> No raw audio is recorded or stored on our servers</strong>; only the text transcript of the conversation is saved to help us assist you.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
              See our{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                Privacy Policy
              </a>
              . You can switch to typing anytime.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={() => setShowPrivacyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600 }}
                onClick={handleConsentAllow}
              >
                Allow &amp; Talk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CHAT & VOICE WINDOW */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          className={`zippy-chat-window ${isVoiceMode ? 'zippy-voice-window' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="zippy-chat-title"
        >
          {/* Header */}
          <div className="zippy-chat-header">
            <div className="zippy-chat-header-info">
              <div className="zippy-chat-avatar" aria-hidden="true">
                {isVoiceMode ? <Mic size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <h2 id="zippy-chat-title" className="zippy-chat-title">
                  {isVoiceMode ? 'AI Voice Assistant' : 'ZippyTechSystems AI'}
                </h2>
                <div className="zippy-chat-status">
                  <span className="zippy-status-dot" aria-hidden="true" />
                  <span>
                    {isVoiceMode
                      ? isSpeakingBot
                        ? 'Speaking (Female Voice)...'
                        : isListening
                        ? 'Listening to you...'
                        : 'Voice Mode Active'
                      : 'Live Enquiry Bot'}
                  </span>
                </div>
              </div>
            </div>

            <div className="zippy-chat-header-actions">
              {/* Mode Switcher */}
              <button
                className="zippy-chat-header-btn"
                onClick={() => {
                  stopSpeechPlayback();
                  stopListening();
                  setIsSpeakingBot(false);
                  setIsVoiceMode(!isVoiceMode);
                  if (!isVoiceMode) {
                    triggerVoiceGreeting();
                  }
                }}
                title={isVoiceMode ? 'Switch to text typing' : 'Switch to voice mode'}
                aria-label={isVoiceMode ? 'Switch to text typing' : 'Switch to voice mode'}
              >
                {isVoiceMode ? <MessageSquare size={16} /> : <Mic size={16} />}
              </button>

              <button
                className="zippy-chat-header-btn"
                onClick={() => {
                  stopSpeechPlayback();
                  stopListening();
                  setIsSpeakingBot(false);
                  const newSession = resetChatSession();
                  setSessionId(newSession);
                  const freshMessages = [
                    {
                      role: 'assistant',
                      content: defaultWelcome,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ];
                  setMessages(freshMessages);
                  localStorage.setItem(`zippy_chat_${newSession}`, JSON.stringify(freshMessages));
                  setActiveWhatsAppUrl('');
                }}
                title="Start a new conversation"
                aria-label="New chat"
              >
                <RotateCcw size={16} />
              </button>

              <button
                className="zippy-chat-header-btn"
                onClick={handleClose}
                title="Close assistant"
                aria-label="Close assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* VOICE MODE ACTIVE BAR & CONTROLS */}
          {/* ===================================================================== */}
          {isVoiceMode && (
            <div className="zippy-voice-dashboard">
              {/* Language Selector Chips */}
              <div className="zippy-voice-lang-bar">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '4px' }}>Language:</span>
                {[
                  { code: 'en-IN', label: 'English' },
                  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
                  { code: 'hi-IN', label: 'हिंदी (Hindi)' }
                ].map((item) => (
                  <button
                    key={item.code}
                    className={`zippy-voice-lang-btn ${voiceLang === item.code ? 'active' : ''}`}
                    onClick={() => {
                      setVoiceLang(item.code);
                      localStorage.setItem('zippy_voice_lang', item.code);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Central Voice Waves & Interactive Mic */}
              <div className="zippy-voice-centerpiece">
                <div
                  className={`zippy-voice-pulse-ring ${
                    isListening ? 'listening' : isSpeakingBot ? 'speaking' : ''
                  }`}
                >
                  <button
                    className={`zippy-voice-main-mic ${isListening ? 'mic-on' : ''}`}
                    onClick={() => {
                      if (isSpeakingBot) {
                        // Barge in on tap
                        stopSpeechPlayback();
                        setIsSpeakingBot(false);
                        startListening();
                      } else if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                      }
                    }}
                    aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                  >
                    {isSpeakingBot ? <Square size={26} color="#ffe500" /> : isListening ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>
                </div>

                <div className="zippy-voice-caption">
                  {isSpeakingBot
                    ? 'AI is speaking... (tap or speak to interrupt)'
                    : isListening
                    ? voiceTranscript || 'Listening... Please speak now.'
                    : 'Tap the mic to talk'}
                </div>
              </div>

              {/* Voice Speed, Mute & Hands-free Controls */}
              <div className="zippy-voice-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="zippy-voice-tool-btn"
                    onClick={() => {
                      if (isSpeakingBot) stopSpeechPlayback();
                      setIsMuted(!isMuted);
                    }}
                    title={isMuted ? 'Unmute voice replies' : 'Mute voice replies'}
                  >
                    {isMuted ? <VolumeX size={15} color="#ef4444" /> : <Volume2 size={15} color="#12a150" />}
                    <span>{isMuted ? 'Muted' : 'Sound On'}</span>
                  </button>

                  <button
                    type="button"
                    className={`zippy-voice-tool-btn ${handsFree ? 'active' : ''}`}
                    onClick={() => setHandsFree(!handsFree)}
                    title="Hands-free auto listen after bot finishes speaking"
                  >
                    <span>Hands-free: {handsFree ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Speed selector (0.8x - 1.2x) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Speed:</span>
                  {[0.8, 1.0, 1.2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`zippy-speed-pill ${voiceRate === spd ? 'active' : ''}`}
                      onClick={() => {
                        setVoiceRate(spd);
                        localStorage.setItem('zippy_voice_rate', spd.toString());
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="zippy-chat-messages" role="log" aria-live="polite">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`zippy-message zippy-message-${msg.role}`}
              >
                <div className="zippy-bubble">
                  <SafeMessageContent text={msg.content} />
                  {msg.role === 'assistant' &&
                    (msg.showWhatsAppButton ||
                      (msg.content &&
                        /whatsapp|contact|phone|call|lingaswamy/i.test(msg.content))) && (
                      <a
                        href={msg.whatsapp_url || fallbackHandoffUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zippy-msg-whatsapp-btn"
                        aria-label="Chat on WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span>Chat on WhatsApp</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                </div>
                <span className="zippy-message-time">{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="zippy-message zippy-message-assistant">
                <div className="zippy-typing-bubble" aria-label="Assistant is typing">
                  <span className="zippy-dot" />
                  <span className="zippy-dot" />
                  <span className="zippy-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips (Only in Text Mode) */}
          {!isVoiceMode && (
            <div className="zippy-quick-replies-area" aria-label="Suggested questions">
              {quickReplies.map((chip, idx) => (
                <button
                  key={idx}
                  className="zippy-chip-btn"
                  onClick={() => handleSend(chip)}
                  disabled={isTyping}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Persistent WhatsApp Handoff Bar */}
          <div className="zippy-whatsapp-handoff-bar">
            <span className="zippy-whatsapp-handoff-text">
              <MessageCircle size={14} />
              <span>Direct Founder Support:</span>
            </span>
            <a
              href={fallbackHandoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="zippy-whatsapp-handoff-btn"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Input Bar */}
          <div className="zippy-chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="zippy-chat-input"
              placeholder={isVoiceMode ? 'Or type here anytime...' : 'Ask about Web, Apps, or AI...'}
              value={inputMessage}
              maxLength={1000}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              aria-label="Type your message"
            />
            <button
              className="zippy-chat-send-btn"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="zippy-chat-privacy">
            Voice &amp; chats are saved to assist you. See our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      )}
    </>
  );
}
