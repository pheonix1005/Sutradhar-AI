import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
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

export const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);
