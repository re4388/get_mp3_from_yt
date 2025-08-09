import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import "./index.css";

function App() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    if (!url) {
      setError("請輸入 YouTube 連結");
      return;
    }
    if (!name) {
      setError("請輸入輸出檔名");
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(
        `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || resp.statusText);
      }
      const blob = await resp.blob();
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = `${name}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlObj);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-6">YT MP3 Downloader</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">YouTube 連結</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={cn(
                "w-full rounded-md border px-3 py-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              )}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">輸出檔名（不含副檔名）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="abc"
              className={cn(
                "w-full rounded-md border px-3 py-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              )}
            />
          </div>

          <Button onClick={handleDownload} disabled={loading}>
            {loading ? "下載中..." : "下載 MP3"}
          </Button>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
