import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny fake Redis: just enough of multi().incr().expire().exec() for the limiter.
const store = new Map<string, number>();
let redisDown = false;
let redisConfigured = true;
const fakeRedis = {
  multi() {
    let key = "";
    const chain = {
      incr(k: string) {
        key = k;
        return chain;
      },
      expire() {
        return chain;
      },
      async exec() {
        if (redisDown) throw new Error("connection refused");
        const count = (store.get(key) ?? 0) + 1;
        store.set(key, count);
        return [[null, count], [null, 1]];
      },
    };
    return chain;
  },
};
vi.mock("@/lib/redis", () => ({ getRedis: () => (redisConfigured ? fakeRedis : null) }));

const { rateLimit } = await import("@/lib/rate-limit");
const login = { name: "login", id: "a@b.com", limit: 3, windowSeconds: 60, failClosed: true };

describe("rateLimit", () => {
  beforeEach(() => {
    store.clear();
    redisDown = false;
    redisConfigured = true;
  });

  it("allows up to the limit, then blocks", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) results.push((await rateLimit(login)).ok);
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("counts each id separately", async () => {
    for (let i = 0; i < 3; i++) await rateLimit(login);
    expect((await rateLimit({ ...login, id: "other@b.com" })).ok).toBe(true);
  });

  it("treats emails case-insensitively", async () => {
    for (let i = 0; i < 3; i++) await rateLimit(login);
    expect((await rateLimit({ ...login, id: "A@B.COM" })).ok).toBe(false);
  });

  it("fails closed for login when Redis is down", async () => {
    redisDown = true;
    expect((await rateLimit(login)).ok).toBe(false);
  });

  it("fails open for everything else when Redis is down", async () => {
    redisDown = true;
    expect((await rateLimit({ ...login, failClosed: false })).ok).toBe(true);
  });

  it("allows everything when REDIS_URL is not set (local dev)", async () => {
    redisConfigured = false;
    for (let i = 0; i < 5; i++) expect((await rateLimit(login)).ok).toBe(true);
  });
});