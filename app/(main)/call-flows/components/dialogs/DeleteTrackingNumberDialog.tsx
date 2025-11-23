"use client";

// ──  React & libs  ──────────────────────────────────────────────────────

// ──  App utilities / hooks / state  ────────────────────────────────────
import {
    useDeleteTrackingNumber,
} from "@/features/call-tracking/api";
import { fmt } from "@/lib/utils";

// ──  UI (radix + icons)  ───────────────────────────────────────────────
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { notify } from "@/lib/notify";

// ── Types ─────────────────────────────────────────────────────────────
import { TrackingNumber } from "@/types";


interface CreateTrackingNumberDialogProps {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    onDeleteSucess?: () => void;
    tnToDelete: TrackingNumber | null;
}


export function DeleteTrackingNumberDialog({ open, onOpenChange, tnToDelete }: CreateTrackingNumberDialogProps) {

    const deleteTrackingNumber = useDeleteTrackingNumber();

    const handleDelete = async () => {
        if (deleteTrackingNumber.isPending || !tnToDelete?.id) return;

        try {
            const res = await deleteTrackingNumber.mutateAsync(tnToDelete.id);
            if (res.deleted) {
                onOpenChange?.(false);
                notify.ok('racking number deleted successfully.');
            } else {
                notify.err('Failed to delete tracking number.', {
                    description: res?.reason ?? ''
                });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Failed to delete tracking number.', {
                description: message ?? ''
            })
        }
    };

    const handleDeleteDialogOpenChange = (open: boolean) => {
        if (!open && deleteTrackingNumber.isPending) return;
        onOpenChange?.(open);
    };


    return (
        <Dialog open={open} onOpenChange={handleDeleteDialogOpenChange}>
            <DialogContent
                onEscapeKeyDown={(e) => {
                    if (deleteTrackingNumber.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (deleteTrackingNumber.isPending) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-700 text-xl">
                        <AlertTriangle className="h-7 w-7 text-rose-600" />
                        Delete Tracking Number
                    </DialogTitle>
                    <DialogDescription className='text-purple-800/80'>
                        Are you sure you want to delete this tracking number? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {tnToDelete && (
                    <div className="bg-muted p-4 rounded-md">
                        <div className="font-medium text-slate-700">Tracking Number: {fmt(tnToDelete.number)}</div>
                        {tnToDelete?.marketingSource && (
                            <div className="text-sm text-slate-600">
                                Marketing Source: {tnToDelete.marketingSource?.name}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => { handleDeleteDialogOpenChange(false); }}
                        disabled={deleteTrackingNumber.isPending}>
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => { handleDelete(); }}
                        disabled={deleteTrackingNumber.isPending}>
                        {deleteTrackingNumber.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
