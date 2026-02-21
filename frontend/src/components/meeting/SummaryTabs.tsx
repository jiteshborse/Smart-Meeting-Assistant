import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileText, List, AlignLeft } from 'lucide-react';

interface SummaryProps {
    summary: {
        executive: string;
        detailed: string;
        bulletPoints: string[];
    };
}

export const SummaryTabs: React.FC<SummaryProps> = ({ summary }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Meeting Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="executive" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="executive" className="flex items-center gap-1">
                            <AlignLeft className="h-3 w-3" />
                            Executive
                        </TabsTrigger>
                        <TabsTrigger value="detailed" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Detailed
                        </TabsTrigger>
                        <TabsTrigger value="bullets" className="flex items-center gap-1">
                            <List className="h-3 w-3" />
                            Key Points
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="executive">
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-base leading-relaxed">{summary.executive}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="detailed">
                        <div className="prose dark:prose-invert max-w-none">
                            {summary.detailed.split('\n').map((paragraph, i) => (
                                <p key={i} className="text-base leading-relaxed mb-3">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="bullets">
                        <ul className="space-y-2">
                            {summary.bulletPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                    <span className="text-base">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
