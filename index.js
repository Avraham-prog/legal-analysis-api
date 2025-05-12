const express = require('express');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');

dotenv.config();

const app = express();
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (token !== process.env.LEGAL_ANALYSIS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!url) {
    return res.status(400).json({ error: 'Missing audio URL' });
  }

  const prompt = `בדוק האם קובץ מוזיקה שנמצא בקישור הבא (${url}) כולל תוכן המוגן בזכויות יוצרים לפי החוק בישראל. 
התבסס על חוק זכויות יוצרים התשס״ח-2007 (ויקיטקסט: https://he.wikisource.org/wiki/חוק_זכויות_יוצרים) 
ונתח האם מותר לעשות שימוש ביצירה זו בפרסומת מסחרית.
אם ניתן, פרט האם נדרש רישיון או החרגות לפי סעיף "שימוש הוגן", "השראה", "העתקה מהותית" או סימן מסחר.
סכם את עמדתך המשפטית בשפה פשוטה למנהלי שיווק.`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'אתה עורך דין מומחה בזכויות יוצרים' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    const answer = completion.data.choices[0].message.content;
    res.json({ summary: answer });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Failed to analyze legal content' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Legal API running on port ${PORT}`));
