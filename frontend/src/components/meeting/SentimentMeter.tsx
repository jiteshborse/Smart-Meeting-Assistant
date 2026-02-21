import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Sentiment } from '../../types/database';

interface SentimentMeterProps {
    sentiment: Sentiment;
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({ sentiment }) => {
    const { score, magnitude, primaryEmotion } = sentiment;

    const getSentimentColor = (s: number) => {
        if (s > 0.3) return 'bg-green-500';
        if (s < -0.3) return 'bg-red-500';
        return 'bg-yellow-500';
    };

    const getSentimentLabel = (s: number) => {
        if (s > 0.3) return 'Positive';
        if (s < -0.3) return 'Negative';
        return 'Neutral';
    };

    const getSentimentIcon = (s: number) => {
        if (s > 0.3) return <TrendingUp className="h-5 w-5 text-green-500" />;
        if (s < -0.3) return <TrendingDown className="h-5 w-5 text-red-500" />;
        return <Minus className="h-5 w-5 text-yellow-500" />;
    };

    const percentage = Math.round((score + 1) * 50); // -1→0%, 0→50%, 1→100%

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {getSentimentIcon(score)}
                    Sentiment Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{getSentimentLabel(score)}</span>
                    <span className="text-muted-foreground">{percentage}% Score</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${getSentimentColor(score)}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Primary Emotion</p>
                        <p className="text-sm font-medium capitalize">{primaryEmotion}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-sm font-medium">{Math.round(magnitude * 100)}%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
