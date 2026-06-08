import { describe, expect, it } from "vitest";
import { buildInviteQrDataUrl } from "./invite-qr.js";

describe("invite-qr", () => {
  it("returns a PNG data URL", async () => {
    const url = await buildInviteQrDataUrl("https://app.test/?invite=ABCD2345");
    expect(url).toMatch(/^data:image\/png;base64,/);
  });
});
