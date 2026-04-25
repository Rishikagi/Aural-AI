import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/questions', icon: '◈', label: 'Questions' },
  { to: '/interview', icon: '◎', label: 'Live Interview' },
  { to: '/history', icon: '⊟', label: 'History' },
  { to: '/profile', icon: '◉', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'var(--bg-secondary)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid var(--border)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #63b3ed 0%, #b794f4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#0a0b0f', letterSpacing: '-0.5px'
          }}>IP</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>InterviewPrep</div>
              <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.05em' }}>AI-POWERED</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              border: isActive ? '0.5px solid var(--border-accent)' : '0.5px solid transparent',
              transition: 'all 0.15s',
            })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
              {!collapsed && to === '/interview' && (
                <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--accent)', color: '#0a0b0f', padding: '1px 5px', borderRadius: 10, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & collapse */}
        <div style={{ padding: '12px 8px', borderTop: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!collapsed && user && (
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #63b3ed, #b794f4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: '#0a0b0f', flexShrink: 0
              }}>{user.name?.[0]?.toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, padding: collapsed ? '8px 0' : '8px 12px',
            color: 'var(--text-muted)', fontSize: 13, borderRadius: 'var(--radius-md)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s', fontSize: 14 }}>◂</span>
            {!collapsed && <span>Collapse</span>}
          </button>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, padding: collapsed ? '8px 0' : '8px 12px',
            color: 'var(--red)', fontSize: 13, borderRadius: 'var(--radius-md)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 14 }}>⏻</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
