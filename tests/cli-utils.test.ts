import { describe, it, expect } from "vitest";
import { buildOutputFilename } from "../src/cli-utils";

describe("buildOutputFilename", () => {
  it("appends .mp3 if missing", () => {
    expect(buildOutputFilename("abc")).toBe("abc.mp3");
  });

  it("keeps .mp3 if provided", () => {
    expect(buildOutputFilename("abc.mp3")).toBe("abc.mp3");
  });

  it("supports Chinese characters", () => {
    expect(buildOutputFilename("中文名稱")).toBe("中文名稱.mp3");
  });

  it("sanitizes unsafe characters", () => {
    expect(buildOutputFilename("a/b:c*?|")).toBe("a_b_c___.mp3");
  });

  it("rejects empty name", () => {
    expect(() => buildOutputFilename("")).toThrow(/不可為空/);
  });

  it("rejects path traversal", () => {
    expect(() => buildOutputFilename("../abc")).toThrow(/不合法/);
  });
});
