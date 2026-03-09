require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection string — loaded from .env
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

// Schemas
const agentSchema = new mongoose.Schema({
    name: String, role: String, personality: String, customInstructions: String,
    outputType: String, createdAt: { type: Date, default: Date.now }, isPreset: Boolean
});
const pipelineSchema = new mongoose.Schema({
    name: String, nodes: Array, connections: Array, createdAt: { type: Date, default: Date.now }, isPreset: Boolean
});
const logSchema = new mongoose.Schema({
    agentName: String, agentRole: String, type: String, message: String,
    details: String, outputType: String, timestamp: { type: Date, default: Date.now }, isPreset: Boolean
});

const Agent = mongoose.model('Agent', agentSchema);
const Pipeline = mongoose.model('Pipeline', pipelineSchema);
const Log = mongoose.model('Log', logSchema);

async function seedDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected. Clearing old data...");

        // Clear everything
        await Agent.deleteMany({});
        await Pipeline.deleteMany({});
        await Log.deleteMany({});

        console.log("Seeding Presets...");

        // 1. Seed Agents
        const agents = await Agent.insertMany([
            {
                name: "Maya Sharma",
                role: "Marketing Director",
                personality: "professional",
                customInstructions: "Focus on brand voice and conversion metrics. Use data-driven insights.",
                outputType: "markdown",
                isPreset: true
            },
            {
                name: "Rahul Tech",
                role: "Support Specialist",
                personality: "friendly",
                customInstructions: "Always be highly empathetic. End with a polite sign-off.",
                outputType: "email",
                isPreset: true
            },
            {
                name: "DataBot 9000",
                role: "Data Analyst",
                personality: "concise",
                customInstructions: "Provide only raw facts, charts, and bullet points. No fluff.",
                outputType: "markdown",
                isPreset: true
            },
            {
                name: "Kavya S.",
                role: "Content Strategist",
                personality: "creative",
                customInstructions: "Use vivid imagery and strong engaging hooks for blog posts.",
                outputType: "markdown",
                isPreset: true
            }
        ]);
        console.log(`Inserted ${agents.length} preset agents.`);

        // 2. Seed Pipelines
        const pipelines = await Pipeline.insertMany([
            {
                name: "Product Launch Sequence",
                nodes: [
                    { id: "node-1", name: "Kavya S.", role: "Content Strategist", iconType: "file", status: "idle", x: 250, y: 150 },
                    { id: "node-2", name: "Maya Sharma", role: "Marketing Director", iconType: "globe", status: "idle", x: 550, y: 150 }
                ],
                connections: [
                    { id: "c-1", from: "node-1", to: "node-2" }
                ],
                isPreset: true
            },
            {
                name: "Customer Feedback Loop",
                nodes: [
                    { id: "node-3", name: "Rahul Tech", role: "Support Specialist", iconType: "mail", status: "idle", x: 250, y: 300 },
                    { id: "node-4", name: "DataBot 9000", role: "Data Analyst", iconType: "database", status: "idle", x: 550, y: 300 }
                ],
                connections: [
                    { id: "c-2", from: "node-3", to: "node-4" }
                ],
                isPreset: true
            }
        ]);
        console.log(`Inserted ${pipelines.length} preset pipelines.`);

        // 3. Seed Logs (Historical Story)
        const past = Date.now() - 1000 * 60 * 60; // 1 hour ago
        const logs = await Log.insertMany([
            {
                agentName: "System",
                agentRole: "Task Manager",
                type: "action",
                message: 'New task assigned: "Write a launch email for the new organic Assam Tea collection."',
                details: "Sending to pipeline: Product Launch Sequence",
                timestamp: new Date(past),
                isPreset: true
            },
            {
                agentName: "Kavya S.",
                agentRole: "Content Strategist",
                type: "thinking",
                message: "Analysing tone and drafting content...",
                details: "Focusing on heritage and organic origins.",
                timestamp: new Date(past + 5000),
                isPreset: true
            },
            {
                agentName: "Maya Sharma",
                agentRole: "Marketing Director",
                type: "output",
                message: "Task completed — Campaign approved",
                details: "# 🌿 Introducing Our Heritage Assam Tea\n\nExperience the rich, organic roots of the North East in every cup. \n\n* Available starting tomorrow at 10 AM.",
                outputType: "markdown",
                timestamp: new Date(past + 12000),
                isPreset: true
            },
            {
                agentName: "System",
                agentRole: "Task Manager",
                type: "complete",
                message: "Task processed successfully",
                details: "Pipeline: Product Launch Sequence",
                timestamp: new Date(past + 13000),
                isPreset: true
            }
        ]);
        console.log(`Inserted ${logs.length} preset logs.`);

        console.log("✅ Database seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
