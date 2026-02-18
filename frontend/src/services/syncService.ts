import { getPendingUploads, markMeetingSynced } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export const syncOfflineMeetings = async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const pendingUploads = await getPendingUploads();

    for (const upload of pendingUploads) {
        try {
            // Upload audio
            const filePath = `${user.id}/${upload.meetingId}/recording.webm`;

            const { error: uploadError } = await supabase.storage
                .from('meeting-recordings')
                .upload(filePath, upload.audioBlob, {
                    contentType: upload.audioBlob.type,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('meeting-recordings')
                .getPublicUrl(filePath);

            // Update meeting metadata
            const { error: updateError } = await supabase
                .from('meetings')
                .update({
                    status: 'completed',
                    metadata: {
                        audio_url: publicUrl,
                        audio_size: upload.audioBlob.size,
                        audio_type: upload.audioBlob.type
                    }
                })
                .eq('id', upload.meetingId);

            if (updateError) throw updateError;

            // Mark as synced
            await markMeetingSynced(upload.meetingId);

            console.log(`Synced meeting ${upload.meetingId}`);
        } catch (error) {
            console.error(`Failed to sync meeting ${upload.meetingId}:`, error);
        }
    }
};