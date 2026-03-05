import { supabaseAdmin } from '../lib/supabase';

export interface SearchResult {
    id: string;
    title: string;
    created_at: string;
    user_id: string;
    visibility?: string;
    rank: number;
    highlights: {
        title?: string;
        summary?: string;
        transcript?: string;
    };
}

export class SearchService {
    async search(
        query: string,
        userId: string,
        _organizationId?: string | null,
        limit: number = 20
    ): Promise<SearchResult[]> {
        try {
            // Use textSearch on the materialized view
            const { data, error } = await supabaseAdmin
                .from('meeting_search')
                .select('id, title, created_at, user_id')
                .textSearch('document', query, { type: 'plain' })
                .eq('user_id', userId)
                .limit(limit);

            if (error) throw error;

            // Get highlights for each result
            const results = await Promise.all(
                (data || []).map(async (item, index) => {
                    const { highlights, visibility } = await this.getHighlights(item.id, query);
                    return {
                        ...item,
                        visibility,
                        rank: 1 - (index * 0.05), // Simple rank based on order
                        highlights
                    };
                })
            );

            return results;
        } catch (error) {
            console.error('Error searching meetings:', error);
            return [];
        }
    }

    private async getHighlights(meetingId: string, query: string): Promise<{ highlights: SearchResult['highlights']; visibility?: string }> {
        try {
            const { data } = await supabaseAdmin
                .from('meetings')
                .select('title, metadata, visibility')
                .eq('id', meetingId)
                .single();

            if (!data) return { highlights: {} };

            const highlights: SearchResult['highlights'] = {};
            const visibility = data.visibility;
            const queryLower = query.toLowerCase();

            // Highlight title
            if (data.title.toLowerCase().includes(queryLower)) {
                highlights.title = this.highlightText(data.title, query);
            }

            // Highlight from AI analysis summary (stored in metadata)
            const aiAnalysis = data.metadata?.ai_analysis;
            if (aiAnalysis?.summary) {
                const summaryText = typeof aiAnalysis.summary === 'string'
                    ? aiAnalysis.summary
                    : aiAnalysis.summary.executive || aiAnalysis.summary.detailed || '';
                if (summaryText.toLowerCase().includes(queryLower)) {
                    highlights.summary = this.highlightText(summaryText, query, 200);
                }
            }

            // Highlight transcript
            if (data.metadata?.transcript_text) {
                const transcript = data.metadata.transcript_text;
                if (transcript.toLowerCase().includes(queryLower)) {
                    highlights.transcript = this.highlightText(transcript, query, 300);
                }
            }

            return { highlights, visibility };
        } catch (error) {
            console.error('Error getting highlights:', error);
            return { highlights: {} };
        }
    }

    private highlightText(text: string, query: string, maxLength: number = 150): string {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text.substring(0, maxLength);

        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);

        let excerpt = text.substring(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';

        // Highlight the matching part
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        excerpt = excerpt.replace(regex, '<mark>$1</mark>');

        return excerpt;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export const searchService = new SearchService();