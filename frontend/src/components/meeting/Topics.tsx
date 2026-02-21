import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Hash, TrendingUp } from 'lucide-react';
import type { Topic } from '../../types/database';

interface TopicsProps {
    topics: Topic[];
}

export const Topics: React.FC<TopicsProps> = ({ topics }) => {
    const getTopicSize = (relevance: number): string => {
        if (relevance > 0.8) return 'text-lg font-bold';
        if (relevance > 0.5) return 'text-base font-semibold';
        return 'text-sm';
    };

    if (!topics || topics.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                    <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No topics detected</p>
                    <p className="text-sm">Discussion topics will appear here</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Discussion Topics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    {topics.map((topic, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className={`px-3 py-2 ${getTopicSize(topic.relevance)}`}
                            style={{
                                borderWidth: Math.max(1, Math.min(3, Math.round(topic.relevance * 3))),
                                opacity: Math.max(0.6, topic.relevance),
                            }}
                        >
                            #{topic.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                                {Math.round(topic.relevance * 100)}%
                            </span>
                        </Badge>
                    ))}
                </div>

                {/* Relevance Legend */}
                <div className="mt-6 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Topic relevance:</p>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded" style={{ opacity: 0.6 }} />
                            <span>Low</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded" style={{ opacity: 0.8 }} />
                            <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded" style={{ opacity: 1 }} />
                            <span>High</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};