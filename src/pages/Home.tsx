// frontend/src/pages/Home.tsx
import React, { useEffect, useMemo, useState } from 'react';
import PhotoCard from '../components/PhotoCard';
import { Photo } from '../types';

type Filter = 'all' | 'gte8' | 'gte5' | 'unrated';

export default function Home(): JSX.Element {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/photos/list.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('no list');
        const list: Array<{ filename: string; category?: string; url: string }> = await res.json();

        const mapped = list.map((it, idx) => {
          const base = it.filename.replace(/\.[^.]+$/, '');
          const urlDir = it.url.replace(/\/[^/]+$/, ''); // folder path
          const photo: Photo = {
            id: String(idx + 1),
            title: it.filename,
            photographer: it.category ?? 'Local',
            url: it.url,
            filename: it.filename,
            thumb: `${urlDir}/${base}-thumb.webp`,
            avgRating: 0,
            ratingCount: 0,
            category: it.category ?? 'uncategorized',
          };
          // hydrate saved rating from localStorage (if exists)
          const saved = localStorage.getItem(`rating:${photo.url}`);
          if (saved) {
            const val = Number(saved);
            if (!Number.isNaN(val)) photo.avgRating = val;
          }
          return photo;
        });

        if (mounted) {
          setPhotos(mapped);
          const cats = Array.from(new Set(mapped.map(p => p.category ?? 'uncategorized')));
          setCategories(['all', ...cats]);
        }
      } catch (err) {
        // fallback demo items
        const sample = Array.from({ length: 8 }).map((_, i) => ({
          id: String(i + 1),
          title: `Nature ${i + 1}`,
          photographer: 'Demo',
          url: `https://picsum.photos/seed/${i + 1}/1200/800`,
          thumb: `https://picsum.photos/seed/${i + 1}/600/400`,
          avgRating: Math.round(Math.random() * 9) + 1,
          ratingCount: Math.floor(Math.random() * 50) + 1,
          category: 'demo',
        })) as Photo[];
        if (mounted) {
          setPhotos(sample);
          setCategories(['all', 'demo']);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // visible list: apply category filter, rating filter, then sort by rating desc
  const visible = useMemo(() => {
    let arr = photos.slice();
    if (category !== 'all') arr = arr.filter(p => p.category === category);
    if (filter === 'gte8') arr = arr.filter(p => (p.avgRating ?? 0) >= 8);
    if (filter === 'gte5') arr = arr.filter(p => (p.avgRating ?? 0) >= 5);
    if (filter === 'unrated') arr = arr.filter(p => !(p.avgRating && p.avgRating > 0));
    arr.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    return arr;
  }, [photos, filter, category]);

  // called when a PhotoCard/RatingControl updates a rating
  function updatePhotoRating(url: string, rating: number) {
    // persist
    try {
      localStorage.setItem(`rating:${url}`, String(rating));
    } catch (e) {
      // ignore storage errors
    }
    setPhotos(prev => prev.map(p => (p.url === url ? { ...p, avgRating: rating } : p)));
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nature Gallery</h1>
            <div className="text-sm text-slate-500 mt-1">Sorted by rating — hover a card to reveal actions.</div>
          </div>

          <div className="flex items-center gap-3">
            {/* category select fallback for small screens */}
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded hidden sm:block">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="px-3 py-2 rounded">
              <option value="all">All</option>
              <option value="gte8">Rated ≥ 8</option>
              <option value="gte5">Rated ≥ 5</option>
              <option value="unrated">Unrated</option>
            </select>
          </div>
        </div>

        {/* category chips (Pinterest-like) */}
        <div style={{ marginTop: 12 }}>
          <div className="category-chips" role="tablist" aria-label="Categories">
            {categories.map(cat => {
              const count = photos.filter(p => (p.category ?? 'uncategorized') === cat).length;
              const active = cat === category;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`category-chip ${active ? 'active' : ''}`}
                  aria-pressed={active}
                >
                  <span style={{ fontSize: 14 }}>{cat}</span>
                  <span className="count" style={{ marginLeft: 8 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {loading ? <div>Loading…</div> : (
        <div className="gallery-masonry">
          {visible.map(p => (
            <div className="masonry-item" key={p.url}>
              {/* pass onRate so child can notify parent */}
              <PhotoCard photo={p} onRate={(r: number) => updatePhotoRating(p.url, r)} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
