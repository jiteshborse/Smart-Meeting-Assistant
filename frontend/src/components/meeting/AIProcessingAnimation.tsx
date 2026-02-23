import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Brain, Loader2 } from 'lucide-react';

export const AIProcessingAnimation: React.FC = () => {
    return (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="py-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                        <Brain className="h-12 w-12 text-blue-500 animate-pulse" />
                        <Loader2 className="h-6 w-6 text-blue-400 animate-spin absolute -top-1 -right-1" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                            AI is analyzing your meeting...
                        </h3>
                        <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">
                            Generating summary, action items, and insights
                        </p>
                    </div>
                    <div className="flex gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
