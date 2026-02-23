import React from 'react';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AIStatusBadgeProps {
    status: 'processing' | 'completed' | 'failed' | 'pending';
}

export const AIStatusBadge: React.FC<AIStatusBadgeProps> = ({ status }) => {
    const config = {
        processing: {
            icon: Loader2,
            text: 'AI Processing',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 animate-pulse'
        },
        completed: {
            icon: CheckCircle2,
            text: 'AI Ready',
            className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        },
        failed: {
            icon: XCircle,
            text: 'AI Failed',
            className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        },
        pending: {
            icon: Clock,
            text: 'AI Pending',
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    };

    const { icon: Icon, text, className } = config[status];

    return (
        <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
            <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {text}
        </Badge>
    );
};