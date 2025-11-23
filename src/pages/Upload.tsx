import React from "react";

export default function Upload(): JSX.Element {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Upload (Demo)</h1>
      <p className="text-sm text-slate-600">This demo does not include server upload â€” integrate with your preferred backend or use Firebase/Serverless storage.</p>
      <div className="mt-4 p-6 border rounded bg-white">Upload UI placeholder (drag & drop, preview, metadata fields)</div>
    </section>
  );
}
