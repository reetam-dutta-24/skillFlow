// A fake explain-back model for end-to-end tests. Never used in production.
//
// It answers like an OpenAI-compatible /chat/completions endpoint, so the app talks to it
// through EXPLAIN_MODEL_URL exactly as it talks to Gemini. The rule is fixed so tests are
// repeatable: an explanation that contains the word "because" holds; anything else does not.
import { createServer } from "node:http";

const PORT = Number(process.env.MODEL_STUB_PORT ?? 4010);

function reply(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function completion(content) {
  return { choices: [{ message: { role: "assistant", content: JSON.stringify(content) } }] };
}

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") return reply(res, 200, { ok: true });
  if (req.method !== "POST") return reply(res, 404, { error: { message: "not found" } });

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(res, 400, { error: { message: "bad json" } });
    }
    const system = body.messages?.find((m) => m.role === "system")?.content ?? "";
    const user = body.messages?.find((m) => m.role === "user")?.content ?? "";

    // One idea in the explain-back wizard.
    if (system.startsWith("You review one idea")) {
      const answer = user.split("Their explanation of this idea:\n")[1] ?? "";
      const understood = /\bbecause\b/i.test(answer);
      return reply(
        res,
        200,
        completion({
          understood,
          review: understood
            ? "That explanation holds. You said what the idea is and why it matters, in your own words."
            : "That does not yet explain the idea. Say what it is and why it matters, then try again.",
        }),
      );
    }

    // Anything else (the stage idea writer, summaries): an empty object, so the app keeps
    // what it already has and nothing new is written.
    return reply(res, 200, completion({}));
  });
}).listen(PORT, () => console.log(`model stub on http://localhost:${PORT}`));
