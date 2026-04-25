import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewsAPI } from '../utils/api';

export default function InterviewResult() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    interviewsAPI.getById(id).then(res => setInterview(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '80px' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!interview) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Interview not found.</p>
      <Link to="/history" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to history</Link>
    </div>
  );

  const score = interview.finalScore || 0;
  const scoreColor = score >= 8 ? 'var(--green)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--amber)' : 'var(--red)';
  const recommendation = score >= 8 ? 'Strong Hire' : score >= 6 ? 'Hire' : score >= 4 ? 'Borderline' : 'No Hire';
  const recColor = score >= 8 ? 'var(--green)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--amber)' : 'var(--red)';
  const duration = interview.duration ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s` : '—';

  const interviewerMsgs = (interview.messages || []).filter(m => m.role === 'interviewer');
  const candidateMsgs = (interview.messages || []).filter(m => m.role === 'candidate');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link to="/history" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← History</Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{interview.topic} Interview</span>
      </div>

      {/* Score card */}
      <div className="card" style={{ padding: '32px 36px', marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', borderColor: score >= 6 ? 'var(--border-accent)' : 'var(--border)' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score > 0 ? score : '—'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>out of 10</div>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: recColor + '18', color: recColor, border: `0.5px solid ${recColor}33` }}>{recommendation}</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Topic', value: interview.topic, cap: true },
              { label: 'Company', value: interview.company || 'General' },
              { label: 'Duration', value: duration },
              { label: 'Questions', value: interview.questionCount || '—' },
              { label: 'Mode', value: interview.mode },
              { label: 'Difficulty', value: interview.difficulty },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textTransform: s.cap ? 'capitalize' : 'none' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content', border: '0.5px solid var(--border)' }}>
        {['overview', 'transcript'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            border: activeTab === tab ? '0.5px solid var(--border)' : 'none',
            textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s'
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Final feedback */}
          {interview.finalFeedback && (
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Interviewer's Final Feedback</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{interview.finalFeedback}</p>
            </div>
          )}

          {/* Scores breakdown */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Score Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidateMsgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: 8, flexShrink: 0, marginTop: 2 }}>Q{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>Full Transcript</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(interview.messages || []).map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'interviewer' ? 'linear-gradient(135deg, #63b3ed, #b794f4)' : 'var(--bg-hover)',
                  border: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: msg.role === 'interviewer' ? '#0a0b0f' : 'var(--text-secondary)',
                  marginTop: 2
                }}>
                  {msg.role === 'interviewer' ? 'AI' : 'ME'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
                    {msg.role === 'interviewer' ? 'Interviewer' : 'You'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Link to="/interview" className="btn btn-primary" style={{ padding: '10px 22px' }}>Practice again →</Link>
        <Link to="/questions" className="btn btn-ghost" style={{ padding: '10px 18px' }}>Study questions</Link>
        <Link to="/history" className="btn btn-ghost" style={{ padding: '10px 18px' }}>All history</Link>
      </div>
    </div>
  );
}
