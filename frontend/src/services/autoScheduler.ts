import { useCalendarStore } from '../stores/calendarStore';
import { useMeetingStore } from '../stores/meetingStore';

interface ScheduleRule {
    id: string;
    meetingId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    duration: number; // minutes
    attendees: string[];
    templateId?: string;
    nextRun: Date;
    enabled: boolean;
}

class AutoSchedulerService {
    private rules: ScheduleRule[] = [];
    private interval: NodeJS.Timeout | null = null;

    constructor() {
        this.loadRules();
        this.startScheduler();
    }

    private loadRules() {
        const saved = localStorage.getItem('schedule-rules');
        if (saved) {
            this.rules = JSON.parse(saved).map((rule: any) => ({
                ...rule,
                nextRun: new Date(rule.nextRun)
            }));
        }
    }

    private saveRules() {
        localStorage.setItem('schedule-rules', JSON.stringify(this.rules));
    }

    startScheduler() {
        if (this.interval) return;

        this.interval = setInterval(() => {
            this.checkAndSchedule();
        }, 60000); // Check every minute
    }

    stopScheduler() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async checkAndSchedule() {
        const now = new Date();

        for (const rule of this.rules) {
            if (!rule.enabled) continue;
            if (rule.nextRun <= now) {
                await this.executeRule(rule);
                this.updateNextRun(rule);
            }
        }
    }

    private async executeRule(rule: ScheduleRule) {
        try {
            const { createEvent } = useCalendarStore.getState();
            const { meetings } = useMeetingStore.getState();

            const originalMeeting = meetings.find(m => m.id === rule.meetingId);
            if (!originalMeeting) return;

            // Calculate dates
            const [hours, minutes] = rule.time.split(':').map(Number);
            const start = new Date();
            start.setHours(hours, minutes, 0);

            const end = new Date(start);
            end.setMinutes(end.getMinutes() + rule.duration);

            // Create event
            await createEvent({
                summary: `${originalMeeting.title} (Recurring)`,
                description: `Automatically scheduled recurring meeting\n\nOriginal meeting: ${originalMeeting.title}`,
                start,
                end,
                attendees: rule.attendees.map(email => ({ email })),
                meetingId: rule.meetingId
            });

            console.log(`Scheduled recurring meeting from rule ${rule.id}`);

        } catch (error) {
            console.error(`Failed to execute schedule rule ${rule.id}:`, error);
        }
    }

    private updateNextRun(rule: ScheduleRule) {
        const next = new Date(rule.nextRun);

        switch (rule.frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
        }

        rule.nextRun = next;
        this.saveRules();
    }

    addRule(rule: Omit<ScheduleRule, 'id' | 'nextRun'>) {
        const newRule: ScheduleRule = {
            ...rule,
            id: Date.now().toString(),
            nextRun: this.calculateNextRun(rule),
        };
        this.rules.push(newRule);
        this.saveRules();
        return newRule;
    }

    private calculateNextRun(rule: Omit<ScheduleRule, 'id' | 'nextRun'>): Date {
        const [hours, minutes] = rule.time.split(':').map(Number);
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);

        switch (rule.frequency) {
            case 'daily':
                if (next <= new Date()) {
                    next.setDate(next.getDate() + 1);
                }
                break;
            case 'weekly':
                while (next.getDay() !== rule.dayOfWeek) {
                    next.setDate(next.getDate() + 1);
                }
                if (next <= new Date()) {
                    next.setDate(next.getDate() + 7);
                }
                break;
            case 'monthly':
                next.setDate(rule.dayOfMonth || 1);
                if (next <= new Date()) {
                    next.setMonth(next.getMonth() + 1);
                }
                break;
        }

        return next;
    }

    removeRule(id: string) {
        this.rules = this.rules.filter(r => r.id !== id);
        this.saveRules();
    }

    getRules() {
        return this.rules;
    }
}

export const autoScheduler = new AutoSchedulerService();