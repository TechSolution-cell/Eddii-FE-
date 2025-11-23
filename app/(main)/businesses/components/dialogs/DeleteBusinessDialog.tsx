'use client'

// ── React & libs ──────────────────────────────────────────────────────

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';

import {
    useDeleteBusiness,
} from '@/features/businesses/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────
import { Business } from '@/types';

interface DeleteBusinessDialogProps {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    onDeleteSuccess?: () => void;
    businessToDelete: Business | null;
}

const DeleteBusinessDialog = ({ open, onOpenChange, businessToDelete }: DeleteBusinessDialogProps) => {

    const deleteBusiness = useDeleteBusiness();

    const handleDelete = async () => {
        if (!businessToDelete?.id || deleteBusiness.isPending) return;

        try {
            await deleteBusiness.mutateAsync(businessToDelete.id);
            onOpenChange?.(false);
            notify.ok('Business deleted.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Failed to delete.', { description: message ?? '' });
        }
    }

    const handleDeleteDialogOpenChange = (open: boolean) => {
        if (!open && deleteBusiness.isPending) return;
        onOpenChange?.(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDeleteDialogOpenChange} >
            <DialogContent
                onEscapeKeyDown={(e) => {
                    if (deleteBusiness.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (deleteBusiness.isPending) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-700 text-xl">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                        Delete Business Account
                    </DialogTitle>
                    <DialogDescription >
                        Are you sure you want to delete this business account? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {businessToDelete && (
                    <div className="bg-muted p-4 rounded-md">
                        <div className="font-medium text-slate-700">{businessToDelete.businessName}</div>
                        <div className="text-sm  text-slate-600">Email: {businessToDelete.email}</div>
                        {/* text-muted-forground */}
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button type="button"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        variant="outline"
                        onClick={() => {
                            handleDeleteDialogOpenChange(false);
                        }}
                        disabled={deleteBusiness.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => { handleDelete() }}
                        variant="destructive"
                        disabled={deleteBusiness.isPending}>
                        {deleteBusiness.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteBusinessDialog;