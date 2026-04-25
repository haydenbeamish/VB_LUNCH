import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.Openrouter;
const BRAVE_API_KEY = process.env.BRAVE_WEBSEARCH_API || process.env.Brave_websearch_api;

app.use(express.json());

// --- OpenRouter: AI Banter ---

app.post("/api/ai/banter", async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: "OpenRouter not configured" });
  }

  const { feedItems } = req.body;
  if (!Array.isArray(feedItems) || feedItems.length === 0) {
    return res.status(400).json({ error: "feedItems array required" });
  }

  // Build a compact summary of each feed item for the AI
  const itemSummaries = feedItems.map((item, i) => {
    return `${i + 1}. [${item.type}] ${item.headline} — ${item.subtext}${item.playerName ? ` (Player: ${item.playerName})` : ""}${item.sport ? ` [${item.sport}]` : ""}`;
  });

  const prompt = `You are the snarky, witty commentator for BOSF (Betting On Sports Fun) — a sports prediction competition among mates. Your job is to rewrite the headlines and subtexts below with sharp, funny Australian-style banter. Keep it punchy and short. Be savage but good-natured. Reference the sport if relevant.

Rules:
- Each headline must be under 80 characters
- Each subtext must be under 120 characters
- CRITICAL: The headline MUST include the event name OR player name from the original. A reader should know exactly what event or person the headline is about without reading the subtext.
- Keep the same meaning/facts, just make it funnier and more engaging
- Use Australian slang where it fits naturally (don't force it)
- No hashtags, no emojis in text
- Return ONLY a JSON array of objects with "headline" and "subtext" fields, in the same order as the input

Feed items to rewrite:
${itemSummaries.join("\n")}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://bosf.replit.app",
        "X-Title": "BOSF Punting Leaderboard",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", response.status, text);
      return res.status(502).json({ error: "OpenRouter request failed" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", content);
      return res.status(502).json({ error: "Invalid AI response format" });
    }

    const enhanced = JSON.parse(jsonMatch[0]);
    return res.json({ enhanced });
  } catch (err) {
    console.error("Banter generation error:", err);
    return res.status(500).json({ error: "Failed to generate banter" });
  }
});

// --- Brave Web Search: Event context ---

app.get("/api/ai/search", async (req, res) => {
  if (!BRAVE_API_KEY) {
    return res.status(503).json({ error: "Brave Search not configured" });
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' required" });
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("freshness", "pw"); // past week

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Brave Search error:", response.status, text);
      return res.status(502).json({ error: "Brave Search request failed" });
    }

    const data = await response.json();
    const results = (data.web?.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age,
    }));

    return res.json({ results });
  } catch (err) {
    console.error("Brave Search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

// --- OpenRouter: General AI chat (for future enhancements) ---

app.post("/api/ai/chat", async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: "OpenRouter not configured" });
  }

  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message required" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://bosf.replit.app",
        "X-Title": "BOSF Punting Leaderboard",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4",
        messages: [
          {
            role: "system",
            content: "You are the BOSF (Betting On Sports Fun) assistant. You're an Australian sports punting expert with sharp wit and good banter. Keep responses concise and entertaining.",
          },
          ...(context ? [{ role: "system", content: context }] : []),
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI request failed" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
});

// --- Data API proxy (forwards /api/vb/* to the backend service) ---

const DATA_API_URL = process.env.DATA_API_URL || "https://api.laserbeamcapital.com";

app.use("/api/vb", async (req, res) => {
  const target = `${DATA_API_URL}/api/vb${req.path}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  try {
    const headers = { "Content-Type": "application/json" };
    if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;
    const options = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
    }
    const upstream = await fetch(target, options);
    const data = await upstream.text();
    res.status(upstream.status).set("Content-Type", "application/json").send(data);
  } catch (err) {
    console.error("Data API proxy error:", err);
    res.status(502).json({ error: "Data API unavailable" });
  }
});

// --- Health check ---

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      openrouter: Boolean(OPENROUTER_API_KEY),
      brave: Boolean(BRAVE_API_KEY),
    },
  });
});

// --- Static file serving (production) ---
app.use(express.static(join(__dirname, "dist")));
app.get(/.*/, (_req, res) => {
  const indexPath = join(__dirname, "dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send("App not built. Please redeploy.");
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BOSF server running on port ${PORT}`);
  console.log(`  OpenRouter: ${OPENROUTER_API_KEY ? "configured" : "NOT configured"}`);
  console.log(`  Brave Search: ${BRAVE_API_KEY ? "configured" : "NOT configured"}`);
});
