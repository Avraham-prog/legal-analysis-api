import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import legalAssistantRouter from './controllers/legal-assistant.js';

dotenv.config();

const app = express();

// Middlewares
const allowedOrigins = [
  'https://copyright-checker.vercel.app',
  'https://copyright-checker-p8on364h-avrahams-projects-793b488c.vercel.app',
  'https://copyright-checker-beige.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔍 בקשה הגיעה מ־Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        console.log("✅ מאושר על ידי CORS");
        callback(null, true);
      } else {
        console.error("❌ חסום על ידי CORS:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

// Routes
app.use('/api/legal-assistant', legalAssistantRouter);

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Legal API running on port ${PORT}`);
});
