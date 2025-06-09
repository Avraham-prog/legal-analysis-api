const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.analyzeImage = async (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `אתה מנוע תיאור תמונה בלבד. אנא תאר את מה שמופיע בתמונה בצורה אובייקטיבית לצורך ניתוח משפטי עתידי. תאר דמויות, טקסט, לוגואים, עיצוב, צבעים וסביבה. אל תספק ניתוח משפטי.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageBase64}`
            }
          ]
        }
      ],
      max_tokens: 700
    });

    const caption = response.choices[0].message.content;
    return { caption };

  } catch (err) {
    console.error("Error analyzing image:", err);
    throw err;
  }
};
