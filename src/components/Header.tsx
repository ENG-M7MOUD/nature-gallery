import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header(): JSX.Element {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(6px)', background: 'rgba(255,255,255,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 20 }}>
          Nature<span style={{ color: 'var(--accent)' }}>Gallery</span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link to="/upload" style={{ padding:'6px 10px', borderRadius:8 }}>Upload</Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
