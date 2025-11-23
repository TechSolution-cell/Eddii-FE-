'use client'

// ── React & libs ──────────────────────────────────────────────────────

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';

import { useDeleteMarketingSource } from '@/features/marketing-sources/api';


// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────
import { MarketingSource } from '@/types';

interface DeleteMsDialogProps {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    onDeleteSuccess?: () => void;
    msToDelete: MarketingSource | null;
}

const DeleteMsDialog = ({ open, onOpenChange, msToDelete }: DeleteMsDialogProps) => {

    const deleteMs = useDeleteMarketingSource();

    const handleDelete = async () => {
        if (deleteMs.isPending || !msToDelete?.id) return;

        try {
            await deleteMs.mutateAsync(msToDelete.id);

            onOpenChange?.(false);
            notify.ok('Marketing source deleted.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Delete failed.', { description: message });
        }
    };

    const handleDeleteDialogOpenChange = (open: boolean) => {
        if (!open && deleteMs.isPending) return;
        onOpenChange?.(open);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleDeleteDialogOpenChange} >
            <DialogContent
                onEscapeKeyDown={(e) => {
                    if (deleteMs.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (deleteMs.isPending) e.preventDefault();
                }}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-700 text-xl">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                        Delete Marketing Source
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this marketing source? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {msToDelete && (
                    <div className="bg-muted p-4 rounded-md text-slate-700">
                        <div className="font-medium">{msToDelete.name}</div>
                        {!!msToDelete?.description && (
                            <div className="text-sm text-slate-600">
                                Description: {msToDelete?.description}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => { handleDeleteDialogOpenChange(false); }}
                        disabled={deleteMs.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className={deleteMs.isPending ? 'pointer-events-none' : ''}
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMs.isPending}>
                        {deleteMs.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deleting...
                            </>) : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    )
}

export default DeleteMsDialog;