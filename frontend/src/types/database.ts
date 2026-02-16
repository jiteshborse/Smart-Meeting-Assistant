export type Meeting = {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    duration: number;
    status: 'processing' | 'completed' | 'failed';
    metadata: Record<string, any>;
};

export type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
    preferences: Record<string, any>;
};

export type Database = {
    public: {
        Tables: {
            meetings: {
                Row: Meeting;
                Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Meeting, 'id'>>;
            };
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id'>>;
            };
        };
    };
};