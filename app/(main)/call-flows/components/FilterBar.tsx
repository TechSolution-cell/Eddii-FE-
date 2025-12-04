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
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { MarketingSourcePicker } from './MarketingSourcePicker';

const usPhoneSchema = z
    .string()
    .trim()
    .superRefine((s, ctx) => {
        if (s === '') return; // allow blank

        // Remove common separators but keep leading '+'
        const compact = s.replace(/[ .()\-\t]/g, '');
        const digits = s.replace(/\D/g, '');

        const e164Ok = /^\+1\d{10}$/.test(compact);
        const plainOk = digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));

        if (compact.includes('+')) {
            if (!e164Ok) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Enter a 10-digit number or +1 followed by 10 digits',
                });
            }
        } else if (!plainOk) {
            ctx.addIssue({
                code: 'custom',
                message: 'Enter a 10-digit number or +1 followed by 10 digits',
            });
        }
    })
    // Normalize to E.164 (+11234567890)
    .transform((s) => {
        const digits = s.replace(/\D/g, '');
        if (digits === '') return '';
        const nationalNumber = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
        return `+1${nationalNumber}`;
    });

const Schema = z.object({
    number: usPhoneSchema,
    forwardingVoiceNumber: usPhoneSchema,
    marketingSourceId: z.union([z.literal(""), z.literal("#"), z.uuid()])
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
        resolver: zodResolver(Schema),
        defaultValues,
        mode: 'onChange'
    });
    const debounced = useDebouncedCallback((values: Filters) => onChange(values), 400);

    // watch & debounce
    useEffect(() => {
        const sub = form.watch((values) => {
            const parsed = Schema.safeParse(values);
            if (parsed.success) {
                debounced(parsed.data); // ← only fires when the whole form is valid
            }
        });
        return () => sub.unsubscribe();
    }, [form, debounced]);

    return (
        <Form {...form}>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Number</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDisabled}
                                    className='border-purple-200 focus:border-purple-500 h-10'
                                    {...field}
                                    placeholder="Search number..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="forwardingVoiceNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Forwarding Number</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDisabled}
                                    className='border-purple-200 focus:border-purple-500 h-10'
                                    {...field}
                                    placeholder="Forwarding number..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className={cn(isDisabled && 'pointer-events-none')}>
                    <Label htmlFor="marketingSource" className="select-none">Marketing Source</Label>
                    <MarketingSourcePicker
                        value={form.watch("marketingSourceId")}
                        onChange={(v) =>
                            form.setValue("marketingSourceId", v, {
                                shouldValidate: true,
                                shouldDirty: true,
                            })
                        }
                        includeNoneOption={true}
                        placeholder="Select marketing source"
                    />
                    {/* {form.formState.errors.marketingSourceId && (
                        <p className="text-xs text-red-600">
                            {form.formState.errors.marketingSourceId.message}
                        </p>
                    )} */}
                </div>
                <div className={cn('flex gap-2', 'items-start translate-y-6')}>
                    <Button
                        disabled={isDisabled}
                        type="button"
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => {
                            form.reset({
                                number: '',
                                forwardingVoiceNumber: '',
                                marketingSourceId: ''
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
