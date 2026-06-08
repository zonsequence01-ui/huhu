import { describe, expect, it, afterEach } from "vitest";
import { momentReportHideThreshold } from "./moment-report.js";

describe("momentReportHideThreshold", () => {
  const prev = process.env.MOMENT_REPORT_HIDE_THRESHOLD;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.MOMENT_REPORT_HIDE_THRESHOLD;
    } else {
      process.env.MOMENT_REPORT_HIDE_THRESHOLD = prev;
    }
  });

  it("defaults to 3", () => {
    delete process.env.MOMENT_REPORT_HIDE_THRESHOLD;
    expect(momentReportHideThreshold()).toBe(3);
  });

  it("clamps invalid values", () => {
    process.env.MOMENT_REPORT_HIDE_THRESHOLD = "0";
    expect(momentReportHideThreshold()).toBe(3);
    process.env.MOMENT_REPORT_HIDE_THRESHOLD = "99";
    expect(momentReportHideThreshold()).toBe(20);
  });
});
