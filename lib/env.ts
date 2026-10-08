import { z } from "zod";

// Empty strings in .env ("") count as "not set".
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const opt = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());
const int = z.coerce.number().int().positive();

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Core: the app can't run without these.
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must start with postgresql://"),
    AUTH_SECRET: z.string().min(32, "must be at least 32 characters (npx auth secret)"),

    // Google sign-in (both or neither).
    AUTH_GOOGLE_ID: opt(z.string()),
    AUTH_GOOGLE_SECRET: opt(z.string()),

    // Nearby + events.
    GEOCODER_USER_AGENT: opt(z.string()),
    MAP_MIN_LEARNERS: opt(int),
    TICKETMASTER_API_KEY: opt(z.string()),
    SERPAPI_API_KEY: opt(z.string()),
    SERPAPI_MONTHLY_CAP: opt(int),
    EVENTS_TTL_HOURS: opt(int),
    EVENTS_CRON_PAIRS: opt(int),
    CRON_SECRET: opt(z.string().min(32, "must be at least 32 characters (openssl rand -hex 32)")),

    // Explain-back AI.
    GEMINI_API_KEY: opt(z.string()),
    GEMINI_MODEL: opt(z.string()),
    OPENAI_API_KEY: opt(z.string()),
    EXPLAIN_MODEL_URL: opt(z.url()),
    EXPLAIN_MODEL_KEY: opt(z.string()),
    EXPLAIN_MODEL_NAME: opt(z.string()),

    // Stripe (all or nothing).
    STRIPE_SECRET_KEY: opt(z.string().startsWith("sk_", "must start with sk_")),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: opt(z.string().startsWith("pk_", "must start with pk_")),
    STRIPE_PRICE_ID: opt(z.string().startsWith("price_", "must start with price_")),
    STRIPE_WEBHOOK_SECRET: opt(z.string().startsWith("whsec_", "must start with whsec_")),
    STRIPE_PRICE_LABEL: opt(z.string()),
  })
  .superRefine((e, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    if (!!e.AUTH_GOOGLE_ID !== !!e.AUTH_GOOGLE_SECRET) {
      fail("AUTH_GOOGLE_SECRET", "set both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, or neither");
    }

    const stripe = ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"] as const;
    const stripeSet = stripe.filter((k) => e[k]);
    if (stripeSet.length > 0 && stripeSet.length < stripe.length) {
      for (const k of stripe) if (!e[k]) fail(k, "required once any Stripe key is set");
    }

    if (e.NODE_ENV === "production") {
      if (!e.CRON_SECRET) fail("CRON_SECRET", "required in production (protects /api/cron/*)");
      if (!e.GEOCODER_USER_AGENT) fail("GEOCODER_USER_AGENT", "required in production (Nominatim policy)");
    }
  });

export type Env = z.infer<typeof schema>;

/** Checks process.env once at server start. Prints variable NAMES only, never values. */
export function validateEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n${lines.join("\n")}`);
  }
  const env = result.data;
  if (env.NODE_ENV === "production" && !env.GEMINI_API_KEY && !env.EXPLAIN_MODEL_KEY && !env.OPENAI_API_KEY) {
    console.warn("[env] No AI key set: explain-back cannot pass any stage.");
  }
  return env;
}