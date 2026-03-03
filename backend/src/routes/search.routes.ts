import { Router, Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
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

        const { q, limit } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }

        const results = await searchService.search(
            q,
            user.id,
            null,
            limit ? parseInt(limit as string) : undefined
        );

        res.json({ results });

    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;