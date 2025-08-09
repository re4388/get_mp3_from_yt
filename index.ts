import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
// @ts-ignore: ffmpeg-static has no types
import ffmpegPath from "ffmpeg-static";
// Resolve ffmpeg binary path; fallback to system ffmpeg if static binary not present
const ffmpegBin =
  typeof ffmpegPath === "string" &&
  ffmpegPath &&
  fs.existsSync(ffmpegPath as unknown as string)
    ? (ffmpegPath as unknown as string)
    : "ffmpeg";
import fs from "fs";

// Ensure ffmpeg binary is set (uses a static binary for reliability)
(ffmpeg as any).setFfmpegPath(ffmpegBin);

// Get YouTube URL from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a YouTube URL as an argument");
  console.error("Usage: bun dev <youtube_url>");
  process.exit(1);
}

const url = args[0];
const output = "output.mp3";

// Validate if the URL is a valid YouTube URL
if (!ytdl.validateURL(url)) {
  console.error("Invalid YouTube URL provided:", url);
  process.exit(1);
}

// Remove existing file (or use -y to overwrite)
if (fs.existsSync(output)) {
  try {
    fs.rmSync(output);
  } catch {
    // ignore
  }
}

console.log("Downloading audio from:", url);

// Create an audio-only stream from YouTube with logging
const audioStream = ytdl(url, {
  quality: "highestaudio",
  filter: "audioonly",
  highWaterMark: 1 << 25,
  // Force web-standard fetch to avoid undici agent issues under Bun
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: (globalThis as any).fetch,
  requestOptions: {
    headers: {
      // mimic a common desktop browser
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
    },
  },
});

let gotBytes = 0;
audioStream.on("progress", (_chunkLen, downloaded, total) => {
  gotBytes = downloaded;
  const percent = total ? ((downloaded / total) * 100).toFixed(2) : "?";
  process.stdout.write(
    `\rDownloading: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)}MB)`
  );
});
audioStream.on("info", (info) => {
  const f =
    info?.formats?.find(
      (fmt) =>
        fmt.itag ===
        info?.player_response?.streamingData?.adaptiveFormats?.[0]?.itag
    ) || info?.formats?.[0];
  console.log(`\nSelected format: ${f?.mimeType || "unknown"}`);
});
audioStream.on("error", (err) => {
  console.error("ytdl error:", err?.message || err);
});

audioStream.on("end", () => {
  console.log("\nDownload stream ended (bytes:", gotBytes, ")");
});

const cmd = ffmpeg(audioStream)
  .inputOptions(["-vn"]) // ensure audio-only
  .audioBitrate(320)
  .audioCodec("libmp3lame")
  .format("mp3")
  .outputOptions(["-y"]) // overwrite
  .on("start", (cmdline) => {
    console.log("\nffmpeg started:", cmdline);
  })
  .on("codecData", (data) => {
    console.log("codecData:", data);
  })
  .on("stderr", (line) => {
    // fluent-ffmpeg doesn't expose stderr by default, but some builds do
    console.log("ffmpeg stderr:", line);
  })
  .on("progress", (p) => {
    if (p && typeof p.targetSize === "number") {
      process.stdout.write(`\rTranscoding: ${p.targetSize} KB`);
    }
  })
  .on("end", () => {
    console.log(`\nDone: ${output}`);
  })
  .on("error", (err) => {
    console.error("Error during conversion:", err?.message || err);
    process.exit(1);
  })
  .save(output);
