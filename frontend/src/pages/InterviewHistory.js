import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { interviewsAPI } from '../utils/api';

const TOPIC_COLORS = {
  javascript: '#f6ad55', react: '#63b3ed', nodejs: '#68d391',
  mongodb: '#68d391', 'system-design': '#b794f4',
  behavioral: '#fc8181', dsa: '#f6ad55', typescript: '#63b3ed', css: '#fc8181',
};

const sc = (s) => !s ? 'var(--text-muted)' : s >= 7 ? 'var(--green)' : s >= 5 ? 'var(--amber)' : 'var(--red)';
const fmt = (s) => s >= 3600 ? `${(s/3600).toFixed(1)}h` : s >= 60 ? `${Math.floor(s/60)}m` : `${s}s`;

// Inline sparkline SVG
function ScoreSparkline({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
      Complete more interviews to see your trend
    </div>
  );
  const W = 520, H = 80, PAD = 12;
  const scores = data.map(d => d.finalScore);
  const min = Math.max(0, Math.min(...scores) - 1);
  const max = Math.min(10, Math.max(...scores) + 0.5);
  const xStep = (W - PAD * 2) / (data.length - 1);
  const yScale = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const points = data.map((d, i) => [PAD + i * xStep, yScale(d.finalScore)]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${points[points.length-1][0]},${H} L${PAD},${H} Z`;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#63b3ed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#63b3ed" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* avg line */}
      <line x1={PAD} y1={yScale(avg)} x2={W - PAD} y2={yScale(avg)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 3" />
      {/* area */}
      <path d={area} fill="url(#sg)" />
      {/* line */}
      <path d={path} fill="none" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#63b3ed" stroke="#161820" strokeWidth="2">
          <title>{data[i].topic} — {data[i].finalScore}/10 · {new Date(data[i].completedAt).toLocaleDateString()}</title>
        </circle>
      ))}
      {/* y-axis labels */}
      {[min, avg, max].map((v, i) => (
        <text key={i} x={W - PAD + 4} y={yScale(v) + 4} fontSize="9" fill="var(--text-muted)" textAnchor="start">
          {v.toFixed(1)}
        </text>
      ))}
    </svg>
  );
}

// Horizontal bar for topic breakdown
function TopicBar({ topic, count, avgScore, bestScore }) {
  const color = TOPIC_COLORS[topic] || 'var(--accent)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize', flexShrink: 0 }}>{topic}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(avgScore / 10) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ width: 40, fontSize: 12, fontWeight: 600, color, textAlign: 'right', flexShrink: 0 }}>{avgScore?.toFixed(1) || '—'}</div>
      <div style={{ width: 22, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{count}×</div>
    </div>
  );
}

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [byTopic, setByTopic] = useState([]);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // list | analytics

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        interviewsAPI.getHistory({ page, limit: 10, topic: filterTopic || undefined, status: filterStatus || undefined }),
        interviewsAPI.getStats(),
      ]);
      setInterviews(histRes.data.interviews || []);
      setTotal(histRes.data.total || 0);
      setTotalPages(histRes.data.pages || 1);
      setStats(statsRes.data.stats || {});
      setByTopic(statsRes.data.byTopic || []);
      setScoreTrend(statsRes.data.scoreTrend || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterTopic, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(1); }, [filterTopic, filterStatus]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this interview session?')) return;
    setDeletingId(id);
    try {
      await interviewsAPI.delete(id);
      setInterviews(prev => prev.filter(iv => iv._id !== id));
      setTotal(t => t - 1);
    } catch (err) {
      alert('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const statCards = [
    { label: 'Total Sessions', value: stats?.totalInterviews ?? 0, color: 'var(--accent)' },
    { label: 'Average Score', value: stats?.avgScore != null ? `${stats.avgScore.toFixed(1)}/10` : '—', color: 'var(--green)' },
    { label: 'Best Score', value: stats?.bestScore > 0 ? `${stats.bestScore}/10` : '—', color: 'var(--purple)' },
    { label: 'Time Practiced', value: stats?.totalDuration ? fmt(stats.totalDuration) : '0m', color: 'var(--amber)' },
  ];

  const uniqueTopics = [...new Set(interviews.map(iv => iv.topic).filter(Boolean))];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 920, margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Interview History</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {total} session{total !== 1 ? 's' : ''} · track your progress over time
          </p>
        </div>
        <Link to="/interview" className="btn btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>+ New Interview</Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content', border: '0.5px solid var(--border)' }}>
        {['list', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            border: activeTab === tab ? '0.5px solid var(--border)' : 'none',
            textTransform: 'capitalize', transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} style={{ width: 'auto', minWidth: 140, fontSize: 13 }}>
              <option value="">All Topics</option>
              {['javascript','react','nodejs','mongodb','system-design','behavioral','dsa'].map(t =>
                <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
              )}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 130, fontSize: 13 }}>
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
            {(filterTopic || filterStatus) && (
              <button className="btn btn-ghost" onClick={() => { setFilterTopic(''); setFilterStatus(''); }} style={{ fontSize: 12 }}>Clear ✕</button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading sessions...
            </div>
          ) : interviews.length === 0 ? (
            <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>◎</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                {filterTopic || filterStatus ? 'No sessions match your filters.' : 'No interviews yet.'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>Start practicing to see your history here.</p>
              <Link to="/interview" className="btn btn-primary" style={{ padding: '10px 24px' }}>Start your first interview →</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {interviews.map(iv => (
                  <div key={iv._id} onClick={() => navigate(`/result/${iv._id}`)}
                    className="card"
                    style={{ padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s, transform 0.12s', cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Mode icon */}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${TOPIC_COLORS[iv.topic] || 'var(--accent)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `0.5px solid ${TOPIC_COLORS[iv.topic] || 'var(--accent)'}33` }}>
                      {iv.mode === 'voice' ? '🎙' : '⌨'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{iv.topic}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 7px', borderRadius: 10 }}>{iv.company || 'General'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 7px', borderRadius: 10 }}>{iv.difficulty || 'Mixed'}</span>
                        <span style={{
                          fontSize: 11, padding: '1px 7px', borderRadius: 10,
                          background: iv.status === 'completed' ? 'var(--green-dim)' : 'var(--amber-dim)',
                          color: iv.status === 'completed' ? 'var(--green)' : 'var(--amber)',
                        }}>{iv.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(iv.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {iv.questionCount ? ` · ${iv.questionCount} questions` : ''}
                        {iv.duration ? ` · ${fmt(iv.duration)}` : ''}
                        {iv.mode === 'voice' ? ' · Voice' : ' · Text'}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {iv.finalScore > 0 ? (
                        <>
                          <div style={{ fontSize: 22, fontWeight: 700, color: sc(iv.finalScore), lineHeight: 1 }}>{iv.finalScore}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 10</div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, iv._id)}
                      disabled={deletingId === iv._id}
                      style={{
                        width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', color: 'var(--text-muted)', fontSize: 13, flexShrink: 0,
                        border: '0.5px solid transparent', transition: 'all 0.15s', opacity: deletingId === iv._id ? 0.4 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(252,129,129,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}
                      title="Delete session"
                    >
                      {deletingId === iv._id ? '…' : '✕'}
                    </button>

                    <div style={{ color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ fontSize: 13, padding: '7px 14px' }}>← Prev</button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = page <= 3 ? i + 1 : page + i - 2;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button key={p} onClick={() => setPage(p)} style={{
                          width: 32, height: 32, borderRadius: 8, fontSize: 13, cursor: 'pointer',
                          background: p === page ? 'var(--accent)' : 'transparent',
                          color: p === page ? '#0a0b0f' : 'var(--text-secondary)',
                          border: p === page ? 'none' : '0.5px solid var(--border)',
                          fontWeight: p === page ? 600 : 400,
                        }}>{p}</button>
                      );
                    })}
                  </div>
                  <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ fontSize: 13, padding: '7px 14px' }}>Next →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score trend chart */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Score Trend</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your last {scoreTrend.length} scored sessions</div>
              </div>
              {scoreTrend.length > 0 && stats?.avgScore && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: sc(stats.avgScore) }}>{stats.avgScore.toFixed(1)}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/10</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>average</div>
                </div>
              )}
            </div>
            <ScoreSparkline data={scoreTrend} />
          </div>

          {/* Topic breakdown */}
          {byTopic.length > 0 && (
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Performance by Topic</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Average score across completed sessions</div>
              {byTopic.map(t => (
                <TopicBar key={t._id} topic={t._id} count={t.count} avgScore={t.avgScore} bestScore={t.bestScore} />
              ))}
            </div>
          )}

          {/* Summary grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Completed', value: stats?.totalInterviews || 0, sub: 'interviews' },
              { label: 'Questions answered', value: stats?.totalQuestions || 0, sub: 'total' },
              { label: 'Topics covered', value: byTopic.length, sub: 'distinct' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {byTopic.length === 0 && !loading && (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete scored interviews to see analytics here.</p>
              <Link to="/interview" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex', padding: '9px 22px' }}>Start an interview →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
