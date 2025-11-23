// frontend/src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound(): JSX.Element {
  return (
    <div style={{ minHeight: "70vh", display: "flex" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 640, padding: 24 }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
          <p style={{ fontSize: 18, color: "#666" }}>The page you are looking for doesn't exist.</p>
          <Link to="/" style={{ color: "#16a34a", fontWeight: 700 }}>Go back home</Link>
        </div>
      </div>

      <div style={{ flex: 1, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", fontSize: 34, fontWeight: 700, textAlign: "center" }}>
          Page not found
        </div>
      </div>
    </div>
  );
}
