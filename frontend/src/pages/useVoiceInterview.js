import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceInterview() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const isListeningRef = useRef(false);
  const finalTextRef = useRef('');   // ✅ always holds latest transcript — never stale
  const interimTextRef = useRef(''); // ✅ holds interim un-finalized text

  useEffect(() => {
    // ── Speech Recognition ────────────────────────────────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // keep alive until manually stopped
      recognition.interimResults = true;   // show words live as they arrive
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙 Recognition started');
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event) => {
        let interim = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinal += text + ' ';
          } else {
            interim += text;
          }
        }

        if (newFinal) {
          finalTextRef.current += newFinal;          // ✅ update ref immediately
          setTranscript(finalTextRef.current);       // also update state for display
        }
        interimTextRef.current = interim; // ✅ save interim so we don't lose it if stopped early
        setInterimTranscript(interim);
        
        // Removed DOM mutation of iv-text-input to prevent React control fight
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        // no-speech and network errors are non-fatal — keep going
        if (event.error === 'no-speech' || event.error === 'network') return;
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        console.log('🎙 Recognition ended — isListening:', isListeningRef.current);
        if (isListeningRef.current) {
          // Still supposed to be listening — restart (handles Chrome auto-stop)
          try { recognition.start(); } catch (e) { console.warn('Restart error:', e); }
        } else {
          // Intentionally stopped
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognitionRef.current = recognition;
    }

    // ── Speech Synthesis ──────────────────────────────────
    if (window.speechSynthesis) {
      setSpeechSupported(true);
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const available = synthRef.current.getVoices();
        setVoices(available);
        const preferred =
          available.find(v => v.name === 'Google US English') ||
          available.find(v => v.name.includes('Google') && v.lang === 'en-US') ||
          available.find(v => v.lang === 'en-US' && !v.name.includes('Compact')) ||
          available.find(v => v.lang.startsWith('en')) ||
          available[0];
        setSelectedVoice(preferred);
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch (e) {}
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // ── speak ────────────────────────────────────────────────
  const speak = useCallback((text, onEnd) => {
    if (!synthRef.current || !text) { if (onEnd) onEnd(); return; }

    synthRef.current.cancel();

    // Clean markdown/symbols for natural speech
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/[[\]{}*_]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.voice = selectedVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); if (onEnd) onEnd(); };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e.error);
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    // Chrome bug: speech stops silently after ~15s — pause/resume keeps it alive
    const keepAlive = setInterval(() => {
      if (synthRef.current?.speaking) {
        synthRef.current.pause();
        synthRef.current.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    synthRef.current.speak(utterance);
  }, [selectedVoice]);

  // ── stopSpeaking ─────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) { synthRef.current.cancel(); setIsSpeaking(false); }
  }, []);

  // ── startListening ───────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTextRef.current = '';           // reset accumulated text
    setTranscript('');
    setInterimTranscript('');
    isListeningRef.current = true;
    try { recognitionRef.current.start(); } catch (e) { console.warn('Start error:', e); }
  }, []);

  // ── stopListening ────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = false;     // prevent auto-restart in onend
    try { recognitionRef.current.stop(); } catch (e) { console.warn('Stop error:', e); }
  }, []);

  // ── resetTranscript ──────────────────────────────────────
  const resetTranscript = useCallback(() => {
    finalTextRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    const inputEl = document.getElementById('iv-text-input');
    if (inputEl) inputEl.value = '';
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceSupported,
    speechSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    finalTextRef,    // ✅ exposed so VoiceInterview.js can read it directly
    interimTextRef,  // ✅ exposed to read incomplete unfinalized voice input
  };
}
