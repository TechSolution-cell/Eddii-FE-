'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';

// ── App utilities / hooks / state ────────────────────────────────────
import { cn } from '@/lib/utils';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';


const Schema = z.object({
    name: z.string().max(255).optional(),
    email: z.preprocess(
        (v) => (typeof v === 'string' ? v.trim() : v),
        z.union([z.email('Invalid email address'), z.literal('')])
    ).optional(),
});
export type Filters = z.infer<typeof Schema>;

type Props = {
    defaultValues: Filters;
    onChange: (v: Filters) => void; // debounced change
    onClear?: () => void;
    isDisabled?: boolean;
};

export function FilterBar({ defaultValues, onChange, onClear, isDisabled = false }: Props) {
    const form = useForm<Filters>({
        // @ts-expect-error -- zodResolver type inference mismatch with RHF resolver generic in our setup
        resolver: zodResolver(Schema),
        defaultValues,
        mode: 'onChange'
    });
    const debounced = useDebouncedCallback((values: Filters) => onChange(values), 400);

    // watch & debounce
    useEffect(() => {
        const sub = form.watch((values) => {
            const email = (values as Filters).email?.trim() ?? '';

            // Only trigger when email is empty OR valid
            const isEmailValid =
                email.length === 0 || z.email().safeParse(email).success;

            if (isEmailValid) {
                debounced(values as Filters);
            }
        });
        return () => sub.unsubscribe();
    }, [form, debounced]);

    return (
        <Form {...form}>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDisabled}
                                    className='border-purple-200 focus:border-purple-500'
                                    {...field}
                                    placeholder="Search name..." />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDisabled}
                                    className='border-purple-200 focus:border-purple-500'
                                    {...field}
                                    placeholder="Email..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className={cn('flex gap-2', Object.keys(form.formState.errors).length ? 'items-center' : 'items-end')}>
                    <Button
                        disabled={isDisabled}
                        type="button"
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => {
                            form.reset({
                                name: '',
                                email: '',
                            });
                            onClear?.();
                        }}>
                        Clear
                    </Button>
                </div>
            </form>
        </Form>
    );
}
