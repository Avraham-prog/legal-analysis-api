const express = require("express");
const router = express.Router();
const { IncomingForm } = require("formidable");
const { OpenAI } = require("openai");
const axios = require("axios");
const fs = require("fs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const isValidImageUrl = (url) => {
  return (
    typeof url === "string" &&
    url.startsWith("https://") &&
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const fetchImageAsBase64 = async (url) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data).toString("base64");
    const mime = response.headers["content-type"];
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.warn("⚠️ שגיאה בהמרת תמונה ל-base64:", e.message);
    return null;
  }
};

const messageHasImage = (messages) => {
  return messages.some(
    (msg) =>
      Array.isArray(msg.content) &&
      msg.content.some(
        (item) =>
          item.type === "image_url" &&
          item.image_url &&
          typeof item.image_url.url === "string" &&
          item.image_url.url.startsWith("data:image/")
      )
  );
};

const lastImageBySession = new Map();

const getBase64ImageToUse = async (files, image, lastImageUrl, sessionId) => {
  // 1. File upload
  if (files.image && files.image.filepath) {
    try {
      const buffer = fs.readFileSync(files.image.filepath);
      const mime = files.image.mimetype || "image/jpeg";
      console.log("✅ תמונה נטענה מקובץ");
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch (e) {
      console.warn("⚠️ שגיאה בקריאת קובץ תמונה:", e.message);
    }
  }

  // 2. Direct image URL
  if (isValidImageUrl(image)) {
    const base64 = await fetchImageAsBase64(image);
    if (base64) {
      lastImageBySession.set(sessionId, image);
      console.log("✅ תמונה הומרה מ־URL");
      return base64;
    }
  }

  // 3. Use last image
  if (isValidImageUrl(lastImageUrl)) {
    const base64 = await fetchImageAsBase64(lastImageUrl);
    if (base64) {
      console.log("✅ תמונה מהיסטוריה הומרה ל־base64");
      return base64;
    }
  }

  return null;
};

router.post("/", (req, res) => {
  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Form parsing failed" });
    }

    const prompt = fields.prompt;
    const rawImage = fields.image;
    const image = typeof rawImage === "string" ? rawImage.trim() : null;
    const historyRaw = fields.history;
    const sessionId = fields.sessionId || "default";

    if (!prompt && !image && !files.image) {
      return res.status(400).json({ error: "Missing prompt or image" });
    }

    const messages = [];

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

    let lastImageUrl = lastImageBySession.get(sessionId) || null;

    if (historyRaw) {
      try {
        const history = JSON.parse(historyRaw);
        for (const msg of history) {
          if (msg?.type === "user") {
            const content = [];
            if (msg.prompt) {
              content.push({ type: "text", text: msg.prompt });
            }
            if (isValidImageUrl(msg.imageUrl)) {
              lastImageUrl = msg.imageUrl;
              lastImageBySession.set(sessionId, msg.imageUrl);
              const base64Image = await fetchImageAsBase64(msg.imageUrl);
              if (base64Image) {
                content.push({ type: "image_url", image_url: { url: base64Image } });
              }
            }
            if (content.length > 0) {
              messages.push({ role: "user", content });
            }
          } else if (msg?.type === "bot" && msg.response) {
            messages.push({ role: "assistant", content: msg.response });
          }
        }
      } catch (e) {
        console.warn("⚠️ שגיאה בפירוק ההיסטוריה:", e.message);
      }
    }

    const contentArray = [];
    if (prompt) {
      contentArray.push({ type: "text", text: String(prompt) });
    }

    const imageToUse = await getBase64ImageToUse(files, image, lastImageUrl, sessionId);
    if (imageToUse) {
      contentArray.push({ type: "image_url", image_url: { url: imageToUse } });
    }

    if (contentArray.length > 0) {
      messages.push({ role: "user", content: contentArray });
    }

    messages.forEach((msg) => {
      if (Array.isArray(msg.content)) {
        msg.content = msg.content.filter((item) => {
          if (item.type === "text") return true;
          if (
            item.type === "image_url" &&
            item.image_url &&
            typeof item.image_url.url === "string" &&
            item.image_url.url.startsWith("data:image/")
          ) {
            return true;
          }
          return false;
        });
      }
    });

    console.log("📤 messages שנשלחות ל־OpenAI:");
    console.dir(messages, { depth: null });

    const useGpt4o = messageHasImage(messages);
    console.log("🔍 האם זוהתה תמונה?", useGpt4o);
    console.log("==> Model selected:", useGpt4o ? "gpt-4o" : "gpt-4");

    try {
      const response = await openai.chat.completions.create({
        model: useGpt4o ? "gpt-4o" : "gpt-4",
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
