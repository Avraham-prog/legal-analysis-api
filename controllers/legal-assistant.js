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
          content: `אתה עורך דין מומחה לדיני זכויות יוצרים, סימני מסחר וקניין רוחני לפי הדין בישראל, ארצות הברית והאיחוד האירופי.

המטרה שלך היא לבדוק האם יש בעיה משפטית כלשהי בשימוש בתוכן המתואר בשאלה או בתמונה המצורפת, כגון:
- הפרת זכויות יוצרים (copy infringement)
- שימוש לא מורשה בלוגו, סימן מסחר או עיצוב רשום
- בעיית השראה מהותית (substantial similarity)
- סיכון משפטי עקב שימוש בשמות, פרצופים, מותגים, מוזיקה, גרפיקה, עיצובים, סאונד וכדומה.

הנחיות לתשובתך:
1. אם אין בעיה משפטית – נא לציין זאת במפורש.
2. אם יש בעיה או סיכון – פרט מהו, באיזה חוק הוא רלוונטי (ישראלי/אמריקאי/אירופי), ואילו פעולות מומלצות למזער את הסיכון.
3. אם צורפה תמונה או לינק למדיה – נתח את התוכן החזותי (למשל לוגואים, סגנון עיצוב, דמויות מזוהות, תווי פנים, צבעים מזוהים עם מותג וכו').

ענה כאילו אתה עורך דין אנושי שמסביר בשפה פשוטה לצוות שיווק/פרסום.
אם לא ניתן לחוות דעה משפטית, הסבר מדוע ואילו פרטים חסרים.`,
        },
        {
          role: "user",
          content: [
            ...(prompt ? [{ type: "text", text: String(prompt) }] : []),
            ...(image ? [{ type: "image_url", image_url: { url: String(image) } }] : [])
          ]
        }
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
