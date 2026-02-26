import { randomBytes } from 'crypto';
import { supabaseAdmin } from '../lib/supabase';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend (free tier: 3000 emails/month)
const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvitationData {
    email: string;
    organizationId: string;
    role: 'admin' | 'member' | 'viewer';
    invitedBy: string;
}

export class InvitationService {
    // Generate unique token
    private generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    // Create invitation
    async createInvitation(data: InvitationData): Promise<{ token: string; expiresAt: Date }> {
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

        const { error } = await supabaseAdmin
            .from('invitations')
            .insert({
                organization_id: data.organizationId,
                email: data.email,
                role: data.role,
                invited_by: data.invitedBy,
                token,
                expires_at: expiresAt.toISOString()
            });

        if (error) throw error;

        return { token, expiresAt };
    }

    // Send invitation email
    async sendInvitationEmail(
        email: string,
        token: string,
        organizationName: string,
        inviterName: string
    ): Promise<void> {
        const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;

        try {
            await resend.emails.send({
                from: 'Smart Meeting Assistant <invitations@yourdomain.com>',
                to: email,
                subject: `You've been invited to join ${organizationName}`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">You're Invited!</h1>
            <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on Smart Meeting Assistant.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">Click the button below to accept the invitation and join the workspace.</p>
            </div>
            
            <a href="${inviteUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can ignore this email.
            </p>
          </div>
        `
            });
        } catch (error) {
            console.error('Error sending invitation email:', error);
            // Fallback to logging in development
            if (process.env.NODE_ENV === 'development') {
                console.log('Invitation URL:', inviteUrl);
            }
        }
    }

    // Accept invitation
    async acceptInvitation(token: string, userId: string): Promise<void> {
        // Get invitation
        const { data: invitation, error: fetchError } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !invitation) {
            throw new Error('Invalid invitation token');
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            throw new Error('Invitation has expired');
        }

        // Check if already accepted
        if (invitation.accepted_at) {
            throw new Error('Invitation already accepted');
        }

        // Add user to organization
        const { error: memberError } = await supabaseAdmin
            .from('organization_members')
            .insert({
                organization_id: invitation.organization_id,
                user_id: userId,
                role: invitation.role,
                invited_by: invitation.invited_by
            });

        if (memberError) throw memberError;

        // Mark invitation as accepted
        const { error: updateError } = await supabaseAdmin
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

        if (updateError) throw updateError;
    }

    // Get pending invitations for organization
    async getPendingInvitations(organizationId: string): Promise<any[]> {
        const { data, error } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('organization_id', organizationId)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;
        return data || [];
    }

    // Resend invitation
    async resendInvitation(invitationId: string): Promise<void> {
        const { data: invitation, error } = await supabaseAdmin
            .from('invitations')
            .select(`
        *,
        organization:organization_id (name),
        inviter:invited_by (email)
      `)
            .eq('id', invitationId)
            .single();

        if (error || !invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.accepted_at) {
            throw new Error('Invitation already accepted');
        }

        if (new Date(invitation.expires_at) < new Date()) {
            throw new Error('Invitation has expired');
        }

        await this.sendInvitationEmail(
            invitation.email,
            invitation.token,
            invitation.organization.name,
            invitation.inviter.email
        );
    }
}

export const invitationService = new InvitationService();