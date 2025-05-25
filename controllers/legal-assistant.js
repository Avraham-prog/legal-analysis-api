const express = require("express");
const router = express.Router();
const { IncomingForm } = require("formidable");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", (req, res) => {
  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Form parsing failed" });
    }

    const prompt = fields.prompt;
    const image = fields.image;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Missing prompt or image" });
    }

    try {
      const messages = [
        {
          role: "system",
          content: `אתה עורך דין מומחה לדיני קניין רוחני וזכויות יוצרים בישראל, ארה\"ב ואירופה. עליך לנתח את השאלה או התיאור שמספק המשתמש, ואם צורפה תמונה – נתח אותה גם כן. אם אין בעיה משפטית, נא לציין זאת בפירוש.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: String(prompt) },
            ...(image ? [{ type: "image_url", image_url: { url: String(image) } }] : []),
          ],
        },
      ];

      const response = await openai.chat.completions.create({
        model: image ? "gpt-4o" : "gpt-4",
        messages,
        temperature: 0.5,
        max_tokens: 1000,
      });

      const summary = response.choices[0]?.message?.content || "❌ לא התקבלה תשובה מהשרת המשפטי.";
      res.json({ summary });
    } catch (e) {
      console.error("OpenAI error:", e);
      res.status(500).json({ error: "Legal analysis failed" });
    }
  });
});

module.exports = router;
