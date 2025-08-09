// Utilities for CLI argument validation and output filename building

// Allow letters, numbers, space, dash, underscore, dot, and CJK Unified Ideographs (Chinese)
const SAFE_CHAR_REGEX = /[^\p{L}\p{N} \-_.\u4E00-\u9FFF]/gu;

export function buildOutputFilename(rawName: string): string {
  if (!rawName || typeof rawName !== "string") {
    throw new Error("輸出檔名不可為空");
  }
  const trimmed = rawName.trim();
  if (!trimmed) throw new Error("輸出檔名不可為空");

  // Remove dangerous characters (e.g., path separators, control chars)
  const sanitized = trimmed.replace(SAFE_CHAR_REGEX, "_");
  if (!sanitized) throw new Error("輸出檔名不可為空");

  // Prevent directory traversal patterns before sanitization logic would hide them
  const traversal = /(^|[\\/])\.\.(?=[\\/]|$)/;
  if (traversal.test(trimmed)) {
    throw new Error("輸出檔名不合法");
  }

  // Append .mp3 if not already
  const hasMp3 = /\.mp3$/i.test(sanitized);
  const name = hasMp3 ? sanitized : `${sanitized}.mp3`;

  return name;
}
