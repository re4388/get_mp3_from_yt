import { downloadMp3 } from "./src/downloader";
import { buildOutputFilename } from "./src/cli-utils";
import ytdl from "@distube/ytdl-core";

// 取得 CLI 參數
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("參數錯誤：請提供 YouTube 連結與輸出檔名（第二參數必填）");
  console.error("使用方式: tsx index.ts <youtube_url> <output_name>");
  process.exit(1);
}

const url = args[0];
const rawName = args[1];

try {
  // 驗證第一參數是 YouTube 連結
  if (!ytdl.validateURL(url)) {
    console.error("第一個參數必須為有效的 YouTube 連結");
    process.exit(1);
  }

  // 驗證第二參數（必填，中文/英文皆可），並確保副檔名為 .mp3
  const output = rawName ? buildOutputFilename(rawName) : buildOutputFilename("output");

  console.log("Downloading audio from:", url);
  downloadMp3(url, { output })
    .then((out) => {
      console.log("Done:", out);
    })
    .catch((err) => {
      console.error("Error during conversion:", err?.message || err);
      process.exit(1);
    });
} catch (err: any) {
  console.error(err?.message || err);
  process.exit(1);
}
