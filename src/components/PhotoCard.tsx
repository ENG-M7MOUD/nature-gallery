// frontend/src/components/PhotoCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Photo } from '../types';
import RatingControl from './RatingControl';

export default function PhotoCard({ photo, onRate }: { photo: Photo; onRate?: (url:string, rating:number)=>void }): JSX.Element {
  const baseSrc = photo.thumb || photo.url;

  function handleLocalRate(rating:number) {
    // save rating in localStorage keyed by url
    localStorage.setItem(`rating:${photo.url}`, String(rating));
    if (onRate) onRate(photo.url, rating);
  }

  return (
    <article className="card">
      <Link to={`/photo/${photo.id}`} aria-label={`Open ${photo.title}`}>
        <div style={{ position:'relative' }}>
          <img src={baseSrc} alt={photo.title} loading="lazy" />
          <div className="hover-tools" aria-hidden>
            <div className="tools-left"></div>

            <div className="tools-right">
              <button className="tool-btn" onClick={(e)=>{ e.preventDefault(); /* save */ const saved = JSON.parse(localStorage.getItem('saved-photos')||'[]'); if(!saved.includes(photo.url)){ saved.unshift(photo.url); localStorage.setItem('saved-photos', JSON.stringify(saved)); alert('Saved'); } else alert('Already saved'); }}>Save</button>

              <button className="tool-btn" onClick={(e)=>{ e.preventDefault(); window.open(photo.url, '_blank'); }}>Open</button>
            </div>
          </div>
        </div>
      </Link>

      <div style={{ padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{maxWidth:'70%'}}>
          <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{photo.title}</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>{photo.category}</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          <div style={{ fontWeight:700, color:'var(--accent)' }}>{photo.avgRating ?? 0}/10</div>
          <RatingControl initial={photo.avgRating ?? 0} onRate={(r)=>handleLocalRate(r)} compact />
        </div>
      </div>
    </article>
  );
}
