import { supabaseAdmin } from '../lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export interface ExportOptions {
    format: 'pdf' | 'txt' | 'json';
    includeTranscript: boolean;
    includeSummary: boolean;
    includeActionItems: boolean;
    includeComments: boolean;
}

export class ExportService {
    async exportMeeting(
        meetingId: string,
        userId: string,
        options: ExportOptions
    ): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
        // Get meeting data
        const { data: meeting, error } = await supabaseAdmin
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

        if (error || !meeting) {
            throw new Error('Meeting not found');
        }

        // Fetch comments separately
        const { data: comments } = await supabaseAdmin
            .from('comments')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        // Fetch profiles for comment authors
        if (comments && comments.length > 0) {
            const userIds = [...new Set(comments.map(c => c.user_id))];
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, email, full_name')
                .in('id', userIds);
            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
            meeting.comments = comments.map(c => ({
                ...c,
                user: profileMap.get(c.user_id) || null
            }));
        } else {
            meeting.comments = [];
        }

        // Check access
        if (meeting.user_id !== userId) {
            // Check shared access
            const hasAccess = await this.checkAccess(meeting, userId);
            if (!hasAccess) {
                throw new Error('Access denied');
            }
        }

        switch (options.format) {
            case 'pdf':
                return this.generatePDF(meeting, options);
            case 'txt':
                return this.generateText(meeting, options);
            case 'json':
                return this.generateJSON(meeting, options);
            default:
                throw new Error('Unsupported format');
        }
    }

    private async generatePDF(meeting: any, options: ExportOptions) {
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(20);
        doc.text(meeting.title, 20, yPos);
        yPos += 10;

        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Created: ${format(new Date(meeting.created_at), 'PPP')}`, 20, yPos);
        yPos += 5;
        if (meeting.duration) {
            doc.text(`Duration: ${Math.floor(meeting.duration / 60)} minutes`, 20, yPos);
            yPos += 5;
        }
        yPos += 15;

        // Summary (stored in metadata.ai_analysis)
        const aiAnalysis = meeting.metadata?.ai_analysis;
        if (options.includeSummary && aiAnalysis) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Summary', 20, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setTextColor(60);

            // Executive summary
            const summary = aiAnalysis.summary;
            if (summary) {
                const summaryText = typeof summary === 'string' ? summary : summary.executive || summary.detailed || '';
                if (summaryText) {
                    doc.text('Executive Summary:', 20, yPos);
                    yPos += 5;
                    const lines = doc.splitTextToSize(summaryText, 170);
                    doc.text(lines, 20, yPos);
                    yPos += lines.length * 5 + 5;
                }
            }

            // Key topics
            if (aiAnalysis.topics) {
                doc.text('Key Topics:', 20, yPos);
                yPos += 5;
                aiAnalysis.topics.forEach((topic: string) => {
                    doc.text('• ' + topic, 25, yPos);
                    yPos += 5;
                });
                yPos += 5;
            }
        }

        // Action Items
        if (options.includeActionItems && meeting.metadata?.action_items) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Action Items', 20, yPos);
            yPos += 8;

            const actionItems = meeting.metadata.action_items.map((item: any) => [
                item.description,
                item.assignee || 'Unassigned',
                item.priority,
                item.status
            ]);

            (doc as any).autoTable({
                startY: yPos,
                head: [['Description', 'Assignee', 'Priority', 'Status']],
                body: actionItems,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Transcript
        if (options.includeTranscript && meeting.metadata?.transcript) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Transcript', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(60);

            meeting.metadata.transcript.forEach((segment: any) => {
                const lines = doc.splitTextToSize(
                    `[${segment.speaker}] ${segment.text}`,
                    170
                );

                if (yPos + lines.length * 5 > 280) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(lines, 20, yPos);
                yPos += lines.length * 5 + 2;
            });
        }

        // Comments
        if (options.includeComments && meeting.comments?.length > 0) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Comments', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(60);

            meeting.comments.forEach((comment: any) => {
                const user = comment.user?.full_name || comment.user?.email || 'Unknown';
                const date = format(new Date(comment.created_at), 'MMM d, yyyy');
                const lines = doc.splitTextToSize(
                    `${user} (${date}): ${comment.content}`,
                    170
                );

                if (yPos + lines.length * 5 > 280) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(lines, 20, yPos);
                yPos += lines.length * 5 + 2;
            });
        }

        // Return PDF
        return {
            data: Buffer.from(doc.output('arraybuffer')),
            contentType: 'application/pdf',
            filename: `${meeting.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        };
    }

    private async generateText(meeting: any, options: ExportOptions) {
        let text = `# ${meeting.title}\n\n`;
        text += `Created: ${format(new Date(meeting.created_at), 'PPP')}\n`;
        if (meeting.duration) {
            text += `Duration: ${Math.floor(meeting.duration / 60)} minutes\n`;
        }
        text += '\n';

        const aiAnalysis = meeting.metadata?.ai_analysis;
        if (options.includeSummary && aiAnalysis) {
            text += '## Summary\n\n';
            const summary = aiAnalysis.summary;
            if (summary) {
                const summaryText = typeof summary === 'string' ? summary : summary.executive || summary.detailed || '';
                if (summaryText) text += `${summaryText}\n\n`;
            }
            if (aiAnalysis.topics) {
                text += 'Key Topics:\n';
                aiAnalysis.topics.forEach((topic: string) => {
                    text += `• ${topic}\n`;
                });
                text += '\n';
            }
        }

        if (options.includeActionItems && meeting.metadata?.action_items) {
            text += '## Action Items\n\n';
            meeting.metadata.action_items.forEach((item: any) => {
                text += `• ${item.description}\n`;
                text += `  Assignee: ${item.assignee || 'Unassigned'}\n`;
                text += `  Priority: ${item.priority}\n`;
                text += `  Status: ${item.status}\n\n`;
            });
        }

        if (options.includeTranscript && meeting.metadata?.transcript) {
            text += '## Transcript\n\n';
            meeting.metadata.transcript.forEach((segment: any) => {
                text += `[${segment.speaker}] ${segment.text}\n`;
            });
            text += '\n';
        }

        if (options.includeComments && meeting.comments?.length > 0) {
            text += '## Comments\n\n';
            meeting.comments.forEach((comment: any) => {
                const user = comment.user?.full_name || comment.user?.email || 'Unknown';
                const date = format(new Date(comment.created_at), 'MMM d, yyyy');
                text += `${user} (${date}):\n${comment.content}\n\n`;
            });
        }

        return {
            data: text,
            contentType: 'text/plain',
            filename: `${meeting.title.replace(/[^a-z0-9]/gi, '_')}.txt`
        };
    }

    private async generateJSON(meeting: any, options: ExportOptions) {
        const exportData: any = {
            id: meeting.id,
            title: meeting.title,
            created_at: meeting.created_at,
            duration: meeting.duration,
            status: meeting.status
        };

        if (options.includeSummary) {
            exportData.summary = meeting.metadata?.ai_analysis?.summary || null;
            exportData.topics = meeting.metadata?.ai_analysis?.topics || [];
        }

        if (options.includeActionItems) {
            exportData.actionItems = meeting.metadata?.action_items || [];
        }

        if (options.includeTranscript) {
            exportData.transcript = meeting.metadata?.transcript || [];
        }

        if (options.includeComments) {
            exportData.comments = meeting.comments?.map((c: any) => ({
                user: c.user?.email,
                content: c.content,
                created_at: c.created_at
            })) || [];
        }

        return {
            data: JSON.stringify(exportData, null, 2),
            contentType: 'application/json',
            filename: `${meeting.title.replace(/[^a-z0-9]/gi, '_')}.json`
        };
    }

    private async checkAccess(meeting: any, userId: string): Promise<boolean> {
        if (meeting.visibility === 'public') return true;

        if (meeting.visibility === 'organization' && meeting.organization_id) {
            const { data } = await supabaseAdmin
                .from('organization_members')
                .select('id')
                .eq('organization_id', meeting.organization_id)
                .eq('user_id', userId)
                .single();
            return !!data;
        }

        if (meeting.visibility === 'team' && meeting.shared_with) {
            return meeting.shared_with.includes(userId) ||
                meeting.shared_with.some((id: string) =>
                    id.startsWith('team:') && this.userInTeam(userId, id.replace('team:', ''))
                );
        }

        return false;
    }

    private async userInTeam(userId: string, teamId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .single();
        return !!data;
    }
}

export const exportService = new ExportService();