import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Analyze meeting transcript
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { transcript, meetingId } = req.body;

        if (!transcript || transcript.length < 50) {
            return res.status(400).json({
                error: 'Transcript too short for analysis'
            });
        }

        // Get user from auth header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Perform AI analysis
        const analysis = await aiService.analyzeMeeting(transcript);

        // If meetingId provided, store results
        if (meetingId) {
            const { error: updateError } = await supabaseAdmin
                .from('meetings')
                .update({
                    summary: analysis.summary,
                    decisions: analysis.decisions,
                    sentiment: analysis.sentiment.score,
                    topics: analysis.topics.map(t => t.name),
                    metadata: {
                        action_items: analysis.actionItems,
                        topics_full: analysis.topics,
                        sentiment_full: analysis.sentiment
                    }
                })
                .eq('id', meetingId)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Error updating meeting with AI data:', updateError);
            }
        }

        res.json(analysis);
    } catch (error) {
        console.error('AI analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze meeting',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Quick summary endpoint
router.post('/summarize', async (req: Request, res: Response) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript required' });
        }

        const summary = await aiService.generateQuickSummary(transcript);
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

export default router;