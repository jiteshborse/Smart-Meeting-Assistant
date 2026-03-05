import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface JobStatus {
    id: string;
    state: 'waiting' | 'active' | 'completed' | 'failed';
    progress: number;
    result?: any;
    failedReason?: string;
}

export const useJobStatus = (jobId: string | null) => {
    const [status, setStatus] = useState<JobStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!jobId) return;

        const fetchStatus = async () => {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${session?.access_token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error('Error fetching job status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(() => {
            if (status?.state === 'completed' || status?.state === 'failed') {
                clearInterval(interval);
                return;
            }
            fetchStatus();
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status?.state]);

    return { status, isLoading };
};