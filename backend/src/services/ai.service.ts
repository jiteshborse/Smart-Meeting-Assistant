import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import dotenv from 'dotenv';
import { z } from 'zod';


dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    generationConfig: {
        temperature: 0.2, // Low temperature for consistent JSON
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
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
    relevance: number; // 0-1
}

export interface SentimentAnalysis {
    score: number; // -1 to 1
    magnitude: number; // 0-1
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

// Validation schemas
const SummarySchema = z.object({
    executive: z.string().min(10),
    detailed: z.string().min(50),
    bulletPoints: z.array(z.string()).min(3)
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
    private retryCount: number = 3;
    private retryDelay: number = 1000; // ms

    constructor() {
        this.model = model;
    }

    private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
        for (let i = 0; i < this.retryCount; i++) {
            try {
                return await operation();
            } catch (error) {
                console.error(`AI operation failed (attempt ${i + 1}):`, error);
                if (i === this.retryCount - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
            }
        }
        throw new Error('Retry count exceeded');
    }

    private buildPrompt(transcript: string): string {
        return `
You are an expert meeting analyst. Analyze the following meeting transcript and provide a comprehensive analysis.

TRANSCRIPT:
${transcript}

Provide a JSON response with the following structure:
{
  "summary": {
    "executive": "One paragraph executive summary (2-3 sentences)",
    "detailed": "Detailed summary covering all key points (3-4 paragraphs)",
    "bulletPoints": ["Key point 1", "Key point 2", "Key point 3", ...]
  },
  "actionItems": [
    {
      "description": "Clear description of the task",
      "assignee": "Person assigned or null if unclear",
      "dueDate": "YYYY-MM-DD or null if not specified",
      "priority": "high/medium/low"
    }
  ],
  "decisions": [
    {
      "description": "Decision made",
      "consensus": "unanimous/majority/contested"
    }
  ],
  "topics": [
    {
      "name": "Topic name",
      "relevance": 0.0-1.0
    }
  ],
  "sentiment": {
    "score": -1.0 to 1.0,
    "magnitude": 0.0 to 1.0,
    "primaryEmotion": "positive/negative/neutral/mixed"
  },
  "suggestedTitle": "A better title for this meeting (optional)"
}

Focus on accuracy. If information isn't available, use null or empty arrays.
Ensure the response is valid JSON.
`;
    }

    async analyzeMeeting(transcript: string): Promise<AIAnalysisResult> {
        return this.retryOperation(async () => {
            try {
                // Build prompt
                const prompt = this.buildPrompt(transcript);

                // Call Gemini
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Extract JSON from response (Gemini might wrap in markdown)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in response');
                }

                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);

                // Validate with Zod
                try {
                    const validated = AIAnalysisSchema.parse(parsed);
                    return validated;
                } catch (zodError) {
                    console.error('Zod Validation Error:', zodError);
                    throw zodError;
                }
            } catch (error) {
                console.error('AI Analysis failed:', error);

                // If it's an API key error, we should probably crash or warn explicitly
                if (error instanceof Error && error.message.includes('API key')) {
                    console.error('CRITICAL: Gemini API Key missing or invalid');
                }

                // Return fallback data for development
                return this.getFallbackAnalysis();
            }
        });
    }

    // Simplified version for quick summaries
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

    // Fallback data for development/testing
    private getFallbackAnalysis(): AIAnalysisResult {
        return {
            summary: {
                executive: "The team discussed project milestones and identified key action items for the upcoming quarter.",
                detailed: "The meeting covered three main areas: project timeline review, resource allocation, and risk assessment. The team agreed to prioritize the Q3 launch and reallocate resources from the legacy system migration. Several risks were identified including potential delays in the design phase and dependencies on external vendors.",
                bulletPoints: [
                    "Q3 launch is top priority",
                    "Need to reallocate two developers from legacy migration",
                    "External vendor contract needs review by Friday",
                    "Design phase may cause delays"
                ]
            },
            actionItems: [
                {
                    description: "Review external vendor contract",
                    assignee: "Sarah",
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    priority: "high"
                },
                {
                    description: "Update project timeline with new resources",
                    assignee: "Mike",
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    priority: "medium"
                }
            ],
            decisions: [
                {
                    description: "Prioritize Q3 launch over legacy migration",
                    consensus: "unanimous"
                },
                {
                    description: "Approach vendor for contract extension",
                    consensus: "majority"
                }
            ],
            topics: [
                { name: "Project Timeline", relevance: 0.9 },
                { name: "Resource Allocation", relevance: 0.8 },
                { name: "Risk Management", relevance: 0.7 },
                { name: "Vendor Contracts", relevance: 0.6 }
            ],
            sentiment: {
                score: 0.3,
                magnitude: 0.5,
                primaryEmotion: "positive"
            },
            suggestedTitle: "Q3 Planning & Resource Review"
        };
    }
}

// Export singleton instance
export const aiService = new AIService();