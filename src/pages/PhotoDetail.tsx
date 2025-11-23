// frontend/src/pages/PhotoDetail.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhotoCard from '../components/PhotoCard';
import RatingControl from '../components/RatingControl';

type ListItem = {
  id: string;
  filename: string;
  category?: string;
  url: string;
  thumb?: string;
  medium?: string;
};

export default function PhotoDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [list, setList] = useState<ListItem[]>([]);
  const [item, setItem] = useState<ListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [rating, setRating] = useState<number>(0);

  // load list.json once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/photos/list.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('no list');
        const data: ListItem[] = await res.json();
        if (mounted) setList(data);
      } catch (e) {
        console.error('Failed to load list.json', e);
        if (mounted) setList([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // when id changes: find item, prefetch image, scroll into view after load
  useEffect(() => {
    let mounted = true;
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setImgLoaded(false);
      try {
        let data = list;
        if (!data.length) {
          const res = await fetch('/photos/list.json', { cache: 'no-store' });
          data = await res.json();
          if (mounted) setList(data);
        }

        const found = data.find((it: ListItem) => it.id === String(id));
        if (!mounted) return;
        setItem(found ?? null);

        if (found?.url) {
          const saved = localStorage.getItem(`rating:${found.url}`);
          if (saved && !Number.isNaN(Number(saved))) setRating(Number(saved));
          else setRating(0);
        } else setRating(0);

        const imgSrc = found?.medium ?? found?.url ?? `/photos/${id}.jpg`;
        if (imgSrc) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = imgSrc;
          });
          if (mounted) {
            setImgLoaded(true);
            // ensure big image is visible at top (use scrollIntoView for reliability)
            setTimeout(() => {
              const el = document.querySelector('.photo-top') as HTMLElement | null;
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 60);
          }
        } else {
          if (mounted) setImgLoaded(true);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setItem(null);
          setImgLoaded(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      mounted = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [id, list, navigate]);

  const related = React.useMemo(() => {
    if (!item) return [];
    return list.filter(l => (l.category ?? 'uncategorized') === (item.category ?? 'uncategorized') && l.id !== item.id);
  }, [item, list]);

  function goBack() { navigate(-1); }
  function enterFullscreen() {
    const el = imgRef.current;
    if (!el) return;
    const container = el.closest('.photo-top') as HTMLElement | null;
    const target = container ?? el;
    if (target.requestFullscreen) target.requestFullscreen().catch(()=>{});
    else if ((target as any).webkitRequestFullscreen) (target as any).webkitRequestFullscreen();
  }

  function onRate(newRating: number) {
    setRating(newRating);
    if (item?.url) {
      try { localStorage.setItem(`rating:${item.url}`, String(newRating)); } catch {}
    }
  }

  function openRelated(idStr: string) {
    navigate(`/photo/${idStr}`);
    // scroll to top handled in effect after load
  }

  return (
    <main style={{ maxWidth: 1200, margin: '20px auto', padding: '0 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={goBack}>Back</button>
          <button className="btn" onClick={() => navigate(-1)}>Close</button>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={enterFullscreen}>Fullscreen</button>
        </div>
      </div>

      {loading && <div>Loading…</div>}

      {!loading && item && (
        <>
          {/* TOP (big image) */}
          <section className="photo-top" style={{ background:'var(--card)', borderRadius:12, padding:12, marginBottom:20, minHeight:'60vh' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ width:'100%', display:'flex', justifyContent:'center', minHeight: 240 }}>
                {imgLoaded ? (
                  // responsive picture: use medium if exists, fallback to url; thumbs used by <img loading="lazy"> elsewhere
                  <picture style={{ width:'100%' }}>
                    {/* prefer webp medium if available */}
                    {item.medium && <source srcSet={item.medium} type="image/webp" />}
                    <img
                      ref={imgRef}
                      src={item.medium ?? item.url}
                      alt={item.filename}
                      style={{ width:'100%', maxHeight:'75vh', objectFit:'contain', borderRadius:8 }}
                      onError={(e)=>{ const im = e.currentTarget; if (!im.dataset.fallback) { im.dataset.fallback='1'; im.src = `https://picsum.photos/seed/${item.id}/1200/700`; } }}
                    />
                  </picture>
                ) : (
                  <div style={{ padding:40, textAlign:'center' }}>Preparing image…</div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{item.filename}</div>
                  <div style={{ color:'var(--muted)', marginTop:4 }}>{item.category}</div>
                </div>

                <div>
                  <RatingControl photoId={item.id} initial={rating} onRate={onRate} />
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM: masonry grid like home */}
          <section>
            <h3 style={{ margin:'8px 0 12px', fontSize:18, fontWeight:700 }}>More in {item.category}</h3>

            <div className="gallery-masonry">
              {/* current item first */}
              <div className="masonry-item" style={{ breakInside:'avoid' }}>
                <PhotoCard
                  photo={{
                    id: item.id,
                    title: item.filename,
                    photographer: item.category,
                    url: item.url,
                    thumb: item.thumb,
                    avgRating: rating,
                    category: item.category
                  } as any}
                  onRate={(r:number) => onRate(r)}
                />
              </div>

              {related.map(r => (
                <div className="masonry-item" key={r.id} style={{ breakInside:'avoid', cursor:'pointer' }} onClick={() => openRelated(r.id)}>
                  <PhotoCard
                    photo={{
                      id: r.id,
                      title: r.filename,
                      photographer: r.category,
                      url: r.url,
                      thumb: r.thumb,
                      avgRating: 0,
                      category: r.category
                    } as any}
                    onRate={(val:number) => {
                      try { localStorage.setItem(`rating:${r.url}`, String(val)); } catch {}
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!loading && !item && <div>Image not available</div>}
    </main>
  );
}
