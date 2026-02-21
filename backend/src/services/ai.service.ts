import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json', // Forces Gemini to output pure JSON
    }
});

// Type definitions for AI responses
export interface SummaryResponse {
    executive: string;
    detailed: string;
    bulletPoints: string[];
}

export interface ActionItem {
    description: string;
    assignee: string | null;
    dueDate: string | null;
    priority: 'high' | 'medium' | 'low';
}

export interface Decision {
    description: string;
    consensus: 'unanimous' | 'majority' | 'contested';
}

export interface Topic {
    name: string;
    relevance: number;
}

export interface SentimentAnalysis {
    score: number;
    magnitude: number;
    primaryEmotion: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export interface AIAnalysisResult {
    summary: SummaryResponse;
    actionItems: ActionItem[];
    decisions: Decision[];
    topics: Topic[];
    sentiment: SentimentAnalysis;
    suggestedTitle?: string;
}

// Relaxed validation schemas — accept what Gemini gives us
const SummarySchema = z.object({
    executive: z.string().min(1),
    detailed: z.string().min(1),
    bulletPoints: z.array(z.string()).min(1)
});

const ActionItemSchema = z.object({
    description: z.string(),
    assignee: z.string().nullable(),
    dueDate: z.string().nullable(),
    priority: z.enum(['high', 'medium', 'low'])
});

const DecisionSchema = z.object({
    description: z.string(),
    consensus: z.enum(['unanimous', 'majority', 'contested'])
});

const TopicSchema = z.object({
    name: z.string(),
    relevance: z.number().min(0).max(1)
});

const SentimentSchema = z.object({
    score: z.number().min(-1).max(1),
    magnitude: z.number().min(0).max(1),
    primaryEmotion: z.enum(['positive', 'negative', 'neutral', 'mixed'])
});

const AIAnalysisSchema = z.object({
    summary: SummarySchema,
    actionItems: z.array(ActionItemSchema),
    decisions: z.array(DecisionSchema),
    topics: z.array(TopicSchema),
    sentiment: SentimentSchema,
    suggestedTitle: z.string().optional()
});

export class AIService {
    private model: GenerativeModel;

    constructor() {
        this.model = model;
    }

    private buildPrompt(transcript: string): string {
        return `You are an expert meeting analyst. Analyze the following meeting transcript and return a JSON object.

TRANSCRIPT:
${transcript}

Return this exact JSON structure:
{
  "summary": {
    "executive": "2-3 sentence executive summary of the meeting",
    "detailed": "Detailed multi-paragraph summary of the meeting",
    "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"]
  },
  "actionItems": [
    {
      "description": "Task description",
      "assignee": "Person name or null",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "high"
    }
  ],
  "decisions": [
    {
      "description": "What was decided",
      "consensus": "unanimous"
    }
  ],
  "topics": [
    {
      "name": "Topic discussed",
      "relevance": 0.9
    }
  ],
  "sentiment": {
    "score": 0.5,
    "magnitude": 0.5,
    "primaryEmotion": "positive"
  },
  "suggestedTitle": "Meeting title suggestion"
}

IMPORTANT RULES:
- Base ALL content strictly on what is in the transcript. Do not invent information.
- priority must be one of: "high", "medium", "low"
- consensus must be one of: "unanimous", "majority", "contested"
- primaryEmotion must be one of: "positive", "negative", "neutral", "mixed"
- score ranges from -1.0 to 1.0, magnitude from 0.0 to 1.0
- Use null for unknown values, empty arrays [] if no items exist
- bulletPoints must have at least 1 item`;
    }

    async analyzeMeeting(transcript: string): Promise<AIAnalysisResult> {
        console.log('[AI] Starting analysis, transcript length:', transcript.length);
        console.log('[AI] Using model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash');
        console.log('[AI] API Key present:', !!process.env.GEMINI_API_KEY);

        try {
            const prompt = this.buildPrompt(transcript);

            console.log('[AI] Calling Gemini API...');
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('[AI] Got response, length:', text.length);
            console.log('[AI] Response preview:', text.substring(0, 200));

            // Parse the JSON — responseMimeType ensures it's pure JSON
            let parsed: any;
            try {
                parsed = JSON.parse(text);
            } catch (parseError) {
                console.error('[AI] JSON parse failed, trying to extract...');
                console.error('[AI] Raw text:', text.substring(0, 500));
                // Try extracting from markdown fences as fallback
                const extracted = this.extractJSON(text);
                parsed = JSON.parse(extracted);
            }

            console.log('[AI] Parsed JSON keys:', Object.keys(parsed));

            // Validate with Zod
            const validated = AIAnalysisSchema.parse(parsed);
            console.log('[AI] ✅ Analysis validated successfully');
            return validated;

        } catch (error: any) {
            console.error('[AI] ❌ Analysis failed:', error.message || error);

            if (error?.message?.includes('API key')) {
                console.error('[AI] CRITICAL: Gemini API Key is missing or invalid!');
            }
            if (error?.status === 404) {
                console.error(`[AI] CRITICAL: Model "${process.env.GEMINI_MODEL}" not found. Check GEMINI_MODEL in .env`);
            }
            if (error?.issues) {
                // Zod validation error
                console.error('[AI] Zod validation errors:', JSON.stringify(error.issues, null, 2));
            }

            throw error; // Let the route handler deal with it
        }
    }

    /**
     * Extracts JSON from text that may be wrapped in markdown code fences.
     */
    private extractJSON(text: string): string {
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch && fenceMatch[1]) {
            return fenceMatch[1].trim();
        }
        // Try finding a JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
        }
        throw new Error('No JSON found in response');
    }

    async generateQuickSummary(transcript: string): Promise<string> {
        try {
            const prompt = `Summarize this meeting in 2-3 sentences: ${transcript}`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Quick summary failed:', error);
            return 'Summary generation failed. Please try again.';
        }
    }
}

// Export singleton instance
export const aiService = new AIService();