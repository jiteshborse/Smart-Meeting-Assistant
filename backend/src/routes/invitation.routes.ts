import { Router, Request, Response } from 'express';
import { invitationService } from '../services/invitation.service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Create invitation
router.post('/invitations', async (req: Request, res: Response) => {
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

        const { email, organizationId, role } = req.body;

        // Check if user already in organization
        const { data: existingMember } = await supabaseAdmin
            .from('organization_members')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!existingMember || !['owner', 'admin'].includes(existingMember.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Get organization name and inviter info
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('name')
            .eq('id', organizationId)
            .single();

        const { data: inviter } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Create invitation
        const { token, expiresAt } = await invitationService.createInvitation({
            email,
            organizationId,
            role,
            invitedBy: user.id
        });

        // Send email
        await invitationService.sendInvitationEmail(
            email,
            token,
            org?.name || 'Unknown Organization',
            inviter?.full_name || inviter?.email || 'A team member'
        );

        res.json({
            message: 'Invitation sent successfully',
            expiresAt
        });

    } catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// Accept invitation
router.post('/invitations/:token/accept', async (req: Request, res: Response) => {
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

        const { token: invitationToken } = req.params;

        await invitationService.acceptInvitation(invitationToken, user.id);

        res.json({ message: 'Invitation accepted successfully' });

    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

// Get pending invitations
router.get('/organizations/:organizationId/invitations', async (req: Request, res: Response) => {
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

        const { organizationId } = req.params;

        // Check permissions
        const { data: member } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const invitations = await invitationService.getPendingInvitations(organizationId);
        res.json({ invitations });

    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

export default router;