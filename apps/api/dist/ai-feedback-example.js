"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
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
    var _a;
    const { scoreVector, user } = req.body;
    if (!scoreVector) {
        return res.status(400).json({ error: 'Missing scoreVector' });
    }
    // Prepare prompt for DeepAI
    const prompt = `You are an IT career mentor. Analyze the following assessment results and provide:\n1. A summary of the user's strengths and weaknesses\n2. Personalized course recommendations\n3. Next steps for their IT learning journey\nAssessment scores (0-100 per skill):\n${JSON.stringify(scoreVector, null, 2)}\nUser info: ${user ? JSON.stringify(user) : 'N/A'}\nRespond in clear, friendly language.`;
    try {
        const apiKey = (_a = process.env.DEEPAI_API_KEY) !== null && _a !== void 0 ? _a : '';
        if (!apiKey) {
            return res.status(500).json({ error: 'DeepAI API key not set.' });
        }
        const deepaiRes = await (0, node_fetch_1.default)('https://api.deepai.org/api/text-generator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Api-Key': apiKey
            },
            body: `text=${encodeURIComponent(prompt)}`
        });
        const result = (await deepaiRes.json());
        const feedback = result.output || 'No feedback generated.';
        res.json({ feedback });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate AI feedback.' });
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});
