import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { aiAPI } from '../utils/api';
import { useVoiceInterview } from '../hooks/useVoiceInterview';

const TOPICS = [
  { id: 'javascript', label: 'JavaScript', color: '#f6ad55', icon: 'JS' },
  { id: 'react', label: 'React', color: '#63b3ed', icon: '⚛' },
  { id: 'nodejs', label: 'Node.js', color: '#68d391', icon: '⬡' },
  { id: 'mongodb', label: 'MongoDB', color: '#68d391', icon: 'M' },
  { id: 'system-design', label: 'System Design', color: '#b794f4', icon: '◈' },
  { id: 'behavioral', label: 'Behavioral', color: '#fc8181', icon: '◉' },
  { id: 'dsa', label: 'DSA', color: '#f6ad55', icon: '∑' },
];

const COMPANIES = ['General', 'Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'Stripe', 'Uber'];
const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState({
    topic: searchParams.get('topic') || 'javascript',
    company: 'General',
    difficulty: 'Mixed',
    mode: 'voice',
  });
  const topic = TOPICS.find(t => t.id === config.topic) || TOPICS[0];

  return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 24px' }} className="fade-up">
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: topic.color + '18', border: `0.5px solid ${topic.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: topic.color, margin: '0 auto 16px' }}>{topic.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Configure Your Interview</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>A senior engineer will interview you via voice in real-time</p>
      </div>
      <div className="card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Topic</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setConfig(c => ({ ...c, topic: t.id }))} style={{
                padding: '8px 4px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500,
                background: config.topic === t.id ? t.color + '18' : 'var(--bg-hover)',
                color: config.topic === t.id ? t.color : 'var(--text-secondary)',
                border: `0.5px solid ${config.topic === t.id ? t.color + '44' : 'var(--border)'}`,
                transition: 'all 0.15s', cursor: 'pointer',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Target Company</label>
            <select value={config.company} onChange={e => setConfig(c => ({ ...c, company: e.target.value }))}>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Difficulty</label>
            <select value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Interview Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'voice', label: '🎙 Voice', desc: 'Speak your answers' },
              { id: 'text', label: '⌨ Text', desc: 'Type your answers' },
            ].map(m => (
              <button key={m.id} onClick={() => setConfig(c => ({ ...c, mode: m.id }))} style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                background: config.mode === m.id ? 'var(--accent-dim)' : 'var(--bg-hover)',
                border: `0.5px solid ${config.mode === m.id ? 'var(--border-accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: config.mode === m.id ? 'var(--accent)' : 'var(--text-primary)' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--accent-glow)', border: '0.5px solid var(--border-accent)', borderRadius: 'var(--radius-md)', fontSize: 12.5, color: 'var(--accent)', lineHeight: 1.6 }}>
          💡 The AI interviewer will ask 5 real questions, give live feedback on each answer, and deliver a final evaluation with score and hire recommendation.
        </div>
        <button className="btn btn-primary" onClick={() => onStart(config)} style={{ padding: '13px', fontSize: 15 }}>
          Start Interview →
        </button>
      </div>
    </div>
  );
}

