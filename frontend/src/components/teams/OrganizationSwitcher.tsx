import React, { useEffect, useState } from 'react';
import { useOrganizationStore } from '../../stores/organizationStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';

export const OrganizationSwitcher: React.FC = () => {
    const {
        organizations,
        currentOrganization,
        fetchOrganizations,
        setCurrentOrganization
    } = useOrganizationStore();

    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    // Set first organization as default if none selected
    useEffect(() => {
        if (!currentOrganization && organizations.length > 0) {
            setCurrentOrganization(organizations[0]);
        }
    }, [organizations, currentOrganization]);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                        <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                                {currentOrganization?.name || 'Select Workspace'}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {organizations.map((org) => (
                        <DropdownMenuItem
                            key={org.id}
                            onClick={() => setCurrentOrganization(org)}
                            className={org.id === currentOrganization?.id ? 'bg-muted' : ''}
                        >
                            <Building2 className="h-4 w-4 mr-2" />
                            <span className="truncate">{org.name}</span>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workspace
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrganizationDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
            />
        </>
    );
};