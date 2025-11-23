// frontend/src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PhotoDetail from "./pages/PhotoDetail";
import NotFound from "./pages/NotFound";
import ThemeToggleMini from "./components/ThemeToggleMini";

export default function App(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar with small theme toggle */}
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", padding: 12 }}>
        <ThemeToggleMini />
      </div>

      {/* Main content / routes */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photo/:id" element={<PhotoDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
