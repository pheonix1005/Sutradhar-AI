import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Pipeline } from '@/lib/models/Pipeline';

export async function GET() {
    try {
        await connectToDatabase();
        const pipelines = await Pipeline.find().sort({ createdAt: -1 });
        return NextResponse.json(pipelines);
    } catch (error) {
        console.error('Error fetching pipelines:', error);
        return NextResponse.json({ error: 'An error occurred while fetching pipelines.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { name, nodes, connections } = body;

        if (!name || !nodes || !connections) {
            return NextResponse.json({ error: 'Name, nodes, and connections are required.' }, { status: 400 });
        }

        const newPipeline = new Pipeline({
            name,
            nodes,
            connections,
            isPreset: body.isPreset || false
        });
        const savedPipeline = await newPipeline.save();

        const userPipelines = await Pipeline.find({ isPreset: { $ne: true } }).sort({ createdAt: 1 });
        if (userPipelines.length > 2) {
            const pipelinesToDelete = userPipelines.slice(0, userPipelines.length - 2);
            await Pipeline.deleteMany({ _id: { $in: pipelinesToDelete.map(p => p._id) } });
        }

        return NextResponse.json({ message: 'Pipeline saved successfully', pipeline: savedPipeline }, { status: 201 });
    } catch (error) {
        console.error('Error saving pipeline:', error);
        return NextResponse.json({ error: 'An error occurred while saving the pipeline.' }, { status: 500 });
    }
}
