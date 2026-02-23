import { supabase } from '../lib/supabase';
import { useMeetingStore } from '../stores/meetingStore';

interface QueuedMeeting {
    meetingId: string;
    transcript: any[];
    retryCount: number;
}

class AIProcessingService {
    private queue: QueuedMeeting[] = [];
    private isProcessing = false;
    private maxRetries = 3;

    // Add meeting to processing queue
    queueForProcessing(meetingId: string, transcript: any[]) {
        this.queue.push({
            meetingId,
            transcript,
            retryCount: 0
        });

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // Process queue
    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const item = this.queue[0];

        try {
            // Update meeting status
            await supabase
                .from('meetings')
                .update({ status: 'processing' })
                .eq('id', item.meetingId);

            // Run AI analysis — convert transcript array to string
            const transcriptText = item.transcript
                .map((seg: any) => `${seg.speaker || 'Speaker'}: ${seg.text}`)
                .join('\n');
            await useMeetingStore.getState().analyzeMeeting(
                item.meetingId,
                transcriptText
            );

            // Update status to completed
            await supabase
                .from('meetings')
                .update({ status: 'completed' })
                .eq('id', item.meetingId);

            // Remove from queue
            this.queue.shift();

        } catch (error) {
            console.error(`AI processing failed for meeting ${item.meetingId}:`, error);

            if (item.retryCount < this.maxRetries) {
                // Re-queue with incremented retry count
                this.queue[0].retryCount++;
                console.log(`Retrying (${this.queue[0].retryCount}/${this.maxRetries})...`);
            } else {
                // Mark as failed — merge with existing metadata to preserve transcript/audio
                const { data: existingMeeting } = await supabase
                    .from('meetings')
                    .select('metadata')
                    .eq('id', item.meetingId)
                    .single();

                await supabase
                    .from('meetings')
                    .update({
                        status: 'failed',
                        metadata: {
                            ...(existingMeeting?.metadata || {}),
                            ai_error: 'Failed after max retries'
                        }
                    })
                    .eq('id', item.meetingId);

                this.queue.shift();
            }
        }

        // Process next item
        setTimeout(() => this.processQueue(), 1000);
    }

    // Get processing status
    getQueueLength(): number {
        return this.queue.length;
    }
}

export const aiProcessor = new AIProcessingService();