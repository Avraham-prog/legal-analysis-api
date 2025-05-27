const express = require("express");
const router = express.Router();
const { IncomingForm } = require("formidable");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// בדיקת תקפות URL של תמונה
const isValidImageUrl = (url) => {
  return (
    typeof url === "string" &&
    (url.startsWith("https://") || url.startsWith("data:image/")) &&
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

router.post("/", (req, res) => {
  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Form parsing failed" });
    }

    const prompt = fields.prompt;
    const image = fields.image;
    const historyRaw = fields.history;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Missing prompt or image" });
    }

    try {
      const messages = [];

      // הודעת מערכת
      messages.push({
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
אם לא ניתן לחוות דעה משפטית, הסבר מדוע ואילו פרטים חסרים.`
      });

      // שחזור היסטוריה
      if (historyRaw) {
        try {
          const history = JSON.parse(historyRaw);
          history.forEach((msg) => {
            if (msg.type === "user") {
              const content = [];
              if (msg.prompt) {
                content.push({ type: "text", text: msg.prompt });
              }
              if (isValidImageUrl(msg.imageUrl)) {
                content.push({ type: "image_url", image_url: { url: msg.imageUrl } });
              }
              if (content.length > 0) {
                messages.push({ role: "user", content });
              }
            } else if (msg.type === "bot" && msg.response) {
              messages.push({ role: "assistant", content: msg.response });
            }
          });
        } catch (e) {
          console.warn("⚠️ שגיאה בפירוק ההיסטוריה:", e.message);
        }
      }

      // הודעת המשתמש הנוכחית
      const contentArray = [];

      if (prompt) {
        contentArray.push({ type: "text", text: String(prompt) });
      }

      if (isValidImageUrl(image)) {
        contentArray.push({ type: "image_url", image_url: { url: String(image) } });
      }

      if (contentArray.length > 0) {
        messages.push({ role: "user", content: contentArray });
      }

      // סינון נוסף לכל הודעה לפני שליחה ל-OpenAI
      messages.forEach((msg) => {
        if (Array.isArray(msg.content)) {
          msg.content = msg.content.filter((item) => {
            if (item.type === "text") return true;
            if (
              item.type === "image_url" &&
              item.image_url &&
              typeof item.image_url.url === "string" &&
              (item.image_url.url.startsWith("https://") || item.image_url.url.startsWith("data:image/")) &&
              /\.(jpg|jpeg|png|gif|webp)$/i.test(item.image_url.url)
            ) {
              return true;
            }
            return false;
          });
        }
      });

      // הדפסת debug למעקב
      console.log("📤 messages שנשלחות ל־OpenAI:");
      console.dir(messages, { depth: null });

      // בקשת OpenAI
      const response = await openai.chat.completions.create({
        model: image ? "gpt-4o" : "gpt-4",
        messages,
        temperature: 0.5,
        max_tokens: 1000
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
