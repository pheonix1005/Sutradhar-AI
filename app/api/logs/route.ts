import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Log } from '@/lib/models/Log';

export async function GET() {
    try {
        await connectToDatabase();
        const logs = await Log.find().sort({ timestamp: -1 }).limit(20);
        return NextResponse.json(logs.reverse());
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'An error occurred while fetching logs.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { agentName, agentRole, type, message, details, outputType, timestamp } = body;

        const newLog = new Log({
            agentName,
            agentRole,
            type,
            message,
            details,
            outputType,
            timestamp: timestamp || new Date(),
            isPreset: body.isPreset || false
        });
        const savedLog = await newLog.save();

        const userLogs = await Log.find({ isPreset: { $ne: true } }).sort({ timestamp: 1 });
        if (userLogs.length > 4) {
            const logsToDelete = userLogs.slice(0, userLogs.length - 4);
            await Log.deleteMany({ _id: { $in: logsToDelete.map(l => l._id) } });
        }

        return NextResponse.json(savedLog, { status: 201 });
    } catch (error) {
        console.error('Error saving log:', error);
        return NextResponse.json({ error: 'An error occurred while saving the log entry.' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await connectToDatabase();
        await Log.deleteMany({ isPreset: { $ne: true } });
        return NextResponse.json({ message: 'User logs cleared successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error clearing logs:', error);
        return NextResponse.json({ error: 'An error occurred while clearing logs.' }, { status: 500 });
    }
}
