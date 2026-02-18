import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export const ConfirmDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    description
}: ConfirmDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};