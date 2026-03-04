import { Router, Request, Response } from 'express';
import { exportService } from '../services/export.service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.post('/meetings/:meetingId/export', async (req: Request, res: Response) => {
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

        const meetingId = req.params.meetingId as string;
        const options = req.body;

        const result = await exportService.exportMeeting(meetingId, user.id, options);

        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.data);

    } catch (error) {
        console.error('Error exporting meeting:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// GDPR: Export all user data
router.get('/user/export', async (req: Request, res: Response) => {
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

        // Get all user data
        const [meetings, profile, calendarConnections] = await Promise.all([
            supabaseAdmin.from('meetings').select('*').eq('user_id', user.id),
            supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
            supabaseAdmin.from('calendar_connections').select('*').eq('user_id', user.id)
        ]);

        const userData = {
            profile: profile.data,
            meetings: meetings.data,
            calendarConnections: calendarConnections.data,
            exportDate: new Date().toISOString()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
        res.send(JSON.stringify(userData, null, 2));

    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// GDPR: Delete user account and all data
router.delete('/user/account', async (req: Request, res: Response) => {
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

        // Delete all user data (cascading deletes will handle related records)
        await supabaseAdmin.from('profiles').delete().eq('id', user.id);

        // Delete auth user (requires admin API)
        await supabaseAdmin.auth.admin.deleteUser(user.id);

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Account deletion failed' });
    }
});

export default router;