import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
    Calendar,
    User,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus
} from 'lucide-react';
import type { ActionItem } from '../../types/database';
import { format } from 'date-fns';

interface ActionItemsProps {
    items: ActionItem[];
    onStatusChange: (id: string, status: string) => void;
    onAdd?: () => void;
}

const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
};

const statusIcons = {
    pending: Clock,
    'in-progress': AlertCircle,
    completed: CheckCircle2
};

export const ActionItems: React.FC<ActionItemsProps> = ({
    items,
    onStatusChange,
    onAdd
}) => {
    const [filter, setFilter] = useState<string>('all');

    const filteredItems = items.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'pending') return item.status === 'pending';
        if (filter === 'in-progress') return item.status === 'in-progress';
        if (filter === 'completed') return item.status === 'completed';
        return true;
    });

    const groupedByPriority = {
        high: filteredItems.filter(i => i.priority === 'high'),
        medium: filteredItems.filter(i => i.priority === 'medium'),
        low: filteredItems.filter(i => i.priority === 'low')
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Action Items</CardTitle>
                <div className="flex gap-2">
                    <select
                        className="text-sm border rounded-md px-2 py-1"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    {onAdd && (
                        <Button size="sm" onClick={onAdd}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No action items yet</p>
                        <p className="text-sm">AI will extract tasks from your meeting</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(['high', 'medium', 'low'] as const).map(priority => (
                            groupedByPriority[priority].length > 0 && (
                                <div key={priority}>
                                    <h4 className="text-sm font-medium mb-3 capitalize flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${priority === 'high' ? 'bg-red-500' :
                                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} />
                                        {priority} Priority ({groupedByPriority[priority].length})
                                    </h4>
                                    <div className="space-y-3">
                                        {groupedByPriority[priority].map((item) => {
                                            const StatusIcon = statusIcons[item.status];

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <Checkbox
                                                        checked={item.status === 'completed'}
                                                        onCheckedChange={(checked) => {
                                                            onStatusChange(
                                                                item.id,
                                                                checked ? 'completed' : 'pending'
                                                            );
                                                        }}
                                                        className="mt-1"
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${item.status === 'completed'
                                                            ? 'line-through text-muted-foreground'
                                                            : ''
                                                            }`}>
                                                            {item.description}
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            {item.assignee && (
                                                                <div className="flex items-center text-xs text-muted-foreground">
                                                                    <User className="h-3 w-3 mr-1" />
                                                                    {item.assignee}
                                                                </div>
                                                            )}

                                                            {item.due_date && (
                                                                <div className="flex items-center text-xs text-muted-foreground">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    Due {format(new Date(item.due_date), 'MMM d, yyyy')}
                                                                </div>
                                                            )}

                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-xs ${priorityColors[item.priority]}`}
                                                            >
                                                                {item.priority}
                                                            </Badge>

                                                            <Badge variant="outline" className="text-xs">
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {item.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};