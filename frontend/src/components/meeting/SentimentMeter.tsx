import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Smile, Frown, Meh, AlertCircle } from 'lucide-react';

interface SentimentMeterProps {
    score: number; // -1 to 1
    magnitude?: number;
    primaryEmotion?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({
    score,
    magnitude = 0.5,
    primaryEmotion
}) => {
    // Convert -1..1 to 0..100 for display
    const percentage = ((score + 1) / 2) * 100;



    // Get icon
    const getIcon = () => {
        if (score > 0.3) return <Smile className="h-8 w-8 text-green-500" />;
        if (score < -0.3) return <Frown className="h-8 w-8 text-red-500" />;
        return <Meh className="h-8 w-8 text-yellow-500" />;
    };

    // Get description
    const getDescription = () => {
        if (score > 0.5) return 'Very Positive';
        if (score > 0.2) return 'Slightly Positive';
        if (score < -0.5) return 'Very Negative';
        if (score < -0.2) return 'Slightly Negative';
        return 'Neutral';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Meeting Sentiment</span>
                    {primaryEmotion && (
                        <span className="text-sm font-normal text-muted-foreground capitalize">
                            {primaryEmotion}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>

                    {/* Meter */}
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Negative</span>
                            <span>Neutral</span>
                            <span>Positive</span>
                        </div>

                        <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
                            {/* Indicator */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white border-2 border-gray-800 rounded-full shadow-lg"
                                style={{ left: `${percentage}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                            />
                        </div>

                        {/* Score and magnitude */}
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="font-medium">{getDescription()}</span>
                            <span className="text-muted-foreground">
                                Score: {score.toFixed(2)} | Magnitude: {magnitude.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Emotion badges */}
                {primaryEmotion && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Primary Emotion:</p>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm ${primaryEmotion === 'positive' ? 'bg-green-100 text-green-800' :
                                    primaryEmotion === 'negative' ? 'bg-red-100 text-red-800' :
                                        primaryEmotion === 'neutral' ? 'bg-gray-100 text-gray-800' :
                                            'bg-purple-100 text-purple-800'
                                }`}>
                                {primaryEmotion}
                            </span>
                        </div>
                    </div>
                )}

                {/* Warning for very negative meetings */}
                {score < -0.5 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-300">
                            This meeting had a very negative tone. Consider reviewing the discussion points and addressing any conflicts.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};