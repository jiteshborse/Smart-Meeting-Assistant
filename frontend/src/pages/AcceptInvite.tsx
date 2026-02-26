import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AcceptInvite: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const acceptInvitation = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    // Store invitation token and redirect to login
                    localStorage.setItem('pendingInvite', token || '');
                    navigate('/login?redirect=accept-invite');
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invitations/${token}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to accept invitation');
                }

                setStatus('success');
                setMessage('You have successfully joined the workspace!');

                setTimeout(() => {
                    navigate('/settings?tab=team');
                }, 3000);

            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Failed to accept invitation');

                toast({
                    title: 'Error',
                    description: error.message,
                    variant: 'destructive'
                });
            }
        };

        acceptInvitation();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Workspace Invitation</CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Processing your invitation...'}
                        {status === 'success' && 'Invitation Accepted!'}
                        {status === 'error' && 'Invitation Failed'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    {status === 'loading' && (
                        <div className="py-8">
                            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                            <p>Please wait while we process your invitation...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <p className="text-lg mb-2">{message}</p>
                            <p className="text-sm text-muted-foreground">Redirecting you to your workspace...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-8">
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <p className="text-lg mb-4">{message}</p>
                            <Button onClick={() => navigate('/')}>
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};