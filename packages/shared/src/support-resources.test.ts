import { describe, expect, it } from "vitest";
import {
  getCrisisResourceMessage,
  getSupportResources,
  getWellnessResourceMessage,
} from "./support-resources.js";

describe("support-resources", () => {
  it("defaults to zh-TW", () => {
    const r = getSupportResources();
    expect(r.region).toBe("TW");
    expect(r.crisis.lines.some((l) => l.includes("1925"))).toBe(true);
  });

  it("maps locales to regional bundles", () => {
    expect(getSupportResources("ja-JP").region).toBe("JP");
    expect(getSupportResources("ko-KR").region).toBe("KR");
    expect(getSupportResources("vi-VN").region).toBe("VN");
    expect(getSupportResources("zh-CN").crisis.lines.some((l) => l.includes("12356"))).toBe(
      true,
    );
    expect(getSupportResources("en-US").crisis.lines[0]).toContain("virtual");
  });

  it("returns joined crisis and wellness messages", () => {
    expect(getCrisisResourceMessage("zh-TW")).toContain("1925");
    expect(getWellnessResourceMessage("zh-TW")).toContain("並不孤單");
  });
});
