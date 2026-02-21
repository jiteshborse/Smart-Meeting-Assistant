import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, HelpCircle, ThumbsUp, Users } from 'lucide-react';
import type { Decision } from '../../types/database';

interface DecisionsProps {
    decisions: Decision[];
}

const consensusConfig = {
    unanimous: {
        icon: ThumbsUp,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        iconColor: 'text-green-500',
    },
    majority: {
        icon: Users,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        iconColor: 'text-blue-500',
    },
    contested: {
        icon: HelpCircle,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        iconColor: 'text-yellow-500',
    },
};

export const Decisions: React.FC<DecisionsProps> = ({ decisions }) => {
    if (!decisions || decisions.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No decisions recorded</p>
                    <p className="text-sm">Key decisions will appear here</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Key Decisions ({decisions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {decisions.map((decision, index) => {
                        const config = consensusConfig[decision.consensus];
                        const IconComponent = config.icon;

                        return (
                            <div
                                key={index}
                                className="p-4 rounded-lg border bg-card"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm flex-1">{decision.description}</p>
                                    <Badge
                                        variant="secondary"
                                        className={`flex items-center gap-1 ${config.color}`}
                                    >
                                        <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                                        {decision.consensus}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};