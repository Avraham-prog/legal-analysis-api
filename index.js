import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import legalAssistantRouter from './controllers/legal-assistant.js';

dotenv.config();

const app = express();

// CORS configuration to allow requests from Vercel frontend
app.use(cors({
  origin: 'https://copyright-checker.vercel.app',
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: false
}));

// Middleware to parse JSON
app.use(express.json());

// API routes
app.use('/api/legal-assistant', legalAssistantRouter);

// Server start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Legal API running on port ${PORT}`);
});