// ── Interview Room ────────────────────────────────────────────────────────────
function InterviewRoom({ config, onComplete }) {
  const {
    isListening, isSpeaking, transcript, interimTranscript,
    speechSupported, speak, stopSpeaking,
    startListening, stopListening, resetTranscript,
    finalTextRef,   // ✅ direct ref — never stale
  } = useVoiceInterview();

  const navigate = useNavigate();
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('starting');
  const [isComplete, setIsComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const statusRef = useRef('starting');     // ✅ always current status in callbacks
  const interviewIdRef = useRef(null);      // ✅ always current id in callbacks
  const speechFallbackRef = useRef(null);   // ✅ safety net for stuck speech synthesis

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { interviewIdRef.current = interviewId; }, [interviewId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() =>
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── speakWithFallback ─────────────────────────────────────────────────────
  // Windows Chrome bug: speechSynthesis.onend sometimes never fires.
  // This guarantees the mic unlocks after a safe timeout regardless.
  const speakWithFallback = useCallback((text, onDone) => {
    if (speechFallbackRef.current) clearTimeout(speechFallbackRef.current);

    const words = (text || '').split(' ').length;
    const fallbackMs = Math.max(5000, (words / 130) * 60000 + 4000);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (speechFallbackRef.current) clearTimeout(speechFallbackRef.current);
      if (onDone) onDone();
    };

    // Safety net — always unlocks even if onend never fires
    speechFallbackRef.current = setTimeout(() => {
      console.warn('⚠️ Speech fallback fired — unlocking mic');
      finish();
    }, fallbackMs);

    speak(text, finish);
  }, [speak]);

  // ── Start interview ───────────────────────────────────────────────────────
  useEffect(() => {
    const start = async () => {
      try {
        setStatus('starting');
        const res = await aiAPI.startInterview(config);
        const id = res.data.interviewId;
        const msg = res.data.message;
        setInterviewId(id);
        interviewIdRef.current = id;
        setMessages([{ role: 'interviewer', content: msg }]);
        if (config.mode === 'voice' && speechSupported) {
          setStatus('speaking');
          speakWithFallback(msg, () => setStatus('waiting'));
        } else {
          setStatus('waiting');
        }
      } catch (err) {
        setError('Failed to start interview. Please check your connection and try again.');
        setStatus('waiting');
      }
    };
    start();
    return () => { if (speechFallbackRef.current) clearTimeout(speechFallbackRef.current); };
  }, []); // eslint-disable-line

  // ── sendAnswer ────────────────────────────────────────────────────────────
  const sendAnswer = useCallback(async (answer) => {
    const trimmed = (answer || '').trim();
    if (!trimmed || !interviewIdRef.current || statusRef.current === 'thinking') return;

    setStatus('thinking');
    setMessages(prev => [...prev, { role: 'candidate', content: trimmed }]);
    resetTranscript();
    setInputText('');
    setQuestionCount(c => c + 1);

    try {
      const res = await aiAPI.sendMessage(interviewIdRef.current, trimmed);
      const aiMsg = res.data.message;
      setMessages(prev => [...prev, { role: 'interviewer', content: aiMsg }]);

      if (res.data.isComplete) {
        setIsComplete(true);
        setStatus('complete');
        clearInterval(timerRef.current);
        if (speechFallbackRef.current) clearTimeout(speechFallbackRef.current);
        if (config.mode === 'voice' && speechSupported) speakWithFallback(aiMsg, () => {});
      } else {
        if (config.mode === 'voice' && speechSupported) {
          setStatus('speaking');
          speakWithFallback(aiMsg, () => setStatus('waiting'));
        } else {
          setStatus('waiting');
        }
      }
    } catch (err) {
      setStatus('waiting');
      setError('Failed to send. Please try again.');
    }
  }, [resetTranscript, config.mode, speechSupported, speakWithFallback]);

  // ── handleVoiceAnswer ─────────────────────────────────────────────────────
  const handleVoiceAnswer = useCallback(() => {
    // Clicking mic while AI speaks → interrupt immediately
    if (isSpeaking || statusRef.current === 'speaking') {
      stopSpeaking();
      if (speechFallbackRef.current) clearTimeout(speechFallbackRef.current);
      setStatus('waiting');
      return;
    }

    if (statusRef.current === 'thinking' || statusRef.current === 'starting') return;

    if (isListening) {
      // ── STOP: send captured speech ──
      stopListening();
      setTimeout(() => {
        // ✅ Read from ref — guaranteed latest, no stale closure
        const text = (finalTextRef.current || '').trim();
        console.log('📤 Voice answer:', `"${text}"`);
        if (text) {
          sendAnswer(text);
          resetTranscript();
          setInputText('');
        } else {
          setStatus('waiting');
          setError('Nothing captured. Click the mic, speak clearly, then click ■ stop.');
          setTimeout(() => setError(''), 3500);
        }
      }, 900); // 900ms lets recognition finalize last word
    } else {
      // ── START: begin recording ──
      setStatus('listening');
      resetTranscript();
      setInputText('');
      startListening();
    }
  }, [
    isListening, isSpeaking, finalTextRef,
    stopSpeaking, stopListening, startListening,
    resetTranscript, sendAnswer,
  ]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const topic = TOPICS.find(t => t.id === config.topic) || TOPICS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '14px 28px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: topic.color + '18', border: `0.5px solid ${topic.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: topic.color, flexShrink: 0 }}>{topic.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{topic.label} Interview · {config.company}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Question {Math.min(questionCount + 1, 5)} of 5 · {formatTime(duration)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'listening' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(252,129,129,0.1)', border: '0.5px solid rgba(252,129,129,0.3)', borderRadius: 20 }}>
              <div className="voice-bars"><span /><span /><span /><span /><span /></div>
              <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>Recording</span>
            </div>
          )}
          {status === 'speaking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--accent-dim)', border: '0.5px solid var(--border-accent)', borderRadius: 20 }}>
              <div className="voice-bars"><span style={{ background: 'var(--accent)' }} /><span style={{ background: 'var(--accent)' }} /><span style={{ background: 'var(--accent)' }} /><span style={{ background: 'var(--accent)' }} /><span style={{ background: 'var(--accent)' }} /></div>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Interviewer speaking</span>
            </div>
          )}
          {status === 'thinking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--bg-hover)', border: '0.5px solid var(--border)', borderRadius: 20 }}>
              <div style={{ width: 14, height: 14, border: '1.5px solid var(--border-hover)', borderTop: '1.5px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thinking...</span>
            </div>
          )}
        </div>
        {!isComplete && (
          <button onClick={() => { clearInterval(timerRef.current); onComplete(interviewId); }} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: 'var(--text-muted)' }}>
            End interview
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--bg-hover)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: topic.color, width: `${(Math.min(questionCount, 5) / 5) * 100}%`, transition: 'width 0.5s ease' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {status === 'starting' && messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTop: `2px solid ${topic.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connecting to your interviewer...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'candidate' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease forwards' }}>
            {msg.role === 'interviewer' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #63b3ed, #b794f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0a0b0f', flexShrink: 0, marginRight: 10, alignSelf: 'flex-end' }}>AI</div>
            )}
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'candidate' ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `0.5px solid ${msg.role === 'candidate' ? 'var(--border-accent)' : 'var(--border)'}`,
              borderRadius: msg.role === 'candidate' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '12px 16px', fontSize: 14, lineHeight: 1.65,
              color: msg.role === 'candidate' ? 'var(--accent)' : 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
              {msg.role === 'interviewer' && i === messages.length - 1 && isSpeaking && (
                <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s ${j * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live transcript bubble */}
        {isListening && (interimTranscript || transcript) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ maxWidth: '75%', background: 'rgba(99,179,237,0.05)', border: '0.5px dashed var(--border-accent)', borderRadius: '14px 14px 4px 14px', padding: '12px 16px', fontSize: 14, color: 'var(--accent)', opacity: 0.75, lineHeight: 1.65 }}>
              {transcript}{interimTranscript && <span style={{ opacity: 0.5 }}>{interimTranscript}</span>}
              <span style={{ marginLeft: 4, animation: 'pulse 1s ease-in-out infinite', display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', verticalAlign: 'middle', borderRadius: 1 }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--red-dim)', border: '0.5px solid rgba(252,129,129,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)' }}>
            {error} <button onClick={() => setError('')} style={{ color: 'var(--red)', marginLeft: 8, fontSize: 11 }}>✕</button>
          </div>
        )}

        {isComplete && (
          <div style={{ textAlign: 'center', padding: '20px', margin: '10px 0' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/result/${interviewId}`)} style={{ padding: '12px 32px', fontSize: 15 }}>
              View Full Results →
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isComplete && (
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
          {config.mode === 'voice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {/* Mic button */}
              <div style={{ position: 'relative' }}>
                {isListening && (
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid var(--red)', opacity: 0.4, animation: 'ripple 1.5s ease-out infinite' }} />
                )}
                <button
                  onClick={handleVoiceAnswer}
                  disabled={status === 'thinking'}
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: isListening ? 'var(--red)' : (status === 'waiting' || status === 'speaking') ? 'var(--accent)' : 'var(--bg-card)',
                    border: `2px solid ${isListening ? 'var(--red)' : (status === 'waiting' || status === 'speaking') ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, cursor: status === 'thinking' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: status === 'thinking' ? 0.4 : 1,
                    transform: isListening ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {isListening ? '■' : '🎙'}
                </button>
              </div>

              {/* Status label */}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', minHeight: 18 }}>
                {isListening ? '🔴 Recording... click ■ when done'
                  : status === 'speaking' ? '🔊 AI speaking — click 🎙 to interrupt and answer'
                  : status === 'thinking' ? '⏳ Processing your answer...'
                  : status === 'waiting' ? '🎙 Tap mic to speak your answer'
                  : '⏳ Connecting...'}
              </p>

              {/* Text fallback */}
              <div style={{ width: '100%', display: 'flex', gap: 8 }}>
                <input
                  id="iv-text-input"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && inputText.trim() && status !== 'thinking') sendAnswer(inputText); }}
                  placeholder="Or type your answer and press Enter..."
                  style={{ fontSize: 13 }}
                  disabled={status === 'thinking'}
                />
                <button className="btn btn-ghost" onClick={() => inputText.trim() && sendAnswer(inputText)} disabled={!inputText.trim() || status === 'thinking'} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && inputText.trim()) sendAnswer(inputText); }}
                placeholder="Type your answer... (Ctrl+Enter to send)"
                rows={3}
                style={{ flex: 1, resize: 'none', fontSize: 14 }}
                disabled={status === 'thinking'}
              />
              <button className="btn btn-primary" onClick={() => sendAnswer(inputText)} disabled={!inputText.trim() || status === 'thinking'} style={{ alignSelf: 'flex-end', padding: '10px 18px' }}>
                {status === 'thinking' ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function VoiceInterview() {
  const [phase, setPhase] = useState('setup');
  const [config, setConfig] = useState(null);
  const navigate = useNavigate();

  const handleStart = (cfg) => { setConfig(cfg); setPhase('interview'); };
  const handleComplete = (interviewId) => {
    if (interviewId) navigate(`/result/${interviewId}`);
    else navigate('/history');
  };

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />;
  return <InterviewRoom config={config} onComplete={handleComplete} />;
}
