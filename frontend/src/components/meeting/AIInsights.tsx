import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
    Brain,
    CheckCircle2,
    ListTodo,
    TrendingUp,
    Target,
    Lightbulb
} from 'lucide-react';
// Progress component might not exist, using simple div fallback if needed or create it
// Assuming we don't have it, I'll implement a simple progress bar here or check if it exists
import type { AIAnalysisResult } from '../../types/database';

// Simple Progress Component if ui/progress doesn't exist
const ProgressBar = ({ value, className }: { value: number, className?: string }) => (
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${className}`} style={{ width: `${value}%` }} />
    </div>
);

interface AIInsightsProps {
    analysis: AIAnalysisResult;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ analysis }) => {
    const { summary, actionItems, sentiment, topics } = analysis;

    const getSentimentColor = (score: number) => {
        if (score > 0.3) return 'bg-green-500';
        if (score < -0.3) return 'bg-red-500';
        return 'bg-yellow-500';
    };

    const getSentimentLabel = (score: number) => {
        if (score > 0.3) return 'Positive';
        if (score < -0.3) return 'Negative';
        return 'Neutral';
    };

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Executive Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{summary.executive}</p>
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Key Takeaways
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {summary.bulletPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Action Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-primary" />
                            Action Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {actionItems.map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${item.priority === 'high' ? 'text-red-500' :
                                            item.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                                            }`} />
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{item.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {item.assignee && (
                                                    <Badge variant="outline" className="text-xs">
                                                        @{item.assignee}
                                                    </Badge>
                                                )}
                                                {item.dueDate && (
                                                    <span>Due: {item.dueDate}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Sentiment & Topics */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Sentiment Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{getSentimentLabel(sentiment.score)}</span>
                                <span className="text-muted-foreground">
                                    {Math.round((sentiment.score + 1) * 50)}% Score
                                </span>
                            </div>
                            <ProgressBar value={(sentiment.score + 1) * 50} className={getSentimentColor(sentiment.score)} />
                            <p className="text-sm text-muted-foreground">
                                The overall tone of the meeting was {sentiment.primaryEmotion}.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Key Topics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {topics.map((topic, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1">
                                        {topic.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
