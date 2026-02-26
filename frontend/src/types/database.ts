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
    calendar_event_id?: string;
    calendar_synced?: boolean;
    calendar_meet_link?: string;
}

export interface Meeting {
    id: string;
    user_id: string;
    title: string;
    date?: string;
    duration?: number;
    status: 'scheduled' | 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    metadata?: MeetingMetadata;
    organization_id?: string;
    visibility: MeetingVisibility;
    shared_with: string[];
}

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamRole = 'lead' | 'member';
export type MeetingVisibility = 'private' | 'team' | 'organization' | 'public';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    settings: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrganizationRole;
    joined_at: string;
    invited_by: string | null;
    user?: {
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface Team {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: TeamRole;
    joined_at: string;
    user?: {
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}
