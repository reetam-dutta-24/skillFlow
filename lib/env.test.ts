import { describe, expect, it, vi } from "vitest";
import { validateEnv } from "@/lib/env";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db", AUTH_SECRET: "x".repeat(40) };
const prod = {
  ...base,
  NODE_ENV: "production",
  CRON_SECRET: "c".repeat(64),
  GEOCODER_USER_AGENT: "SkillFlow/1.0 (a@b.c)",
  REDIS_URL: "redis://localhost:6379",
  GEMINI_API_KEY: "k",
};

describe("validateEnv", () => {
  it("accepts a minimal dev setup and turns numbers into numbers", () => {
    expect(validateEnv({ ...base, MAP_MIN_LEARNERS: "3" }).MAP_MIN_LEARNERS).toBe(3);
  });

  it("treats empty strings as not set", () => {
    expect(() => validateEnv({ ...base, STRIPE_SECRET_KEY: "", MAP_MIN_LEARNERS: "" })).not.toThrow();
  });

  it("rejects missing core variables", () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*AUTH_SECRET/);
  });

  it("rejects a number that is not a number", () => {
    expect(() => validateEnv({ ...base, MAP_MIN_LEARNERS: "five" })).toThrow(/MAP_MIN_LEARNERS/);
  });

  it("needs all four Stripe keys once one is set", () => {
    expect(() => validateEnv({ ...base, STRIPE_SECRET_KEY: "sk_test_1" })).toThrow(/STRIPE_PRICE_ID/);
  });

  it("needs both Google keys or neither", () => {
    expect(() => validateEnv({ ...base, AUTH_GOOGLE_ID: "id" })).toThrow(/AUTH_GOOGLE_SECRET/);
  });

  it("requires the production-only variables in production", () => {
    expect(() => validateEnv({ ...base, NODE_ENV: "production" })).toThrow(/CRON_SECRET[\s\S]*REDIS_URL/);
    expect(() => validateEnv(prod)).not.toThrow();
  });

  it("never prints secret values", () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: "not-a-url-SECRET123" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("SECRET123") }),
    );
  });

  it("warns when production has no AI key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateEnv({ ...prod, GEMINI_API_KEY: "" });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});