// Simple local-sync rating system (no backend yet)
// Works across all tabs and refreshes instantly.

export type RatingData = {
  avgRating: number;
  ratingCount: number;
};

// read rating
export function getRating(photoId: string): RatingData | null {
  const raw = localStorage.getItem(`rating:${photoId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// write + broadcast
export function submitRating(photoId: string, value: number): RatingData {
  const existing = getRating(photoId);

  let newData: RatingData;
  if (existing) {
    // simple average update
    const total = existing.avgRating * existing.ratingCount + value;
    const count = existing.ratingCount + 1;
    newData = {
      avgRating: total / count,
      ratingCount: count,
    };
  } else {
    newData = {
      avgRating: value,
      ratingCount: 1,
    };
  }

  localStorage.setItem(`rating:${photoId}`, JSON.stringify(newData));

  // broadcast to all open tabs
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: `rating:${photoId}`,
      newValue: JSON.stringify(newData),
    })
  );

  return newData;
}

// live subscription (subscribes to changes on all tabs)
export function subscribeRating(
  photoId: string,
  callback: (v: RatingData) => void
) {
  function handler(e: StorageEvent) {
    if (e.key === `rating:${photoId}` && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  }

  window.addEventListener("storage", handler);

  // return unsubscribe function
  return () => {
    window.removeEventListener("storage", handler);
  };
}
