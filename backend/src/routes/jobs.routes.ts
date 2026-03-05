import { Router, Request, Response } from 'express';
import { aiQueue, exportQueue } from '../queues/meeting.queue';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Queue AI analysis
router.post('/meetings/:meetingId/analyze', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { meetingId } = req.params;

        // Get meeting transcript
        const { data: meeting, error } = await supabaseAdmin
            .from('meetings')
            .select('metadata')
            .eq('id', meetingId)
            .eq('user_id', user.id)
            .single();

        if (error || !meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Convert transcript to text
        const transcript = meeting.metadata?.transcript
            ?.map((seg: any) => `[${seg.speaker}]: ${seg.text}`)
            .join('\n');

        if (!transcript) {
            return res.status(400).json({ error: 'No transcript found' });
        }

        // Add to queue
        const job = await aiQueue.add('analyze', {
            meetingId,
            userId: user.id,
            transcript
        });

        // Update meeting status
        await supabaseAdmin
            .from('meetings')
            .update({ status: 'processing' })
            .eq('id', meetingId);

        res.json({
            jobId: job.id,
            status: 'queued'
        });

    } catch (error) {
        console.error('Error queuing analysis:', error);
        res.status(500).json({ error: 'Failed to queue analysis' });
    }
});

// Get job status
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;

        const job = await aiQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;

        res.json({
            id: job.id,
            state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason
        });

    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

export default router;