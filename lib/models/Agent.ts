import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
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

// Since Next.js creates API routes that can be hot-reloaded, we need to check if the model exists before compiling it.
export const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
