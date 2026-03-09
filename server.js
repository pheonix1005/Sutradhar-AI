require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API (Make sure to set GEMINI_API_KEY in your .env file)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001; // Using 3001 to avoid conflicting with frontend dev servers

// Allow requests from all origins during development
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection string — loaded from .env (never hardcode credentials!)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Define the Agent Schema
const agentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    personality: {
        type: String,
        default: 'professional',
    },
    customInstructions: {
        type: String,
        default: '',
    },
    outputType: {
        type: String,
        enum: ['markdown', 'pdf', 'txt', 'email'],
        default: 'markdown',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isPreset: {
        type: Boolean,
        default: false,
    }
});

// Create the Agent Model
const Agent = mongoose.model('Agent', agentSchema);

// Define the Pipeline Schema
const pipelineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    nodes: {
        type: Array, // Stores AgentNode[]
        required: true,
    },
    connections: {
        type: Array, // Stores Connection[]
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isPreset: {
        type: Boolean,
        default: false,
    }
});

// Create the Pipeline Model
const Pipeline = mongoose.model('Pipeline', pipelineSchema);

// Define the Log Schema
const logSchema = new mongoose.Schema({
    agentName: String,
    agentRole: String,
    type: {
        type: String,
        enum: ['thinking', 'action', 'output', 'error', 'complete'],
        required: true
    },
    message: String,
    details: String,
    outputType: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
    isPreset: {
        type: Boolean,
        default: false,
    }
});

// Create the Log Model
const Log = mongoose.model('Log', logSchema);

// --- API Routes ---

// Root route
app.get('/', (req, res) => {
    res.send('Sutradhar AI Agents API is running!');
});

// 1) POST /api/agents
// Save a new agent's name and role
app.post('/api/agents', async (req, res) => {
    try {
        const { name, role, personality, customInstructions, outputType } = req.body;

        if (!name || !role) {
            return res.status(400).json({ error: 'Both name and role are required fields.' });
        }

        const newAgent = new Agent({
            name,
            role,
            personality,
            customInstructions,
            outputType,
            isPreset: req.body.isPreset || false
        });
        const savedAgent = await newAgent.save();

        // Strict Limit: Max 2 User Agents
        const userAgents = await Agent.find({ isPreset: { $ne: true } }).sort({ createdAt: 1 });
        if (userAgents.length > 2) {
            const agentsToDelete = userAgents.slice(0, userAgents.length - 2);
            await Agent.deleteMany({ _id: { $in: agentsToDelete.map(a => a._id) } });
        }

        res.status(201).json({ message: 'Agent created successfully', agent: savedAgent });
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'An error occurred while creating the agent.' });
    }
});

// 2) GET /api/agents
// Fetch the list of agents
app.get('/api/agents', async (req, res) => {
    try {
        const agents = await Agent.find().sort({ createdAt: -1 }); // Sort by newest first
        res.status(200).json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'An error occurred while fetching agents.' });
    }
});

// 3) POST /api/chat
// Send a prompt to Gemini and return the response
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, agentName, agentRole, personality, pipelineContext, customInstructions } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        const systemPrompt = `You are a professional AI agent named "${agentName || 'Sutradhar Agent'}".
Your specific role is: ${agentRole || 'General Assistant'}.
Your personality style is: ${personality || 'Professional'}.
${pipelineContext ? `You are part of a multi-agent pipeline: ${pipelineContext}.` : ''}
${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

CRITICAL: You must always respond using extremely rich and professional Markdown formatting. 
1. Use headings (##, ###), stylized lists, and bold text.
2. If appropriate for the document type (e.g., reports, schedules), include Markdown tables.
3. You MUST include at least one relevant, high-quality image placeholder using Unsplash. Format: ![Descriptive Alt Text](https://source.unsplash.com/800x400/?<relevant-keyword>)
Make the output look like a premium, ready-to-publish document.`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.status(200).json({ response: responseText });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'An error occurred while communicating with Gemini.' });
    }
});

// 4) GET /api/pipelines
// Fetch all saved pipelines
app.get('/api/pipelines', async (req, res) => {
    try {
        const pipelines = await Pipeline.find().sort({ createdAt: -1 });
        res.status(200).json(pipelines);
    } catch (error) {
        console.error('Error fetching pipelines:', error);
        res.status(500).json({ error: 'An error occurred while fetching pipelines.' });
    }
});

// 5) POST /api/pipelines
// Save a new pipeline structure
app.post('/api/pipelines', async (req, res) => {
    try {
        const { name, nodes, connections } = req.body;

        if (!name || !nodes || !connections) {
            return res.status(400).json({ error: 'Name, nodes, and connections are required.' });
        }

        const newPipeline = new Pipeline({
            name,
            nodes,
            connections,
            isPreset: req.body.isPreset || false
        });
        const savedPipeline = await newPipeline.save();

        // Strict Limit: Max 2 User Pipelines
        const userPipelines = await Pipeline.find({ isPreset: { $ne: true } }).sort({ createdAt: 1 });
        if (userPipelines.length > 2) {
            const pipelinesToDelete = userPipelines.slice(0, userPipelines.length - 2);
            await Pipeline.deleteMany({ _id: { $in: pipelinesToDelete.map(p => p._id) } });
        }

        res.status(201).json({ message: 'Pipeline saved successfully', pipeline: savedPipeline });
    } catch (error) {
        console.error('Error saving pipeline:', error);
        res.status(500).json({ error: 'An error occurred while saving the pipeline.' });
    }
});

// 6) GET /api/logs
// Fetch latest 20 logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(20);
        res.status(200).json(logs.reverse()); // Return in chronological order for the UI
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'An error occurred while fetching logs.' });
    }
});

// 7) POST /api/logs
// Save a new log entry
app.post('/api/logs', async (req, res) => {
    try {
        const { agentName, agentRole, type, message, details, outputType, timestamp } = req.body;

        const newLog = new Log({
            agentName,
            agentRole,
            type,
            message,
            details,
            outputType,
            timestamp: timestamp || new Date(),
            isPreset: req.body.isPreset || false
        });
        const savedLog = await newLog.save();

        // Strict Limit: Max 4 User Logs
        const userLogs = await Log.find({ isPreset: { $ne: true } }).sort({ timestamp: 1 });
        if (userLogs.length > 4) {
            const logsToDelete = userLogs.slice(0, userLogs.length - 4);
            await Log.deleteMany({ _id: { $in: logsToDelete.map(l => l._id) } });
        }

        res.status(201).json(savedLog);
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ error: 'An error occurred while saving the log entry.' });
    }
});

// 8) DELETE /api/logs
// Clear all non-preset logs
app.delete('/api/logs', async (req, res) => {
    try {
        await Log.deleteMany({ isPreset: { $ne: true } });
        res.status(200).json({ message: 'User logs cleared successfully' });
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ error: 'An error occurred while clearing logs.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});
