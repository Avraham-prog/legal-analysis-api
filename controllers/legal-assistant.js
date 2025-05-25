const express = require("express");
const router = express.Router();
const formidable = require("formidable");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/legal-assistant", (req, res) => {
  const form = formidable({ multiples: false });

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
      const fullPrompt = `
אתה עורך דין מומחה לדיני קניין רוחני וזכויות יוצרים בישראל, ארה\"ב ואירופה. המשתמש מבקש לבדוק האם יש בעיה משפטית בשימוש הבא:

${prompt}

אם צורפה תמונה או מדיה, נא נתח את התוכן גם לפי ההקשר החזותי.`;

      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: fullPrompt },
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
