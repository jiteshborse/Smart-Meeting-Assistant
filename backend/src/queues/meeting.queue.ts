import { Queue, Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { aiService } from '../services/ai.service';
import { exportService } from '../services/export.service';
import { supabaseAdmin } from '../lib/supabase';

// Define job types
export interface AIAnalysisJob {
    meetingId: string;
    userId: string;
    transcript: string;
}

export interface ExportJob {
    meetingId: string;
    userId: string;
    options: any;
    email: string;
}

export interface EmailJob {
    to: string;
    subject: string;
    template: string;
    data: any;
}

// Create queues
export const aiQueue = new Queue<AIAnalysisJob>('ai-analysis', { connection });
export const exportQueue = new Queue<ExportJob>('export', { connection });
export const emailQueue = new Queue<EmailJob>('email', { connection });

// AI Analysis Worker
new Worker<AIAnalysisJob>(
    'ai-analysis',
    async (job: Job<AIAnalysisJob>) => {
        const { meetingId, userId, transcript } = job.data;

        try {
            // Update job progress
            await job.updateProgress(10);

            // Run AI analysis
            const analysis = await aiService.analyzeMeeting(transcript);

            await job.updateProgress(50);

            // Store results in metadata (matches existing schema)
            const { error } = await supabaseAdmin
                .from('meetings')
                .update({
                    metadata: {
                        ...((await supabaseAdmin
                            .from('meetings')
                            .select('metadata')
                            .eq('id', meetingId)
                            .single()).data?.metadata || {}),
                        ai_analysis: analysis
                    },
                    status: 'completed'
                })
                .eq('id', meetingId)
                .eq('user_id', userId);

            if (error) throw error;

            await job.updateProgress(100);

            // Queue notification email
            await emailQueue.add('ai-complete', {
                to: userId, // You'd need to get email
                subject: 'Meeting Analysis Complete',
                template: 'ai-complete',
                data: { meetingId, title: analysis.suggestedTitle }
            });

            return analysis;

        } catch (error) {
            // Mark meeting as failed
            await supabaseAdmin
                .from('meetings')
                .update({
                    status: 'failed',
                    metadata: { ai_error: (error as any).message }
                })
                .eq('id', meetingId);

            throw error;
        }
    },
    { connection }
);

// Export Worker
new Worker<ExportJob>(
    'export',
    async (job: Job<ExportJob>) => {
        const { meetingId, userId, options, email } = job.data;

        try {
            await job.updateProgress(10);

            // Generate export
            const result = await exportService.exportMeeting(meetingId, userId, options);

            await job.updateProgress(70);

            // Store in Supabase Storage for download
            const filePath = `exports/${userId}/${meetingId}_${Date.now()}.${options.format}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('exports')
                .upload(filePath, result.data, {
                    contentType: result.contentType
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('exports')
                .getPublicUrl(filePath);

            await job.updateProgress(90);

            // Send email with download link
            await emailQueue.add('export-ready', {
                to: email,
                subject: 'Your Export is Ready',
                template: 'export-ready',
                data: {
                    downloadUrl: publicUrl,
                    filename: result.filename,
                    meetingId
                }
            });

            await job.updateProgress(100);

            return { url: publicUrl };

        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    },
    { connection }
);

// Email Worker
new Worker<EmailJob>(
    'email',
    async (job: Job<EmailJob>) => {
        const { to, subject, template, data } = job.data;

        // In production, use a real email service
        console.log(`Sending email to ${to}: ${subject}`, { template, data });

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { sent: true };
    },
    { connection }
);