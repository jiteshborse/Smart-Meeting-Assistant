import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // The OAuth flow will redirect back with parameters
        // We just need to close this page and let the main app handle it
        // The actual processing happens in the CalendarConnection component

        // Check if we have a token in the URL (for some flows)
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);

        if (params.get('error')) {
            // Handle error
            window.opener?.postMessage({ type: 'oauth-error', error: params.get('error') }, window.location.origin);
        } else if (hash || params.get('code')) {
            // Success - close popup or redirect
            if (window.opener) {
                window.opener.postMessage({ type: 'oauth-success' }, window.location.origin);
                window.close();
            } else {
                // Redirect back to settings with success parameter
                navigate('/settings?calendar=connected');
            }
        } else {
            // No parameters, just go to settings
            navigate('/settings');
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold">Completing authentication...</h2>
                <p className="text-muted-foreground">Please wait while we connect your calendar.</p>
            </div>
        </div>
    );
};