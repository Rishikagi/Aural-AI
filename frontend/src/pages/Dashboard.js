import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewsAPI, questionsAPI } from '../utils/api';

const TOPICS = [
  { id: 'javascript', label: 'JavaScript', color: '#f6ad55', icon: 'JS' },
  { id: 'react', label: 'React', color: '#63b3ed', icon: '⚛' },
  { id: 'nodejs', label: 'Node.js', color: '#68d391', icon: '⬡' },
  { id: 'mongodb', label: 'MongoDB', color: '#68d391', icon: 'M' },
  { id: 'system-design', label: 'System Design', color: '#b794f4', icon: '◈' },
  { id: 'behavioral', label: 'Behavioral', color: '#fc8181', icon: '◉' },
  { id: 'dsa', label: 'DSA', color: '#f6ad55', icon: '∑' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [topicStats, setTopicStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      interviewsAPI.getStats(),
      interviewsAPI.getHistory({ limit: 5, status: 'completed' }),
      questionsAPI.getTopics()
    ]).then(([statsRes, historyRes, topicsRes]) => {
      setStats(statsRes.data.stats);
      setRecentInterviews(historyRes.data.interviews || []);
      setTopicStats(topicsRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {stats?.totalInterviews ? `You've completed ${stats.totalInterviews} interview${stats.totalInterviews !== 1 ? 's' : ''}. Keep going!` : "Start your first AI interview today."}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Interviews', value: stats?.totalInterviews || 0, color: 'var(--accent)', icon: '◎' },
          { label: 'Avg Score', value: stats?.avgScore ? stats.avgScore.toFixed(1) + '/10' : '—', color: 'var(--green)', icon: '◈' },
          { label: 'Questions', value: user?.stats?.totalQuestionsAnswered || 0, color: 'var(--purple)', icon: '⊞' },
          { label: 'Streak', value: (user?.stats?.streak || 0) + ' days', color: 'var(--amber)', icon: '◉' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Topics */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Start an Interview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {TOPICS.map(topic => {
              const ts = topicStats.find(t => t._id === topic.id);
              return (
                <div key={topic.id} className="card" style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s' }}
                  onClick={() => navigate(`/interview?topic=${topic.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = topic.color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: topic.color + '18', border: `0.5px solid ${topic.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: topic.color }}>{topic.icon}</div>
                    {ts && <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: 10 }}>{ts.count}Q</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>{topic.label}</div>
                  {ts && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--green)', background: 'var(--green-dim)', padding: '1px 6px', borderRadius: 8 }}>{ts.easy}E</span>
                      <span style={{ fontSize: 10, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '1px 6px', borderRadius: 8 }}>{ts.medium}M</span>
                      <span style={{ fontSize: 10, color: 'var(--red)', background: 'var(--red-dim)', padding: '1px 6px', borderRadius: 8 }}>{ts.hard}H</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick start */}
          <div className="card" style={{ padding: '22px', borderColor: 'var(--border-accent)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginBottom: 10 }}>⚡ Quick Start</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>Jump into a voice interview now. The AI interviewer will introduce itself and start asking real questions.</p>
            <Link to="/interview" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Start Voice Interview →
            </Link>
          </div>

          {/* Recent interviews */}
          {recentInterviews.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Recent Sessions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentInterviews.slice(0, 4).map(iv => (
                  <Link key={iv._id} to={`/result/${iv._id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
                    textDecoration: 'none', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-active)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{iv.topic}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(iv.completedAt || iv.createdAt).toLocaleDateString()}</div>
                    </div>
                    {iv.finalScore > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: iv.finalScore >= 7 ? 'var(--green)' : iv.finalScore >= 5 ? 'var(--amber)' : 'var(--red)' }}>
                        {iv.finalScore}/10
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              <Link to="/history" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--accent)' }}>View all →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
