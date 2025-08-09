import { describe, it, expect, vi } from "vitest";
import { downloadMp3 } from "../src/downloader";
import fs from "fs";
import path from "path";

// 這是一個真正會連網下載、並產生 mp3 檔案的整合測試
// 產出路徑：integration_test_result/test_<YYYY_MM_DD>.mp3

function formatDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}_${mm}_${dd}`;
}

describe("integration: real download and transcode", () => {
  it(
    "downloads to integration_test_result/test_<YYYY_MM_DD>.mp3",
    async () => {
      const url =
        "https://www.youtube.com/watch?v=EjYI1d8oRh8&list=PL4fyUt77T3SviyHQ5zUkHxxvLvNkXw_S6&index=8";

      const dir = path.join(process.cwd(), "integration_test_result");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const out = path.join(dir, `test_${formatDate()}.mp3`);
      if (fs.existsSync(out)) {
        try {
          fs.rmSync(out);
        } catch {}
      }

      const outputPath = await downloadMp3(url, { output: out });
      expect(outputPath).toBe(out);
      expect(fs.existsSync(out)).toBe(true);

      const { size } = fs.statSync(out);
      // 要求檔案至少大於 300KB，避免空檔或失敗
      expect(size).toBeGreaterThan(300 * 1024);
    },
    { timeout: 240_000 }
  );
});
