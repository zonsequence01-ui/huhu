import { describe, expect, it } from "vitest";
import { defaultPresetForLocale, getPreset } from "./presets.js";

describe("defaultPresetForLocale", () => {
  it("maps ja and ko locales to regional presets", () => {
    expect(defaultPresetForLocale("ja-JP").id).toBe("sakura");
    expect(defaultPresetForLocale("ko-KR").id).toBe("minho");
    expect(defaultPresetForLocale("zh-TW").id).toBe("xiaohu");
  });

  it("maps en and zh-CN locales", () => {
    expect(defaultPresetForLocale("en-US").id).toBe("alex");
    expect(defaultPresetForLocale("vi-VN").locale).toBe("vi-VN");
    const cn = defaultPresetForLocale("zh-CN");
    expect(cn.id).toBe("xiaohu");
    expect(cn.locale).toBe("zh-CN");
  });

  it("getPreset returns undefined for unknown id", () => {
    expect(getPreset("missing")).toBeUndefined();
  });

  it("includes western fantasy preset", () => {
    expect(getPreset("lyra")?.locale).toBe("en");
  });
});
