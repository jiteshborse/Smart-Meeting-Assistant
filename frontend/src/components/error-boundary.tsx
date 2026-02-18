import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
                    <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground text-center mb-4">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <Button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                    >
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}