import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useDebouncedCallback } from 'use-debounce';

const Schema = z.object({
    name: z.string().max(255).optional(),
    channel: z.union([z.string().max(255), z.array(z.string().max(255))]).optional(),
    campaignName: z.string().max(255).optional(),
});
export type Filters = z.infer<typeof Schema>;

type Props = {
    defaultValues: Filters;
    onChange: (v: Filters) => void; // debounced change
    onClear?: () => void;
    isDiabled?: boolean;
};

export function FilterBar({ defaultValues, onChange, onClear, isDiabled = false }: Props) {
    const form = useForm<Filters>({ resolver: zodResolver(Schema), defaultValues });
    const debounced = useDebouncedCallback((values: Filters) => onChange(values), 400);

    // watch & debounce
    useEffect(() => {
        const sub = form.watch((values) => debounced(values as Filters));
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
                                    disabled={isDiabled}
                                    className='border-purple-200 focus:border-purple-500 h-10'
                                    {...field}
                                    placeholder="Search name..." />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Channel</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDiabled}
                                    className='border-purple-200 focus:border-purple-500 h-10'
                                    {...field}
                                    placeholder="e.g. Google / Facebook"
                                // If you later switch to a multiselect, keep `channel` as string[]
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Campaign</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={isDiabled}
                                    className='border-purple-200 focus:border-purple-500 h-10'
                                    {...field}
                                    placeholder="Campaign name..."
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex items-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDiabled}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => {
                            form.reset({
                                name: '',
                                channel: '',
                                campaignName: '',
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
