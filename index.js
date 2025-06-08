// index.js (CommonJS style)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const legalAssistantRouter = require('./controllers/legal-assistant');

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

if (!process.env.LEGAL_ANALYSIS_API_KEY) {
  throw new Error('LEGAL_ANALYSIS_API_KEY environment variable is not set');
}

const app = express();

const allowedOrigins = [
  'https://copyright-checker.vercel.app',
  'https://copyright-checker-p8on364h-avrahams-projects-793b488c.vercel.app',
  'https://copyright-checker-g6qp4u9gs-avrahams-projects-793b488c.vercel.app',
  'https://copyright-checker-beige.vercel.app',
  'https://copyright-checker-3qgp4a7qy-avrahams-projects-793b488c.vercel.app',
  'https://copyright-checker-kmkhkrqc9-avrahams-projects-793b488c.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🔍 בקשה הגיעה מ־Origin:', origin);
      console.log('📌 רשימת origins מותרים:', allowedOrigins);
      if (!origin || allowedOrigins.includes(origin)) {
        console.log('✅ מאושר על ידי CORS');
        callback(null, true);
      } else {
        console.error('❌ חסום על ידי CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());
app.use('/api/legal-assistant', legalAssistantRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Legal API running on port ${PORT}`);
});
