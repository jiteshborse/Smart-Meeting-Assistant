import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useOrganizationStore } from '../../stores/organizationStore';
import { useToast } from '../ui/use-toast';

interface CreateOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
    open,
    onOpenChange
}) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createOrganization } = useOrganizationStore();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Error',
                description: 'Workspace name is required',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const org = await createOrganization(name);
            if (org) {
                toast({
                    title: 'Success',
                    description: `Workspace "${name}" created successfully`
                });
                onOpenChange(false);
                setName('');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create workspace',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                        <DialogDescription>
                            Create a new workspace to collaborate with your team
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Acme Inc, Marketing Team"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};