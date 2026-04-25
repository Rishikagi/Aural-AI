import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '◎', title: 'Voice AI Interviews', desc: 'Speak to a real AI interviewer. It listens, responds in voice, and gives live feedback — just like a real interview.' },
  { icon: '◈', title: '200+ Real Questions', desc: 'Questions actually asked at Google, Meta, Amazon, Netflix, Stripe and more — curated and updated regularly.' },
  { icon: '⊞', title: 'Full MERN Stack', desc: 'JavaScript, React, Node.js, MongoDB, System Design, Behavioral — everything you need to land the role.' },
  { icon: '◉', title: 'Smart Feedback', desc: 'Every answer gets scored with detailed feedback: what you nailed, what you missed, and model answers.' },
];

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'Stripe', 'Uber', 'Airbnb', 'Apple', 'LinkedIn'];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 48px', borderBottom: '0.5px solid var(--border)',
        position: 'sticky', top: 0, background: 'rgba(10,11,15,0.85)',
        backdropFilter: 'blur(12px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #63b3ed, #b794f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0a0b0f' }}>IP</div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>InterviewPrep</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 18px' }}>Sign in</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,179,237,0.08) 0%, transparent 70%)',
        }} />
        <div className="badge" style={{ marginBottom: 24, display: 'inline-flex', background: 'var(--accent-dim)', color: 'var(--accent)', border: '0.5px solid var(--border-accent)', padding: '5px 14px', fontSize: 12, fontWeight: 500 }}>
          Voice-powered AI interviews · MERN Stack Focus
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 600, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '-0.03em' }}>
          Ace your next<br />
          <span style={{ background: 'linear-gradient(90deg, #63b3ed, #b794f4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            tech interview
          </span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Practice with an AI that speaks, listens, and evaluates you in real-time. Real questions from top companies. Honest, detailed feedback.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>Start practicing free →</Link>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: 15 }}>Sign in</Link>
        </div>

        {/* Company logos strip */}
        <div style={{ marginTop: 64 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Questions from engineers at</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', justifyContent: 'center' }}>
            {COMPANIES.map(c => (
              <span key={c} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 12px', border: '0.5px solid var(--border)', borderRadius: 20 }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 48, letterSpacing: '-0.02em' }}>Everything you need to get hired</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: 24, marginBottom: 14, color: 'var(--accent)' }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', padding: '48px 32px', borderColor: 'var(--border-accent)' }}>
          <h2 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Ready to practice?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>Free to get started. No credit card required.</p>
          <Link to="/register" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: 15 }}>Create free account →</Link>
        </div>
      </section>

      <footer style={{ borderTop: '0.5px solid var(--border)', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2025 InterviewPrep. Built with MERN Stack + AI.</p>
      </footer>
    </div>
  );
}
