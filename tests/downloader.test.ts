import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadMp3 } from "../src/downloader";
import { Readable } from "stream";

// Helper to create a readable stream that ends quickly
function makeFakeAudioStream(): Readable {
  const r = new Readable({ read() {} });
  // push some bytes then end
  setTimeout(() => {
    r.push(Buffer.from("fake_audio_data"));
    r.push(null);
  }, 5);
  return r;
}

describe("downloadMp3", () => {
  let mockFs: any;

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      rmSync: vi.fn(),
    };
  });

  it("rejects on invalid URL", async () => {
    const mockYtdl: any = Object.assign(
      (url: string) => makeFakeAudioStream(),
      {
        validateURL: vi.fn().mockReturnValue(false),
      }
    );

    await expect(
      downloadMp3("not-a-url", {
        ytdl: mockYtdl,
        fsImpl: mockFs,
        ffmpegPath: "ffmpeg",
        ffmpeg: Object.assign((input: any) => ({
          inputOptions: () => this,
          audioBitrate: () => this,
          audioCodec: () => this,
          format: () => this,
          outputOptions: () => this,
          on: () => this,
          save: () => this,
        }), { setFfmpegPath: vi.fn() }) as any,
      })
    ).rejects.toThrow(/Invalid YouTube URL/);
  });

  it("removes existing output file before saving", async () => {
    const mockYtdl: any = Object.assign(
      (url: string) => makeFakeAudioStream(),
      { validateURL: vi.fn().mockReturnValue(true) }
    );

    // ffmpeg mock that calls end right after save
    const ffmpegOnHandlers: Record<string, Function> = {};
    const mockFfmpegFactory: any = Object.assign(
      (input: any) => {
        const api = {
          inputOptions: vi.fn().mockReturnThis(),
          audioBitrate: vi.fn().mockReturnThis(),
          audioCodec: vi.fn().mockReturnThis(),
          format: vi.fn().mockReturnThis(),
          outputOptions: vi.fn().mockReturnThis(),
          on: vi.fn((evt: string, cb: Function) => {
            ffmpegOnHandlers[evt] = cb;
            return api;
          }),
          save: vi.fn(() => setTimeout(() => ffmpegOnHandlers["end"] && ffmpegOnHandlers["end"](), 5)),
        };
        return api;
      },
      { setFfmpegPath: vi.fn() }
    );

    mockFs.existsSync.mockReturnValue(true);

    const out = await downloadMp3("https://youtu.be/abc", {
      ytdl: mockYtdl,
      fsImpl: mockFs,
      ffmpegPath: "ffmpeg",
      ffmpeg: mockFfmpegFactory,
      output: "output.mp3",
    });

    expect(out).toBe("output.mp3");
    expect(mockFs.rmSync).toHaveBeenCalledWith("output.mp3");
  });

  it("applies bitrate and mp3 format settings", async () => {
    const mockYtdl: any = Object.assign(
      (url: string) => makeFakeAudioStream(),
      { validateURL: vi.fn().mockReturnValue(true) }
    );

    const spies: Record<string, any> = {};
    const ffmpegOnHandlers: Record<string, Function> = {};

    const mockFfmpegFactory: any = Object.assign(
      (input: any) => {
        const api = {
          inputOptions: vi.fn().mockReturnThis(),
          audioBitrate: vi.fn().mockReturnThis(),
          audioCodec: vi.fn().mockReturnThis(),
          format: vi.fn().mockReturnThis(),
          outputOptions: vi.fn().mockReturnThis(),
          on: vi.fn((evt: string, cb: Function) => {
            ffmpegOnHandlers[evt] = cb;
            return api;
          }),
          save: vi.fn(() => setTimeout(() => ffmpegOnHandlers["end"] && ffmpegOnHandlers["end"](), 5)),
        };
        spies.api = api;
        return api;
      },
      { setFfmpegPath: vi.fn() }
    );

    const out = await downloadMp3("https://youtu.be/abc", {
      ytdl: mockYtdl,
      fsImpl: mockFs,
      ffmpegPath: "ffmpeg",
      ffmpeg: mockFfmpegFactory,
      output: "song.mp3",
      bitrate: 192,
    });

    expect(out).toBe("song.mp3");
    expect(spies.api.audioBitrate).toHaveBeenCalledWith(192);
    expect(spies.api.format).toHaveBeenCalledWith("mp3");
  });
});
