'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── App utilities / hooks / state ────────────────────────────────────
import { notify } from '@/lib/notify';

import {
    useCreateBusiness,
} from '@/features/businesses/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import MaxTrackingNumbersSelect from '../MaxTrackingNumbersSelect';
import { Eye, EyeOff, Loader2 } from 'lucide-react';


const CreateSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirmation: z.string(),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
    maxTrackingNumbers: z.number().min(10).max(500),
    // accountRole: z.enum(['SUPER_ADMIN', 'BUSINESS_ADMIN']).default('BUSINESS_ADMIN'),
}).superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirmation) {
        ctx.addIssue({
            code: 'custom',
            message: "Passwords don't match",
            path: ['passwordConfirmation'],
        });
    }
});
// const PasswordSchema = z
//   .union([z.string().min(6, 'Password must be at least 6 characters'), z.literal(''), z.undefined()]);
// .transform((v) => (v === '' ? undefined : v));

type CreateValues = z.infer<typeof CreateSchema>;


interface CreateBusinessDialogProps {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    onCreateSuccess?: () => void;
}

const CreateBusinessDialog = ({ open, onOpenChange, onCreateSuccess }: CreateBusinessDialogProps) => {

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const createBusiness = useCreateBusiness();

    const createForm = useForm<CreateValues>({
        resolver: zodResolver(CreateSchema),
        defaultValues: {
            email: '',
            password: '',
            passwordConfirmation: '',
            businessName: '',
            maxTrackingNumbers: 50
        },
        mode: 'onChange',
        reValidateMode: 'onChange'
    });


    // Re-validate confirmation when password changes
    useEffect(() => {
        const sub = createForm.watch((_, { name }) => {
            if (name === 'password') createForm.trigger('passwordConfirmation');
        });
        return () => sub.unsubscribe?.();
    }, [createForm]);


    const handleCreate = async (values: CreateValues) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordConfirmation: _unused, ...payload } = values;

        createBusiness.mutate(payload as Omit<CreateValues, 'passwordConfirmation'>, {
            onSuccess: () => {
                notify.ok('Business created successfully.');
                onOpenChange?.(false);
                onCreateSuccess?.();

                createForm.reset();
            },
            onError: (err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                notify.err('Failed to create business.', { description: message ?? '' });
            }
            // toast({
            //   title: 'Error',
            //   description: 'Failed to create business account',
            //   variant: 'destructive',
            // })
        });
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && createBusiness.isPending) return;

        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);

        createForm.reset({});
        onOpenChange?.(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent
                className="border-purple-200"
                isProcessing={createBusiness.isPending}
                onEscapeKeyDown={(e) => {
                    if (createBusiness.isPending) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (createBusiness.isPending) e.preventDefault();
                }}>
                <DialogHeader className="border-b border-purple-100 pb-4">
                    <DialogTitle className="text-purple-700 text-xl">Create Business</DialogTitle>
                </DialogHeader>

                <Form {...createForm} >
                    <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4" autoComplete='off' name='create-biz-form'>

                        <input type="text" name="fake-email" autoComplete="off" tabIndex={-1} className="hidden" />
                        <input type="password" name="fake-password" autoComplete="new-password" tabIndex={-1} className="hidden" />

                        <FormField
                            control={createForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email:</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder='Enter an email...'
                                            {...field}
                                            autoComplete='off'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                        // readOnly
                                        // onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={createForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password:</FormLabel>
                                    <FormControl>
                                        <div className='relative'>
                                            <Input
                                                type={isPasswordVisible ? "text" : "password"}
                                                {...field}
                                                placeholder='Enter a password...'
                                                autoComplete='new-password'
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                data-gramm="false"
                                                data-enable-grammarly="false"
                                                data-lt-active="false"
                                            // readOnly
                                            // onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
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
                            control={createForm.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    {/* <FormLabel>Confirm Password</FormLabel> */}
                                    <FormControl>
                                        <div className='relative'>
                                            <Input
                                                type={isConfirmPasswordVisible ? "text" : "password"}
                                                {...field}
                                                placeholder='Confirm password...'
                                                autoComplete='new-password-confirmation'
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                data-gramm="false"
                                                data-enable-grammarly="false"
                                                data-lt-active="false"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
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
                            control={createForm.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Name:</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder='Enter a business name...'
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            data-gramm="false"
                                            data-enable-grammarly="false"
                                            data-lt-active="false"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={createForm.control}
                            name="maxTrackingNumbers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Tracking Numbers:</FormLabel>
                                    <FormControl>
                                        <MaxTrackingNumbersSelect
                                            value={field.value}
                                            onChange={(v) => createForm.setValue('maxTrackingNumbers', v, { shouldValidate: true, shouldDirty: true })}
                                            min={0}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={!createForm.formState.isDirty || createBusiness.isPending}
                                className="border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
                            >
                                {createBusiness.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {createBusiness.isPending ? 'Creating...' : 'Create Business'}
                            </Button>
                            <Button type="button" disabled={createBusiness.isPending} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                onClick={() => onOpenChange?.(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}

export default CreateBusinessDialog;