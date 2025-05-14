const express = require("express");
const router = express.Router();
const formidable = require("formidable");
const fs = require("fs");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/legal-assistant", (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Form parsing failed" });
    }

    const prompt = fields.prompt;
    const file = files.file;

    if (!prompt && !file) {
      return res.status(400).json({ error: "Missing prompt or file" });
    }

    let fileInfo = "";
    if (file) {
      fileInfo = `\n\nהמשתמש העלה קובץ בשם \"${file.originalFilename}\". יש לבדוק האם יש חשש להפרת זכויות יוצרים בקובץ זה.`;
    }

    try {
      const fullPrompt = `
אתה עורך דין מומחה לדיני קניין רוחני וזכויות יוצרים בישראל, ארה\"ב ואירופה. המשתמש מבקש לבדוק האם יש בעיה משפטית בשימוש הבא:

${prompt}${fileInfo}

נא נתח את הסיכון המשפטי, התייחס למקורות חוקיים ופסיקה רלוונטית אם יש, וציין האם נדרש רישיון, אישור או שינוי כלשהו.
סיים את התשובה בהמלצה ברורה בשפה פשוטה.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.5,
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
