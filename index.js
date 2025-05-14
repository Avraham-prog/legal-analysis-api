import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import legalAssistantRouter from './controllers/legal-assistant.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/legal-assistant', legalAssistantRouter);

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Legal API running on port ${PORT}`);
});
