import { afterEach, describe, expect, it } from "vitest";
import {
  assertProductionRuntimeConfig,
  isJwtSecretConfigured,
} from "./runtime-config.js";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("runtime-config", () => {
  it("rejects default dev secrets", () => {
    process.env.JWT_SECRET = "huhu-dev-secret-change-in-production";
    expect(isJwtSecretConfigured()).toBe(false);
    process.env.JWT_SECRET = "change-me-in-production";
    expect(isJwtSecretConfigured()).toBe(false);
  });

  it("accepts custom production secret", () => {
    process.env.JWT_SECRET = "prod-secret-abc123";
    expect(isJwtSecretConfigured()).toBe(true);
  });

  it("throws in production without safe JWT_SECRET", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "change-me-in-production";
    expect(() => assertProductionRuntimeConfig()).toThrow(/JWT_SECRET/);
  });

  it("allows production with configured secret", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "prod-secret-abc123";
    expect(() => assertProductionRuntimeConfig()).not.toThrow();
  });
});
