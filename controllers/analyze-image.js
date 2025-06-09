const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.analyzeImage = async (req, res) => {
  try {
    const { base64Image, prompt } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const messages = [
      {
        role: "system",
        content: `אתה עורך דין מומחה לדיני זכויות יוצרים, סימני מסחר וקניין רוחני לפי הדין בישראל, ארצות הברית והאיחוד האירופי.

המטרה שלך היא לבדוק האם יש בעיה משפטית כלשהי בתמונה המצורפת, כגון:
- הפרת זכויות יוצרים (copy infringement)
- שימוש לא מורשה בלוגו, סימן מסחר או עיצוב רשום
- בעיית השראה מהותית (substantial similarity)
- סיכון משפטי עקב שימוש בשמות, פרצופים, מותגים, מוזיקה, גרפיקה, עיצובים, סאונד וכדומה.

הנחיות לתשובתך:
1. אם אין בעיה משפטית – נא לציין זאת במפורש.
2. אם יש בעיה או סיכון – פרט מהו, באיזה חוק הוא רלוונטי (ישראלי/אמריקאי/אירופי), ואילו פעולות מומלצות למזער את הסיכון.
3. נתח את התוכן החזותי (לוגואים, סגנון עיצוב, דמויות מזוהות, תווי פנים, צבעים מזוהים עם מותג וכו').

ענה כאילו אתה עורך דין אנושי שמסביר בשפה פשוטה לצוות שיווק/פרסום.`
      }
    ];

    if (prompt) {
      messages.push({ role: "user", content: prompt });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-vision-preview",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.3,
      vision: true,
      messages: [
        ...messages,
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "נתח את התמונה המצורפת" },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        }
      ]
    });

    const result = response.choices[0].message.content;
    res.json({ result });

  } catch (err) {
    console.error("Error analyzing image:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
