'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';
import { buildChangedPayload } from '@/lib/utils';

import {
    useUpdateMarketingSource,
} from '@/features/marketing-sources/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// ──  Types & Interfaces  ───────────────────────────────────────────────
import { MarketingSource } from '@/types';

const UpdateSchema = z.object({
    name: z.string().min(2, 'Marketing source name must be at least 2 characters').max(255).optional(),
    description: z.string().max(255).optional(),
    channel: z.string().max(255).optional(),
    campaignName: z.string().max(255).optional(),
});
type UpdateValues = z.infer<typeof UpdateSchema>;


interface EditMsDialogProps {
    open?: boolean,
    onOpenChange?: (v: boolean) => void;
    onEditSuccess?: () => void;
    editingMs: MarketingSource | null;
}

export default function EditMsDialog({ open, onOpenChange, onEditSuccess, editingMs }: EditMsDialogProps) {
    const updateMarketingSource = useUpdateMarketingSource();

    const editForm = useForm<UpdateValues>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            name: '',
            description: '',
            channel: '',
            campaignName: ''
        },
    });

    // Reset the form when dialog opens
    useEffect(() => {
        if (open && editingMs) {
            editForm.reset({
                name: editingMs.name,
                channel: editingMs?.channel ?? '',
                campaignName: editingMs?.campaignName ?? '',
                description: editingMs?.description ?? ''
            });
        }
    }, [open, editingMs, editForm]);

    const handleUpdate = async (values: UpdateValues) => {
        if (!editingMs?.id || updateMarketingSource.isPending) return;

        try {
            const original = (editForm.formState.defaultValues ?? {}) as Partial<UpdateValues>;
            const dirty = editForm.formState.dirtyFields as Partial<Record<keyof UpdateValues, boolean>>;
            const payload = buildChangedPayload<UpdateValues>(values, original, {
                requireDirty: false,
                dirty,
                stripUndefined: true
            });

            if (Object.keys(payload).length === 0) {
                notify.info('No changes to save.');
                return;
            }

            await updateMarketingSource.mutateAsync({ id: editingMs.id, payload });

            onOpenChange?.(false);
            editForm.reset({});
            onEditSuccess?.();
            notify.ok('Business updated successfully.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Update failed.', { description: message ?? '' });
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && updateMarketingSource.isPending) return;
        onOpenChange?.(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent
                className="border-purple-200"
                onEscapeKeyDown={(e) => {
                    if (updateMarketingSource.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (updateMarketingSource.isPending) e.preventDefault();
                }}
            >
                <DialogHeader className="border-b border-purple-100 pb-4">
                    <DialogTitle className="text-purple-700 text-xl">Edit Markeing Source</DialogTitle>
                </DialogHeader>

                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4" name='edit-ms-form'>
                        <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marketing Source Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter a marketing source name..."
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                            className="border-purple-200 focus:border-purple-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="channel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Channel</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter a channel name..."
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                            className="border-purple-200 focus:border-purple-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="campaignName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter a campaign name..."
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                            className="border-purple-200 focus:border-purple-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Enter your description here..."
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                            className="border-purple-200 focus:border-purple-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={updateMarketingSource.isPending || !editForm.formState.isDirty}
                                className="select-none border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
                            >
                                {updateMarketingSource.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {updateMarketingSource.isPending ? 'Saving...' : 'Save changes'}
                            </Button>
                            <Button
                                type="button"
                                disabled={updateMarketingSource.isPending}
                                variant="outline"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50 select-none"
                                onClick={() => onOpenChange?.(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


