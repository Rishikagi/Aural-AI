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
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
    }

    // Check Speech Synthesis support
    if (window.speechSynthesis) {
      setSpeechSupported(true);
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current.getVoices();
        setVoices(availableVoices);
        // Prefer a natural English voice
        const preferred = availableVoices.find(v =>
          v.name.includes('Google') && v.lang.startsWith('en')
        ) || availableVoices.find(v =>
          v.lang.startsWith('en') && !v.name.includes('Compact')
        ) || availableVoices[0];
        setSelectedVoice(preferred);
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!synthRef.current || !text) return;

    // Stop any current speech
    synthRef.current.cancel();

    // Clean text for speech (remove markdown, special chars)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/[[\]{}]/g, '')
      .trim();

    utteranceRef.current = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current.voice = selectedVoice;
    utteranceRef.current.rate = 0.95;
    utteranceRef.current.pitch = 1.0;
    utteranceRef.current.volume = 1.0;

    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utteranceRef.current.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    // Workaround for Chrome bug where speech stops after ~15 seconds
    const keepAlive = setInterval(() => {
      if (synthRef.current.speaking) {
        synthRef.current.pause();
        synthRef.current.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    synthRef.current.speak(utteranceRef.current);
  }, [selectedVoice]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const startListening = useCallback((onResult) => {
    if (!recognitionRef.current) return;

    setTranscript('');
    setInterimTranscript('');

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(prev => prev + final);
        setInterimTranscript('');
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      const finalText = recognitionRef.current._finalText || '';
      if (onResult && finalText) onResult(finalText);
    };

    // Accumulate final text
    recognitionRef.current._finalText = '';
    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          recognitionRef.current._finalText += t + ' ';
          setTranscript(recognitionRef.current._finalText);
        } else {
          interim += t;
        }
      }
      setInterimTranscript(interim);
    };

    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    if (recognitionRef.current) recognitionRef.current._finalText = '';
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
  };
}
