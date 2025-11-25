'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';

import {
    useCreateMarketingSource,
} from '@/features/marketing-sources/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';



interface CreateMsDialogProps {
    open?: boolean,
    onOpenChange?: (v: boolean) => void;
    onCreateSuccess?: () => void;
}

const CreateSchema = z.object({
    name: z.string().min(2, 'Marketing source name must be at least 2 characters').max(255),
    description: z.string().max(255).optional(),
    channel: z.string().max(255).optional(),
    campaignName: z.string().max(255).optional(),
});
type CreateValues = z.infer<typeof CreateSchema>;

export default function CreateMsDialog({ open, onOpenChange, onCreateSuccess }: CreateMsDialogProps) {
    const createMarketingSource = useCreateMarketingSource();

    const createForm = useForm<CreateValues>({
        resolver: zodResolver(CreateSchema),
        defaultValues: {
            name: '',
            description: '',
            channel: '',
            campaignName: ''
        },
    });

    // Init the form when a dialog opens
    useEffect(() => {
        if (open) {
            createForm.reset({
                name: '',
                description: '',
                channel: '',
                campaignName: ''
            });
        }
    }, [open, createForm]);

    const handleCreate = async (values: CreateValues) => {
        try {
            await createMarketingSource.mutateAsync(values);

            notify.ok('Marketing source created successfully.');
            createForm.reset();

            onOpenChange?.(false);
            onCreateSuccess?.();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Failed to create marketing source.', { description: message ?? '' });
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && createMarketingSource.isPending) return;
        onOpenChange?.(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent
                className="border-purple-200"
                onEscapeKeyDown={(e) => {
                    if (createMarketingSource.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (createMarketingSource.isPending) e.preventDefault();
                }}
            >
                <DialogHeader className="border-b border-purple-100 pb-4">
                    <DialogTitle className="text-purple-700 text-xl">Create Maketing Source</DialogTitle>
                </DialogHeader>

                <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4" autoComplete='off' name='create-ms-form'>
                        <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marketing Source Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter a marekting source name..."
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
                            control={createForm.control}
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
                            control={createForm.control}
                            name="campaignName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter a campagin name..."
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
                            control={createForm.control}
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
                                disabled={createMarketingSource.isPending}
                                className="border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
                            >
                                {createMarketingSource.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {createMarketingSource.isPending ? 'Creating...' : 'Create Source'}
                            </Button>
                            <Button
                                type="button"
                                disabled={createMarketingSource.isPending}
                                variant="outline"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50"
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


