import { Router, Request, Response } from 'express';
import { googleCalendarService } from '../services/calendar.service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get auth URL
router.get('/auth/google', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const authUrl = googleCalendarService.getAuthUrl(user.id);
        res.json({ url: authUrl });

    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

// OAuth callback
router.get('/auth/google/callback', async (req: Request, res: Response) => {
    try {
        const { code, state: userId } = req.query;

        if (!code || !userId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        await googleCalendarService.handleCallback(code as string, userId as string);

        // Redirect to frontend success page
        res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=connected`);

    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=error`);
    }
});

// Get connection status
router.get('/status', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data, error } = await supabaseAdmin
            .from('calendar_connections')
            .select('provider, email, created_at')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        res.json({
            connected: !!data,
            connection: data || null
        });

    } catch (error) {
        console.error('Error checking calendar status:', error);
        res.status(500).json({ error: 'Failed to check calendar status' });
    }
});

// Disconnect calendar
router.post('/disconnect', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        await googleCalendarService.disconnect(user.id);
        res.json({ success: true });

    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ error: 'Failed to disconnect calendar' });
    }
});

// Get upcoming events
router.get('/events', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const maxResults = req.query.max ? parseInt(req.query.max as string) : 50;
        const events = await googleCalendarService.getUpcomingEvents(user.id, maxResults);

        res.json({ events });

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create event
router.post('/events', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { summary, description, start, end, attendees, meetingId } = req.body;

        const event = await googleCalendarService.createEvent(
            user.id,
            {
                summary,
                description,
                start: new Date(start),
                end: new Date(end),
                attendees: attendees?.map((email: string) => ({ email }))
            },
            meetingId
        );

        res.json({ event });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event
router.put('/events/:eventId', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const eventId = req.params.eventId as string;
        const { summary, description, start, end, attendees } = req.body;

        await googleCalendarService.updateEvent(
            user.id,
            eventId,
            {
                summary,
                description,
                start: start ? new Date(start) : undefined,
                end: end ? new Date(end) : undefined,
                attendees: attendees?.map((email: string) => ({ email }))
            }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

export default router;