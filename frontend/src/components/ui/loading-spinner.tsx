import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ className }: { className?: string }) => (
    <Loader2 className={`h-8 w-8 animate-spin ${className}`} />
);

export const PageLoader = () => (
    <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner className="h-12 w-12 text-primary" />
    </div>
);