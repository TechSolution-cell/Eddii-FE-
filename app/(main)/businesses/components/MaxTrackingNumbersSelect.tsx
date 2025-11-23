'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormControl } from '@/components/ui/form';

type Props = {
    value?: number;
    onChange: (value: number) => void;
    /** Minimum allowed value, e.g. current used count. Options below this are disabled. */
    min?: number;
    /** Allowed choices. */
    options?: number[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function MaxTrackingNumbersSelect({
    value,
    onChange,
    min = 0,
    options = [10, 20, 50, 100],
    placeholder = 'Select limit',
    disabled,
    className,
}: Props) {
    return (
        <FormControl>
            <Select
                value={value != null ? String(value) : ''}
                onValueChange={(v) => onChange(Number(v))}
                disabled={disabled}
            >
                <SelectTrigger className={className}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="border-gray-300/50">
                    {options.map((opt) => (
                        <SelectItem key={opt} value={String(opt)} disabled={opt < min}>
                            {opt}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormControl>
    );
}
