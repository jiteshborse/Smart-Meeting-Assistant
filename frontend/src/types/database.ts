export interface Decision {
    description: string;
    consensus: 'unanimous' | 'majority' | 'contested';
}

export interface Topic {
    name: string;
    relevance: number;
}

export interface Sentiment {
    score: number;
    magnitude: number;
    primaryEmotion: 'positive' | 'negative' | 'neutral' | 'mixed';
}

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
    decisions: Decision[];
    topics: Topic[];
    sentiment: Sentiment;
    suggestedTitle?: string;
}


export interface ActionItem {
    id: string;
    description: string;
    assignee: string | null;
    due_date: string | null;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in-progress' | 'completed';
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
    action_items?: ActionItem[];
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
