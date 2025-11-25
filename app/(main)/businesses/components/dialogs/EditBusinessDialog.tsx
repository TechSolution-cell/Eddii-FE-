'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';
import { buildChangedPayload } from '@/lib/utils';

import {
    useUpdateBusiness,
} from '@/features/businesses/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import MaxTrackingNumbersSelect from '../MaxTrackingNumbersSelect';

// ── Types & Interfaces ───────────────────────────────────────────────
import { Business } from '@/types';

interface EditBusinessDialogProps {
    open?: boolean,
    onOpenChange?: (v: boolean) => void;
    editingBusiness: Business | null;
}

const UpdateSchema = z.object({
    email: z.email('Invalid email address').optional(),
    password: z.union([z.string().min(6, 'Password must be at least 6 characters'), z.literal(''), z.undefined()]),
    passwordConfirmation: z.union([z.string(), z.undefined()]),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255).optional(),
    maxTrackingNumbers: z.number().min(10).max(500).optional()
    // accountRole: z.enum(['SUPER_ADMIN', 'BUSINESS_ADMIN']).optional(),
}).superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirmation) {
        ctx.addIssue({
            code: 'custom',
            message: "Passwords don't match",
            path: ['passwordConfirmation'],
        });
    }
});

// .refine((data) => data.password === data.passwordConfirmation, {
//   message: "Passwords don't match",
//   path: ["passwordConfirmation"],
// });

type UpdateValues = z.infer<typeof UpdateSchema>;

const EditBusinessDialog = ({ open, onOpenChange, editingBusiness }: EditBusinessDialogProps) => {

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const updateBusiness = useUpdateBusiness();

    const editForm = useForm<UpdateValues>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            email: '',
            businessName: '',
            maxTrackingNumbers: 50,
            password: '',
            passwordConfirmation: ''
        },
        mode: 'onChange',
        reValidateMode: 'onChange'
    });

    useEffect(() => {
        // @typescript-eslint/no-unused-vars
        const sub = editForm.watch((_, { name }) => {
            if (name === 'password') editForm.trigger('passwordConfirmation');
        });
        return () => sub.unsubscribe?.();
    }, [editForm]);

    // Reset Form when a dialog opens
    useEffect(() => {
        if (!open || !editingBusiness) return;

        editForm.reset({
            email: editingBusiness.email,
            businessName: editingBusiness.businessName,
            maxTrackingNumbers: editingBusiness.maxTrackingNumbers,
            password: '',
            passwordConfirmation: ''
        });
    }, [open, editingBusiness, editForm]);

    const handleUpdate = async (values: UpdateValues) => {
        if (!editingBusiness?.id) return;

        // use whatever you seeded via reset as the baseline (no extra ref needed)
        const original = (editForm.formState.defaultValues ?? {}) as Partial<UpdateValues>;

        // NOTE: RHF's dirtyFields type can be nested; your form is flat, so this is fine:
        const dirty = editForm.formState.dirtyFields as Partial<Record<keyof UpdateValues, boolean>>;

        const payload = buildChangedPayload<UpdateValues>(values, original, {
            // set to true if you ONLY want fields the user interacted with
            requireDirty: false,
            dirty,
            stripUndefined: true, // don't send undefined keys
            // equals: (a, b) => a === b, // default—override if you need custom compare
        });

        if (payload?.maxTrackingNumbers && (payload.maxTrackingNumbers < editingBusiness.trackingNumbersUsedCount)) {
            notify.err('Max tracking numbers cannot be less than current used count.', {
                description: `Used: ${editingBusiness.trackingNumbersUsedCount}, Selected max: ${values.maxTrackingNumbers}`,
            });
            return;
        }

        // Remove passwordConfirmation if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordConfirmation: _, ...updates } = (payload ?? {}) as Partial<UpdateValues>;

        if (Object.keys(payload).length === 0) {
            notify.info('No changes to save.');
            return;
        }

        try {
            await updateBusiness.mutateAsync({ id: editingBusiness.id, payload: updates });

            notify.ok('Business updated successfully.');
            onOpenChange?.(false);
            editForm.reset({});
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            notify.err('Failed to update.', { description: message ?? '' });
        }
    }

    const handleEditDialogOpenChange = (open: boolean) => {
        if (!open && updateBusiness.isPending) return;

        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);

        onOpenChange?.(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleEditDialogOpenChange}>
            <DialogContent
                className="border-purple-200"
                onEscapeKeyDown={(e) => {
                    if (updateBusiness.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (updateBusiness.isPending) e.preventDefault();
                }}
            >
                <DialogHeader className="border-b border-purple-100 pb-4">
                    <DialogTitle className="text-purple-700 text-xl">Edit Business Account</DialogTitle>
                </DialogHeader>

                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4" autoComplete='off' name='edit-biz-form'>
                        <input type="text" name="fake-email-2" autoComplete="off" tabIndex={-1} className="hidden" />
                        <input type="password" name="fake-password-2" autoComplete="new-password" tabIndex={-1} className="hidden" />
                        <FormField
                            control={editForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email:</FormLabel>
                                    <FormControl>
                                        <Input type="email"
                                            {...field}
                                            placeholder='Enter an email...'
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={editForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password:</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                placeholder='Enter a password...'
                                                type={isPasswordVisible ? "text" : "password"}
                                                autoComplete='new-password-1'
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                data-gramm="false"
                                                data-enable-grammarly="false"
                                                data-lt-active="false" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setIsConfirmPasswordVisible(!isPasswordVisible)}
                                            >
                                                {isConfirmPasswordVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={editForm.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                placeholder='Cofirm password...'
                                                type={isConfirmPasswordVisible ? "text" : "password"}
                                                autoComplete='new-password-1'
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                data-gramm="false"
                                                data-enable-grammarly="false"
                                                data-lt-active="false" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setIsPasswordVisible(!isConfirmPasswordVisible)}
                                            >
                                                {isPasswordVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={editForm.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Name:</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={editForm.control}
                            name="maxTrackingNumbers"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <FormLabel>Max Tracking Numbers:</FormLabel>
                                        <FormControl>
                                            <MaxTrackingNumbersSelect
                                                value={field.value}
                                                onChange={(v) => editForm.setValue('maxTrackingNumbers', v, {
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                })}
                                                min={editingBusiness?.trackingNumbersUsedCount ?? 0}
                                                options={[10, 20, 50, 100]}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>)
                            }}
                        />
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="submit"
                                disabled={updateBusiness.isPending || !editForm.formState.isDirty}
                                className="border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
                            >
                                {updateBusiness.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {updateBusiness.isPending ? 'Saving...' : 'Save changes'}
                            </Button>
                            <Button type="button"
                                disabled={updateBusiness.isPending}
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

export default EditBusinessDialog;