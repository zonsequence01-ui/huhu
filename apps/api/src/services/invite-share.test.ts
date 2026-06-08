import { describe, expect, it } from "vitest";
import {
  buildInvitePath,
  buildInviteUrl,
  parseInviteCodeFromQuery,
} from "./invite-share.js";

describe("invite-share", () => {
  it("builds path and url", () => {
    expect(buildInvitePath("ab12")).toBe("/?invite=AB12");
    expect(buildInviteUrl("https://huhu.app", "xy34")).toBe(
      "https://huhu.app/?invite=XY34",
    );
  });

  it("parses invite query", () => {
    expect(parseInviteCodeFromQuery({ invite: "ab12cd34" })).toBe("AB12CD34");
    expect(parseInviteCodeFromQuery({})).toBeNull();
  });
});
