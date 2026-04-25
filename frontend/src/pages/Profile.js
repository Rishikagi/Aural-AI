import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';

const ALL_COMPANIES = ['Google','Meta','Amazon','Netflix','Microsoft','Apple','Stripe','Uber','Airbnb','LinkedIn','Twitter','Shopify','Adobe','Salesforce','Atlassian'];
const ALL_ROLES = ['Frontend Engineer','Backend Engineer','Full Stack Engineer','Staff Engineer','Senior Engineer','Engineering Manager','ML Engineer','DevOps/SRE','Mobile Engineer','Data Engineer'];
const TOPIC_COLORS = { javascript:'#f6ad55',react:'#63b3ed',nodejs:'#68d391',mongodb:'#68d391','system-design':'#b794f4',behavioral:'#fc8181',dsa:'#f6ad55' };

function Spinner() {
  return <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// Activity heatmap (last 90 days)
function ActivityHeatmap({ activity }) {
  if (!activity || activity.length === 0) return (
    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No activity in the last 90 days. Start an interview to see your streak!</div>
  );
  // Build a 90-day map
  const map = {};
  activity.forEach(a => { map[a.date] = a; });
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, ...(map[key] || { count: 0 }) });
  }
  const maxCount = Math.max(...days.map(d => d.count), 1);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {days.map(d => {
          const intensity = d.count === 0 ? 0 : Math.max(0.15, d.count / maxCount);
          const bg = d.count === 0 ? 'var(--bg-hover)' : `rgba(99,179,237,${intensity})`;
          return (
            <div key={d.date} title={`${d.date}: ${d.count} session${d.count !== 1 ? 's' : ''}${d.avgScore ? ` · avg ${d.avgScore}/10` : ''}`} style={{
              width: 11, height: 11, borderRadius: 2,
              background: bg,
              border: d.count > 0 ? '0.5px solid rgba(99,179,237,0.3)' : '0.5px solid var(--border)',
              cursor: d.count > 0 ? 'pointer' : 'default',
              transition: 'transform 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Less</span>
        {[0, 0.15, 0.4, 0.7, 1].map(o => (
          <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: o === 0 ? 'var(--bg-hover)' : `rgba(99,179,237,${o})` }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile form state
  const [form, setForm] = useState({ name: '', targetCompanies: [], targetRoles: [] });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  // Password form state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);

  // Full profile data (with liveStats)
  const [profileData, setProfileData] = useState(null);
  const [profileDataLoading, setProfileDataLoading] = useState(true);

  // Activity heatmap
  const [activity, setActivity] = useState([]);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const loadProfile = useCallback(async () => {
    setProfileDataLoading(true);
    try {
      const [profileRes, activityRes] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getActivity(),
      ]);
      setProfileData(profileRes.data);
      setActivity(activityRes.data || []);
      // Sync form from live data
      setForm({
        name: profileRes.data.name || '',
        targetCompanies: profileRes.data.targetCompanies || [],
        targetRoles: profileRes.data.targetRoles || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProfileDataLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const toggleItem = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
  }));

  const flash = (setter, type, text, ms = 3000) => {
    setter({ type, text });
    setTimeout(() => setter(null), ms);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) return flash(setProfileMsg, 'error', 'Name cannot be empty.');
    setProfileLoading(true);
    try {
      await usersAPI.updateProfile(form);
      await refreshUser();
      flash(setProfileMsg, 'success', 'Profile updated successfully.');
    } catch (err) {
      flash(setProfileMsg, 'error', err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return flash(setPwMsg, 'error', 'All fields are required.');
    if (pwForm.newPassword.length < 6) return flash(setPwMsg, 'error', 'New password must be at least 6 characters.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return flash(setPwMsg, 'error', 'New passwords do not match.');
    setPwLoading(true);
    try {
      await usersAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPw(false);
      flash(setPwMsg, 'success', 'Password changed successfully.');
    } catch (err) {
      flash(setPwMsg, 'error', err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await usersAPI.deleteAccount({ password: deleteConfirm });
      logout();
      navigate('/');
    } catch (err) {
      flash(setProfileMsg, 'error', err.response?.data?.error || 'Incorrect password.');
      setDeleteLoading(false);
    }
  };

  const ls = profileData?.liveStats || {};
  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const topicsStudied = ls.topicsStudied || [];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 740, margin: '0 auto' }} className="fade-in">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Profile & Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Manage your account, goals, and preferences</p>
      </div>

      {profileDataLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: 12, color: 'var(--text-muted)', fontSize: 14 }}>
          <Spinner /> Loading profile…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ─── Avatar + identity ─────────────────────────────────── */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #63b3ed, #b794f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0a0b0f', flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                {memberSince && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Member since {memberSince}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {ls.streak > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>🔥 {ls.streak}-day streak</div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Live Stats ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Sessions', value: ls.totalSessions ?? 0, color: 'var(--accent)' },
              { label: 'Avg Score', value: ls.avgScore != null ? `${ls.avgScore}/10` : '—', color: 'var(--green)' },
              { label: 'Questions', value: ls.totalQuestions ?? 0, color: 'var(--purple)' },
              { label: 'Topics', value: ls.topicsCount ?? 0, color: 'var(--amber)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ─── Activity heatmap ───────────────────────────────────── */}
          <SectionCard title="Activity" subtitle="Your interview sessions over the last 90 days">
            <ActivityHeatmap activity={activity} />
            {topicsStudied.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topicsStudied.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 12, textTransform: 'capitalize', background: `${TOPIC_COLORS[t] || 'var(--accent)'}18`, color: TOPIC_COLORS[t] || 'var(--accent)', border: `0.5px solid ${TOPIC_COLORS[t] || 'var(--accent)'}33` }}>{t}</span>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ─── Display Name ───────────────────────────────────────── */}
          <SectionCard title="Display Name" subtitle="How you appear across the platform">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" style={{ maxWidth: 320 }} onKeyDown={e => e.key === 'Enter' && handleSaveProfile()} />
          </SectionCard>

          {/* ─── Target Companies ───────────────────────────────────── */}
          <SectionCard title="Target Companies" subtitle="Questions from these companies will be highlighted">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_COMPANIES.map(c => {
                const active = form.targetCompanies.includes(c);
                return (
                  <button key={c} onClick={() => toggleItem('targetCompanies', c)} style={{
                    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: active ? 'var(--accent-dim)' : 'var(--bg-hover)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    border: `0.5px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>{active ? '✓ ' : ''}{c}</button>
                );
              })}
            </div>
            {form.targetCompanies.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                {form.targetCompanies.length} selected · <button onClick={() => setForm(f => ({ ...f, targetCompanies: [] }))} style={{ color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}>Clear all</button>
              </div>
            )}
          </SectionCard>

          {/* ─── Target Roles ───────────────────────────────────────── */}
          <SectionCard title="Target Roles" subtitle="What position are you interviewing for?">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_ROLES.map(r => {
                const active = form.targetRoles.includes(r);
                return (
                  <button key={r} onClick={() => toggleItem('targetRoles', r)} style={{
                    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: active ? 'var(--purple-dim)' : 'var(--bg-hover)',
                    color: active ? 'var(--purple)' : 'var(--text-secondary)',
                    border: `0.5px solid ${active ? 'rgba(183,148,244,0.3)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>{active ? '✓ ' : ''}{r}</button>
                );
              })}
            </div>
          </SectionCard>

          {/* ─── Save profile ───────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileLoading} style={{ padding: '10px 28px', fontSize: 14 }}>
              {profileLoading ? <><Spinner /> Saving…</> : 'Save profile'}
            </button>
            {profileMsg && (
              <div style={{ fontSize: 13, color: profileMsg.type === 'success' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {profileMsg.type === 'success' ? '✓' : '⚠'} {profileMsg.text}
              </div>
            )}
          </div>

          {/* ─── Change Password ────────────────────────────────────── */}
          <SectionCard title="Password" subtitle="Keep your account secure with a strong password">
            {!showPw ? (
              <button className="btn btn-ghost" onClick={() => setShowPw(true)} style={{ fontSize: 13 }}>Change password</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Current password</label>
                  <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>New password</label>
                  <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" autoComplete="new-password" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Confirm new password</label>
                  <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" autoComplete="new-password"
                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleChangePassword} disabled={pwLoading} style={{ fontSize: 13, padding: '8px 20px' }}>
                    {pwLoading ? <><Spinner /> Updating…</> : 'Update password'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowPw(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} style={{ fontSize: 13 }}>Cancel</button>
                  {pwMsg && <span style={{ fontSize: 13, color: pwMsg.type === 'success' ? 'var(--green)' : 'var(--red)' }}>{pwMsg.type === 'success' ? '✓' : '⚠'} {pwMsg.text}</span>}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ─── Danger Zone ────────────────────────────────────────── */}
          <div className="card" style={{ padding: '22px 24px', borderColor: 'rgba(252,129,129,0.2)' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--red)', marginBottom: 4 }}>Danger Zone</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Permanently delete your account and all interview data. This cannot be undone.</div>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} style={{
                padding: '7px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: 'var(--red-dim)', color: 'var(--red)', border: '0.5px solid rgba(252,129,129,0.25)', transition: 'all 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,129,129,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--red-dim)'}
              >Delete my account</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter your password to confirm deletion:</div>
                <input type="password" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Your current password" autoComplete="current-password" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDeleteAccount} disabled={deleteLoading || !deleteConfirm} style={{
                    padding: '8px 18px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--red)', color: '#fff', border: 'none', opacity: (!deleteConfirm || deleteLoading) ? 0.5 : 1,
                  }}>
                    {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} style={{ fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
