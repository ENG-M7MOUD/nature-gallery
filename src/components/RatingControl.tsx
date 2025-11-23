// frontend/src/components/RatingControl.tsx
import React, { useEffect, useState, useRef } from 'react';

type Props = {
  initial?: number;
  onRate?: (r: number) => void;
  photoId?: string;
  compact?: boolean;
};

type RatingData = { avgRating: number; ratingCount: number };

// Safe RatingControl with dynamic import fallback
export default function RatingControl({ initial = 0, onRate, photoId, compact = false }: Props) {
  const [value, setValue] = useState<number>(initial);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const ratingsRef = useRef<{ subscribeRating?: Function; submitRating?: Function } | null>(null);

  // keep UI in sync if parent changes `initial`
  useEffect(() => setValue(initial), [initial]);

  // try to dynamically import ratings helper (so missing file won't break bundling)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../lib/ratings');
        // mod may export subscribeRating/submitRating
        ratingsRef.current = {
          subscribeRating: mod.subscribeRating,
          submitRating: mod.submitRating
        };
        // if photoId exists, try to read initial stored rating immediately (local fallback)
        if (mounted && photoId && typeof mod.getRating === 'function') {
          const current = mod.getRating(photoId) as RatingData | null;
          if (current) {
            setValue(Math.round(current.avgRating ?? 0));
            setRemoteCount(current.ratingCount ?? null);
          }
        }
      } catch (e) {
        // ignore: we'll fallback to localStorage-only behavior
        ratingsRef.current = {};
      }
    })();
    return () => { mounted = false; };
  }, []);

  // subscribe to remote updates using the dynamically loaded subscribeRating
  useEffect(() => {
    if (!photoId) return;
    let unsub: (() => void) | undefined;
    try {
      const sub = ratingsRef.current?.subscribeRating;
      if (typeof sub === 'function') {
        const maybeUnsub = sub(photoId, (v: RatingData | null) => {
          if (v) {
            setValue(Math.round(v.avgRating ?? 0));
            setRemoteCount(v.ratingCount ?? null);
          }
        });
        if (typeof maybeUnsub === 'function') unsub = maybeUnsub;
      } else {
        // if no subscribe, try to read localStorage value once
        try {
          const raw = localStorage.getItem(`rating:${photoId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed) {
              setValue(Math.round(parsed.avgRating ?? parsed ?? 0));
              setRemoteCount(parsed.ratingCount ?? null);
            }
          }
        } catch {}
      }
    } catch (err) {
      console.error('subscribeRating error', err);
    }

    return () => { try { if (unsub) unsub(); } catch {} };
  }, [photoId]);

  // user picks a rating
  async function pick(v: number) {
    setValue(v);
    if (onRate) onRate(v);

    const submit = ratingsRef.current?.submitRating;
    if (photoId && typeof submit === 'function') {
      try {
        await submit(photoId, v);
        // after submit, subscribe callback (if exists) should update the ui count/avg
      } catch (e) {
        console.error('failed submit rating', e);
      }
    } else {
      // fallback local storage aggregator (keeps avg/count locally)
      try {
        const raw = localStorage.getItem(`rating:${photoId}`);
        if (raw) {
          const cur = JSON.parse(raw);
          const total = (cur.avgRating ?? 0) * (cur.ratingCount ?? 0) + v;
          const cnt = (cur.ratingCount ?? 0) + 1;
          const newData = { avgRating: total / cnt, ratingCount: cnt };
          localStorage.setItem(`rating:${photoId}`, JSON.stringify(newData));
          setRemoteCount(newData.ratingCount);
          setValue(Math.round(newData.avgRating ?? v));
        } else {
          const newData = { avgRating: v, ratingCount: 1 };
          localStorage.setItem(`rating:${photoId}`, JSON.stringify(newData));
          setRemoteCount(1);
        }
      } catch (e) {
        try { if (photoId) localStorage.setItem(`rating:${photoId}`, JSON.stringify({ avgRating: v, ratingCount: 1 })); } catch {}
      }
    }
  }

  // responsive/touch friendly star size
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(!!('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  }, []);
  const starSize = compact ? 14 : (isTouch ? 22 : 18);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const v = i + 1;
        const gold = v <= value;
        return (
          <button
            key={v}
            onClick={() => pick(v)}
            aria-label={`${v} out of 10`}
            title={`${v}/10`}
            style={{
              width: starSize,
              height: starSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              margin: 0,
              border: 'none',
              background: 'transparent',
              lineHeight: 0,
              cursor: 'pointer',
              color: gold ? '#FFD700' : '#999'
            }}
          >
            <svg width={starSize} height={starSize} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.162L12 18.896 4.665 23.16 6.066 14.998 0.132 9.211l8.2-1.193z"/>
            </svg>
          </button>
        );
      })}

      {!compact && (
        <span style={{ fontSize: 13, color: '#ccc', marginLeft: 6 }}>
          {value}/10 {remoteCount !== null ? `· ${remoteCount} votes` : ''}
        </span>
      )}
    </div>
  );
}
