'use client'

// ── React & libs ──────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// ── App utilities / hooks / state ────────────────────────────────────
import { cn } from '@/lib/utils';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Form } from '@/components/ui/form';
import { MarketingSourcePicker } from '../../call-flows/components/MarketingSourcePicker';
import { DateRangePicker, DateRange } from '@/components/DateRangePicker';

const Schema = z.object({
    from: z.date(),
    to: z.date(),
    marketingSourceId: z.union([z.literal(""), z.literal("#"), z.uuid()])
});
export type Filters = z.infer<typeof Schema>;

type Props = {
    defaultValues: Filters;
    onChange: (v: Filters) => void; // debounced change
    onClear?: () => void;
    isDisabled?: boolean
};

export function FilterBar({ defaultValues, onChange, isDisabled }: Props) {

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
            <form className={cn("flex sm:flex-row flex-col gap-3 items-center", isDisabled && "pointer-events-none")}>
                <div className='w-80 '>
                    {/* <Label htmlFor="marketingSource" className="select-none">Marketing Source</Label> */}
                    <MarketingSourcePicker
                        value={form.watch("marketingSourceId")}
                        onChange={(v) =>
                            form.setValue("marketingSourceId", v, {
                                shouldValidate: true,
                                shouldDirty: true,
                            })
                        }
                        includeNoneOption={false}
                        placeholder="Select marketing source"
                    />
                    {/* {form.formState.errors.marketingSourceId && (
                        <p className="text-xs text-red-600">
                            {form.formState.errors.marketingSourceId.message}
                        </p>
                    )} */}
                </div>
                <div>
                    <DateRangePicker
                        dateRange={{
                            from: form.watch('from'),
                            to: form.watch('to')
                        }}
                        initialPreset='custom'
                        onDateRangeChange={(range: DateRange) => {
                            form.setValue('from', range?.from ?? startOfDay(subDays(new Date(), 29)));
                            form.setValue('to', range?.to ?? endOfDay(new Date()));
                        }}
                    />
                </div>
            </form>
        </Form>
    );
}
