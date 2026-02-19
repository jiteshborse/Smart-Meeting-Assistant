export interface AIAnalysisResult {
    summary: {
        executive: string;
        detailed: string;
        bulletPoints: string[];
    };
    actionItems: {
        description: string;
        assignee: string | null;
        dueDate: string | null;
        priority: 'high' | 'medium' | 'low';
    }[];
    decisions: {
        description: string;
        consensus: 'unanimous' | 'majority' | 'contested';
    }[];
    topics: {
        name: string;
        relevance: number;
    }[];
    sentiment: {
        score: number;
        magnitude: number;
        primaryEmotion: 'positive' | 'negative' | 'neutral' | 'mixed';
    };
    suggestedTitle?: string;
}

export interface MeetingMetadata {
    audio_path?: string;
    audio_url?: string;
    audio_size?: number;
    audio_type?: string;
    word_count?: number;
    transcript?: any[];
    transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
    ai_analysis?: AIAnalysisResult;
}

export interface Meeting {
    id: string;
    user_id: string;
    title: string;
    date?: string;
    duration?: number;
    status: 'scheduled' | 'processing' | 'completed';
    created_at: string;
    metadata?: MeetingMetadata;
}