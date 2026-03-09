import mongoose from 'mongoose';

const PipelineSchema = new mongoose.Schema({
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

export const Pipeline = mongoose.models.Pipeline || mongoose.model('Pipeline', PipelineSchema);
