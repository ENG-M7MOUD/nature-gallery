// frontend/src/components/ThemeToggle.tsx
import React, { useEffect, useState } from 'react';

const ICON_URL = 'C:\Users\M7MOUD\Desktop\nature-gallery\frontend\cefab9c8-0cef-4ae6-afc9-bcd4aa47193f.png';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(()=>{
    const s = localStorage.getItem('theme-dark');
    if (s!==null) setDark(JSON.parse(s));
    else setDark(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  },[]);
  useEffect(()=>{
    if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme-dark', JSON.stringify(dark));
  },[dark]);
  return (
    <button onClick={()=>setDark(d=>!d)} className="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme" style={{display:'flex',alignItems:'center',gap:8}}>
      <img src={ICON_URL} alt="theme" style={{width:36,height:20,objectFit:'cover',borderRadius:999}}/>
    </button>
  );
}
