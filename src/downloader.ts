import ytdlDefault from "@distube/ytdl-core";
import ffmpegDefault from "fluent-ffmpeg";
// @ts-ignore no types
import ffmpegStaticPath from "ffmpeg-static";
import fs from "fs";

export type DownloadOptions = {
  output?: string;
  bitrate?: number; // in kbps
  // testability hooks / dependency injection
  ytdl?: typeof ytdlDefault;
  ffmpeg?: typeof ffmpegDefault;
  ffmpegPath?: string; // override path to ffmpeg binary
  fsImpl?: typeof fs;
  // request headers tweak
  headers?: Record<string, string>;
};

export async function downloadMp3(
  url: string,
  opts: DownloadOptions = {},
): Promise<string> {
  const {
    output = "output.mp3",
    bitrate = 320,
    ytdl = ytdlDefault,
    ffmpeg = ffmpegDefault,
    fsImpl = fs,
  } = opts;

  // Validate URL via injected ytdl
  if (!ytdl.validateURL(url)) {
    throw new Error(`Invalid YouTube URL provided: ${url}`);
  }

  // Resolve ffmpeg binary (allow override; else use ffmpeg-static if exists; else system ffmpeg)
  const resolvedFfmpegPath =
    opts.ffmpegPath ??
    (typeof ffmpegStaticPath === "string" &&
    ffmpegStaticPath &&
    fsImpl.existsSync(ffmpegStaticPath as string)
      ? (ffmpegStaticPath as string)
      : "ffmpeg");

  (ffmpeg as any).setFfmpegPath(resolvedFfmpegPath);

  // Clean existing output file if present
  if (fsImpl.existsSync(output)) {
    try {
      fsImpl.rmSync(output);
    } catch {
      // ignore
    }
  }

  // Build polite headers
  const headers: Record<string, string> = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
  };
  Object.assign(headers, opts.headers);

  // Create input stream (inject fetch to avoid undici agent surprises in other runtimes)
  const audioStream = (ytdl as any)(url, {
    quality: "highestaudio", // 下載最高品質音頻
    filter: "audioonly", // 只下載音頻，不下載影像
    highWaterMark: 1 << 25, // 設定緩衝區大小為32MB (2^25 bytes)
    fetch: (globalThis as any).fetch, // 使用全域fetch函數
    requestOptions: { headers }, // 使用上面建立的標頭
  });

  return new Promise<string>((resolve, reject) => {
    const command = (ffmpeg as any)(audioStream)
      .inputOptions(["-vn"]) // 停用影像處理
      .audioBitrate(bitrate) // 設定音頻位元率
      .audioCodec("libmp3lame") // 使用MP3編碼器
      .format("mp3") // 輸出格式為MP3
      .outputOptions(["-y"]) // 覆寫現有檔案
      .on("error", (err: any) => reject(new Error(err?.message || String(err))))
      .on("end", () => resolve(output));

    command.save(output);
  });
}
