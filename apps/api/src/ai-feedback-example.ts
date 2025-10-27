import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

app.get('/', (req, res) => {
  res.json({ message: 'ITPathfinder API is running!' });
});

// User registration endpoint
app.post('/auth/signup', async (req, res) => {
  // ...existing code...
});

// User login endpoint
app.post('/auth/login', async (req, res) => {
  // ...existing code...
});

// Start assessment: fetch random questions
app.get('/assessments/start', async (req, res) => {
  // ...existing code...
});

// Submit assessment: store answers and score vector
app.post('/assessments/submit', async (req, res) => {
  // ...existing code...
});

// Get user info by ID
app.get('/users/:id', async (req, res) => {
  // ...existing code...
});

// Get all users
app.get('/users', async (req, res) => {
  // ...existing code...
});

// Stats endpoint for homepage
app.get('/stats', async (req, res) => {
  // ...existing code...
});

// AI-powered feedback endpoint using DeepAI
app.post('/results/ai-feedback', async (req, res) => {
  const { scoreVector, user } = req.body;
  if (!scoreVector) {
    return res.status(400).json({ error: 'Missing scoreVector' });
  }
  // Prepare prompt for DeepAI
  const prompt = `You are an IT career mentor. Analyze the following assessment results and provide:\n1. A summary of the user's strengths and weaknesses\n2. Personalized course recommendations\n3. Next steps for their IT learning journey\nAssessment scores (0-100 per skill):\n${JSON.stringify(scoreVector, null, 2)}\nUser info: ${user ? JSON.stringify(user) : 'N/A'}\nRespond in clear, friendly language.`;
  try {
    const apiKey = process.env.DEEPAI_API_KEY ?? '';
    if (!apiKey) {
      return res.status(500).json({ error: 'DeepAI API key not set.' });
    }
    const deepaiRes = await fetch('https://api.deepai.org/api/text-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Api-Key': apiKey
      },
      body: `text=${encodeURIComponent(prompt)}`
    });
    const result = (await deepaiRes.json()) as { output?: string };
    const feedback = result.output || 'No feedback generated.';
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate AI feedback.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
