"use client";

import { useState } from "react";

export default function ImportExportPage() {
  const [format, setFormat] = useState<"csv" | "anki">("csv");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onImport() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ?? "Import failed");
        return;
      }
      setMessage(`Imported / updated ${data.upserted} of ${data.totalParsed} rows.`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  function onExport(exportFormat: "csv" | "anki") {
    window.location.href = `/api/export?format=${exportFormat}`;
  }

  async function onFile(file: File) {
    const text = await file.text();
    setContent(text);
    if (file.name.endsWith(".tsv") || file.name.endsWith(".txt")) {
      setFormat("anki");
    } else {
      setFormat("csv");
    }
  }

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Import / Export
        </h1>
        <p className="mt-1 text-ink-soft">
          CSV for full backup. Anki TSV for import into Anki (Front / Back / Tags).
        </p>
      </header>

      <section className="space-y-3 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onExport("csv")}
            className="border border-line bg-paper px-4 py-2 text-sm font-semibold hover:bg-paper-deep"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => onExport("anki")}
            className="border border-line bg-paper px-4 py-2 text-sm font-semibold hover:bg-paper-deep"
          >
            Download Anki TSV
          </button>
        </div>
      </section>

      <section className="space-y-3 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">Import</h2>
        <label className="block text-sm">
          <span className="font-semibold">Format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "anki")}
            className="mt-1 block w-full border border-line bg-paper px-3 py-2"
          >
            <option value="csv">CSV</option>
            <option value="anki">Anki TSV</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold">File</span>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Paste CSV or Anki TSV here…"
          className="w-full border border-line bg-paper px-3 py-2 font-mono text-sm outline-none ring-ink/20 focus:ring-2"
        />
        <button
          type="button"
          disabled={busy || !content.trim()}
          onClick={() => void onImport()}
          className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import (upsert)"}
        </button>
        {message && <p className="text-ok">{message}</p>}
        {error && <p className="text-bad">{error}</p>}
      </section>
    </div>
  );
}
