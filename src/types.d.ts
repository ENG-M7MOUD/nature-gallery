// frontend/src/types.d.ts
export type Photo = {
  id: string;
  title: string;
  photographer?: string;
  location?: string;
  url: string;        // full path to file (e.g. /photos/SUN/img.jpg)
  filename?: string;  // filename
  thumb?: string;     // thumb path (optional)
  avgRating?: number;
  ratingCount?: number;
  category?: string;
};
