import { AssemblyAI } from 'assemblyai';
import { supabase } from '../lib/supabase';

const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || ''
});

export const transcribeAudio = async (audioUrl: string, meetingId: string) => {
    try {
        console.log(`Starting transcription for meeting ${meetingId}`);

        const transcript = await client.transcripts.transcribe({
            audio: audioUrl,
            speaker_labels: true,
            language_code: "en",
            expected_speakers: 2
        } as any);

        if (transcript.status === 'error') {
            throw new Error(transcript.error);
        }

        // Format segments for our database
        const segments = transcript.utterances?.map(utterance => ({
            id: Math.random().toString(36).substring(7),
            speaker: `Speaker ${utterance.speaker}`,
            text: utterance.text,
            timestamp: utterance.start,
            isFinal: true
        })) || [];

        // Fetch existing metadata first to merge
        const { data: existingData, error: fetchError } = await supabase
            .from('meetings')
            .select('metadata')
            .eq('id', meetingId)
            .single();

        if (fetchError) {
            console.error('Error fetching existing metadata:', fetchError);
            throw fetchError;
        }

        const existingMetadata = existingData?.metadata || {};

        console.log('AssemblyAI: Update DB with segments:', segments.length);
        if (segments.length > 0) {
            console.log('Sample segment:', segments[0]);
        }

        // Update database with new transcript
        const { error } = await supabase
            .from('meetings')
            .update({
                metadata: {
                    ...existingMetadata, // Merge existing
                    transcript: segments,
                    transcription_status: 'completed'
                }
            })
            .eq('id', meetingId);

        if (error) throw error;

        return segments;
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
};
