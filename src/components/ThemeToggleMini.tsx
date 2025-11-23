import React, { useEffect, useState } from "react";

/**
 * ThemeToggleMini
 * - أكبر من النسخة الصغيرة
 * - يغيّر class على <html> إلى "dark-mode" أو "light-mode"
 * - يخزن الإختيار في localStorage key = "theme"
 * - يعرض أيقونة محلية + اسم المشروع بخط واضح
 *
 * Uses local icon path (you provided an image); if you move the file into src/assets,
 * update ICON_URL accordingly.
 */
const ICON_URL = 'https://cdn-icons-png.flaticon.com/128/1445/1445327.png';

export default function ThemeToggleMini() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const s = localStorage.getItem("theme");
      return (s === "light" ? "light" : "dark");
    } catch { return "dark"; }
  });

  useEffect(() => {
    // apply class on html element so global CSS picks it up
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.remove("light-mode");
      root.classList.add("dark-mode");
    } else {
      root.classList.remove("dark-mode");
      root.classList.add("light-mode");
    }
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  // toggle with a nice animation / state
  function toggle() {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 6px 18px rgba(2,6,23,0.25)",
        cursor: "pointer",
        background: theme === "dark" ? "#111" : "#fff",
        transition: "all .22s ease",
        // bigger, bolder
        fontFamily: "'Poppins', 'Montserrat', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 15,
        color: theme === "dark" ? "#fff" : "#111",
      }}
    >
      <img
        src={ICON_URL}
        alt="logo"
        style={{
          width: 36,
          height: 24,
          objectFit: "cover",
          borderRadius: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      />

      <span style={{
        letterSpacing: 0.3,
        color: theme === "dark" ? "#FFD9C2" : "#b91c1c", // warm/pinterest-like red in light mode, soft gold in dark
        fontSize: 16,
      }}>
        NatureGallery
      </span>

      <span
        style={{
          marginLeft: 8,
          width: 36,
          height: 20,
          borderRadius: 20,
          background: theme === "dark" ? "#333" : "#222",
          position: "relative",
          display: "inline-block",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: theme === "dark" ? 14 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: theme === "dark" ? "#ffd166" : "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            transition: "left .18s ease, background .18s ease",
          }}
        />
      </span>
    </button>
  );
}
