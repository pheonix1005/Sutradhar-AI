import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Agent } from '@/lib/models/Agent';

export async function GET() {
    try {
        await connectToDatabase();
        const agents = await Agent.find().sort({ createdAt: -1 });
        return NextResponse.json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'An error occurred while fetching agents.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { name, role, personality, customInstructions, outputType } = body;

        if (!name || !role) {
            return NextResponse.json({ error: 'Both name and role are required fields.' }, { status: 400 });
        }

        const newAgent = new Agent({
            name,
            role,
            personality,
            customInstructions,
            outputType,
            isPreset: body.isPreset || false
        });
        const savedAgent = await newAgent.save();

        const userAgents = await Agent.find({ isPreset: { $ne: true } }).sort({ createdAt: 1 });
        if (userAgents.length > 2) {
            const agentsToDelete = userAgents.slice(0, userAgents.length - 2);
            await Agent.deleteMany({ _id: { $in: agentsToDelete.map(a => a._id) } });
        }

        return NextResponse.json({ message: 'Agent created successfully', agent: savedAgent }, { status: 201 });
    } catch (error) {
        console.error('Error creating agent:', error);
        return NextResponse.json({ error: 'An error occurred while creating the agent.' }, { status: 500 });
    }
}
