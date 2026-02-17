import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface TranscriptSegment {
    id: string;
    speaker: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
}

interface TranscriptDisplayProps {
    segments: TranscriptSegment[];
    interimText: string;
    isRecording: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
    segments,
    interimText,
    isRecording
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new content
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [segments, interimText]);

    // Group segments by speaker for better UI
    const groupedSegments = segments.reduce((groups, segment) => {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.speaker === segment.speaker) {
            lastGroup.text += ' ' + segment.text;
        } else {
            groups.push({ ...segment });
        }
        return groups;
    }, [] as TranscriptSegment[]);

    // Generate colors for speakers
    const getSpeakerColor = (speaker: string) => {
        const colors = [
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
        ];
        const speakerNum = parseInt(speaker.split(' ')[1]) || 1;
        return colors[(speakerNum - 1) % colors.length];
    };

    return (
        <Card className="w-full h-full">
            <CardHeader className="py-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Live Transcript</span>
                    {isRecording && (
                        <Badge variant="outline" className="animate-pulse">
                            Recording
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {/* Final segments */}
                        {groupedSegments.map((segment) => (
                            <div key={segment.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getSpeakerColor(segment.speaker)}`}>
                                        {segment.speaker}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(segment.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-sm pl-2">{segment.text}</p>
                            </div>
                        ))}

                        {/* Interim text */}
                        {interimText && (
                            <div className="space-y-1 opacity-60">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getSpeakerColor('Speaker X')}`}>
                                        ...
                                    </span>
                                </div>
                                <p className="text-sm pl-2 italic">{interimText}</p>
                            </div>
                        )}

                        {/* Empty state */}
                        {segments.length === 0 && !interimText && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Start speaking to see transcript</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};