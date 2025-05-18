import express from 'express';
import formidable from 'formidable';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(500).json({ error: 'Form parsing failed' });
    }

    const prompt = fields.prompt;
    const file = files.file;

    if (!prompt && !file) {
      return res.status(400).json({ error: 'Missing prompt or file' });
    }

    let fileInfo = '';
    if (file && file.originalFilename) {
      fileInfo = `\n\nהמשתמש העלה קובץ בשם \"${file.originalFilename}\". יש לבדוק האם יש חשש להפרת זכויות יוצרים בקובץ זה.`;
    }

    try {
      const fullPrompt = `
אתה עורך דין מומחה לדיני קניין רוחני וזכויות יוצרים בישראל, ארה\"ב ואירופה. המשתמש מבקש לבדוק האם יש בעיה משפטית בשימוש הבא:

${prompt}${fileInfo}

נא נתח את הסיכון המשפטי, התייחס למקורות חוקיים ופסיקה רלוונטית אם יש, וציין האם נדרש רישיון, אישור או שינוי כלשהו.
סיים את התשובה בהמלצה ברורה בשפה פשוטה.`;

    const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: prompt || "נתח את התמונה המצורפת" },
        ...(image ? [{ type: "image_url", image_url: { url: image } }] : []),
      ],
    },
  ],
  max_tokens: 1000,
});


      const summary = response.choices[0]?.message?.content || '❌ לא התקבלה תשובה מהשרת המשפטי.';
      res.json({ summary });
    } catch (e) {
      console.error('OpenAI error:', e);
      res.status(500).json({ error: 'Legal analysis failed' });
    }
  });
});

export default router;
