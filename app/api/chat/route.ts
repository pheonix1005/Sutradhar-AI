import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, agentName, agentRole, personality, pipelineContext, customInstructions } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
        }

        const systemPrompt = `You are a professional AI agent named "${agentName || 'Sutradhar Agent'}".
Your specific role is: ${agentRole || 'General Assistant'}.
Your personality style is: ${personality || 'Professional'}.
${pipelineContext ? `You are part of a multi-agent pipeline: ${pipelineContext}.` : ''}
${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

CRITICAL: You must always respond using extremely rich and professional Markdown formatting. 
1. Use headings (##, ###), stylized lists, and bold text.
2. If appropriate for the document type (e.g., reports, schedules), include Markdown tables.
3. You MUST include at least one relevant, high-quality image. Format: ![Descriptive Alt Text](https://loremflickr.com/800/400/<single-keyword>) Make sure the <single-keyword> is just one word without spaces.
Make the output look like a premium, ready-to-publish document.`;

        const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({ response: responseText }, { status: 200 });
    } catch (error: any) {
        console.error('Error in /api/chat:', error);
        return NextResponse.json({ error: `An error occurred while communicating with Gemini: ${error.message || error}` }, { status: 500 });
    }
}
