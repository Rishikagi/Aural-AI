import React, { useState, useEffect, useCallback } from 'react';
import { questionsAPI, aiAPI } from '../utils/api';

const TOPICS = ['javascript', 'react', 'nodejs', 'mongodb', 'system-design', 'behavioral', 'dsa', 'typescript', 'css'];
const COMPANIES = ['Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'Stripe', 'Uber', 'Airbnb', 'Apple'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function QuestionCard({ q, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const diffStyle = {
    Easy: 'tag-easy', Medium: 'tag-medium', Hard: 'tag-hard'
  }[q.difficulty];

  const handleFeedback = async () => {
    if (!answer.trim()) return;
    setLoadingFeedback(true);
    try {
      const res = await aiAPI.getFeedback({ question: q.question, answer, topic: q.topic });
      setFeedback(res.data.feedback);
    } catch { setFeedback('Could not get feedback right now. Please try again.'); }
    finally { setLoadingFeedback(false); }
  };

  return (
    <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge ${diffStyle}`}>{q.difficulty}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize' }}>{q.topic}</span>
          {q.companies?.slice(0, 2).map(c => (
            <span key={c} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10, border: '0.5px solid var(--border)' }}>{c}</span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{q.frequency}</span>
          <span style={{ fontSize: 12, color: expanded ? 'var(--accent)' : 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q.question}</p>
      </div>

      {expanded && (
        <div style={{ borderTop: '0.5px solid var(--border)' }}>
          {/* Answer */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Model Answer</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{q.answer}</p>
            {q.codeExample && (
              <pre style={{ marginTop: 12 }}><code>{q.codeExample}</code></pre>
            )}
            {q.tips && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-glow)', border: '0.5px solid var(--border-accent)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--accent)' }}>
                💡 {q.tips}
              </div>
            )}
          </div>

          {/* AI Feedback section */}
          <div style={{ padding: '16px 20px', borderTop: '0.5px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Practice Your Answer</div>
            {!showFeedback ? (
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowFeedback(true)}>
                ✦ Get AI feedback on your answer
              </button>
            ) : (
              <div>
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here, then get AI feedback..." rows={4} style={{ marginBottom: 10, resize: 'vertical', fontSize: 13 }} />
                <button className="btn btn-primary" onClick={handleFeedback} disabled={loadingFeedback || !answer.trim()} style={{ fontSize: 13, padding: '8px 18px' }}>
                  {loadingFeedback ? 'Analyzing...' : 'Get feedback'}
                </button>
                {feedback && (
                  <div style={{ marginTop: 14, padding: '14px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ topic: '', difficulty: '', company: '', search: '' });
  const limit = 15;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await questionsAPI.getAll(params);
      setQuestions(res.data.questions);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => { setPage(1); }, [filters]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ topic: '', difficulty: '', company: '', search: '' });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Question Bank</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{total} real interview questions from top companies</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search questions..." style={{ flex: 1, minWidth: 200 }} />
        <select value={filters.topic} onChange={e => setFilter('topic', e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
        </select>
        <select value={filters.difficulty} onChange={e => setFilter('difficulty', e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
          <option value="">All Levels</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.company} onChange={e => setFilter('company', e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Companies</option>
          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost" onClick={clearFilters} style={{ fontSize: 12 }}>Clear ✕</button>
        )}
      </div>

      {/* Question list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No questions found for these filters.</div>
      ) : (
        <>
          {questions.map(q => <QuestionCard key={q._id} q={q} />)}
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ fontSize: 13 }}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '0 12px' }}>Page {page} of {Math.ceil(total / limit)}</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} style={{ fontSize: 13 }}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
