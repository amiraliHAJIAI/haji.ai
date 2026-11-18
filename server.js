
import express from "express";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "HAJI AI" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { provider, model, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "پیام خالی است." });
    }

    let reply = "";

    if (provider === "openai") {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: model || "gpt-4.1-mini",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI error");
      reply = data.choices?.[0]?.message?.content || "";
    }

    else if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      const selectedModel = model || "gemini-2.5-flash";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini error");
      reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    }

    else if (provider === "anthropic") {
      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: model || "claude-sonnet-4-5",
            max_tokens: 1024,
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Anthropic error");
      reply = data.content?.map(p => p.text || "").join("") || "";
    }

    else {
      return res.status(400).json({ error: "ارائه‌دهنده نامعتبر است." });
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`HAJI AI running on port ${port}`);
});
