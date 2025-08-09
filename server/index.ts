import express from "express";
import cors from "cors";
import { downloadMp3 } from "../src/downloader";
import { buildOutputFilename } from "../src/cli-utils";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());

app.get("/api/download", async (req, res) => {
  const url = String(req.query.url || "");
  const name = String(req.query.name || "");

  try {
    if (!url) {
      return res.status(400).json({ error: "缺少 url 參數" });
    }
    if (!name) {
      return res.status(400).json({ error: "缺少 name 參數" });
    }

    // 驗證與標準化輸出名稱
    const safeName = buildOutputFilename(name).replace(/\.mp3$/i, "");

    // 下載到暫存檔
    const tmpDir = path.join(process.cwd(), "tmp_rovodev_build");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpOut = path.join(tmpDir, `${safeName}.mp3`);

    const outPath = await downloadMp3(url, { output: tmpOut });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}.mp3"`);

    const stream = fs.createReadStream(outPath);
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });
    stream.on("end", () => {
      try {
        fs.unlinkSync(outPath);
      } catch {}
    });
    stream.pipe(res);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || String(e) });
  }
});

const PORT = process.env.PORT || 5175;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
