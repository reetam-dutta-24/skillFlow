// A fake explain-back model (and assistant model and embedder) for end-to-end tests. Never used in production.
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

// Embeddings for the SkillFlow Assistant: a deterministic hashed bag of words in 16 slots, padded with zeros to the
// 768 dimensions the app stores, then normalised. Repeatable, and texts that share words come out close.
const DIMENSIONS = 768;
const SLOTS = 16;

function hashWord(word) {
  let hash = 2166136261;
  for (const char of word) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function embed(text) {
  const vector = new Array(DIMENSIONS).fill(0);
  for (const word of String(text).toLowerCase().match(/[a-z0-9]{3,}/g) ?? []) vector[hashWord(word) % SLOTS] += 1;
  if (vector.every((value) => value === 0)) vector[0] = 1;
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return vector.map((value) => value / norm);
}

// The assistant streams. Each reply cites source [1], so the panel shows a citation chip and a source list.
function streamReply(res, text) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  const words = text.split(/(?<= )/);
  let index = 0;
  const timer = setInterval(() => {
    if (index >= words.length) {
      clearInterval(timer);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    const piece = words.slice(index, index + 3).join("");
    index += 3;
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`);
  }, 30);
}

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") return reply(res, 200, { ok: true });
  if (req.method !== "POST") return reply(res, 404, { error: { message: "not found" } });

  if (req.url?.endsWith("/embeddings")) {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      const input = Array.isArray(body.input) ? body.input : [body.input ?? ""];
      reply(res, 200, { data: input.map((text, index) => ({ index, embedding: embed(text) })) });
    });
    return;
  }

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

    // The SkillFlow Assistant: hint mode never explains; an answer cites the first source.
    if (system.startsWith("You are the SkillFlow Assistant")) {
      const hint = system.includes("you must not do it for them");
      return streamReply(
        res,
        hint
          ? "The resources for this stage cover it [1]. What would you look for first? Hint: start from what the stage title promises."
          : "Here is how it works, from SkillFlow's own help [1]. Each idea is reviewed on its own, and the stage is recorded once every idea holds.",
      );
    }

    // Anything else (the stage idea writer, summaries): an empty object, so the app keeps
    // what it already has and nothing new is written.
    return reply(res, 200, completion({}));
  });
}).listen(PORT, () => console.log(`model stub on http://localhost:${PORT}`));
