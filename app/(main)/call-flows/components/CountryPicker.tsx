"use client";

// ──  React & libs  ──────────────────────────────────────────────────────
import { useEffect, useState } from "react";

// ──  UI (radix + icons)  ───────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

const COUNTRIES: { iso2: string; name: string; dial: string }[] = [
    { iso2: "US", name: "United States", dial: "+1" },
    { iso2: "CA", name: "Canada", dial: "+1" },
    // { iso2: "MX", name: "Mexico", dial: "+52" },
    // { iso2: "GB", name: "United Kingdom", dial: "+44" },
    // { iso2: "AU", name: "Australia", dial: "+61" },
    // { iso2: "NZ", name: "New Zealand", dial: "+64" },
];

function flagEmoji(iso2: string) {
    return iso2
        .toUpperCase()
        .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function CountryPicker({
    value,
    onChange,
    defaultValue = "US",
    disabled,
    placeholder = "Select country",
    autoSelectOnMount = true,
}: {
    value?: string;
    onChange: (iso2: string) => void;
    defaultValue: string,
    disabled?: boolean;
    placeholder?: string;
    autoSelectOnMount?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Initialize with defaultValue once, if caller hasn't set a value yet
    useEffect(() => {
        if (!autoSelectOnMount) return;
        const current = (value ?? "").toUpperCase();
        const def = (defaultValue ?? "").toUpperCase();
        if (!current && def && COUNTRIES.some((c) => c.iso2 === def)) {
            onChange(def);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSelectOnMount, defaultValue]);

    const filtered = COUNTRIES.filter((c) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            c.name.toLowerCase().includes(q) ||
            c.iso2.toLowerCase().includes(q) ||
            c.dial.replace("+", "").startsWith(q.replace("+", ""))
        );
    });

    // If no controlled value yet, show defaultValue as the visual selection
    const selected = COUNTRIES.find(
        (c) => c.iso2 === (value || defaultValue)?.toUpperCase()
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="justify-between border-purple-200 focus:border-purple-500 flex-1 min-w-0"
                >
                    <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
                        {selected ? `${flagEmoji(selected.iso2)} ${selected.name}` : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] border-1 border-purple-200/50" align="start">
                <Command>
                    <div className="px-2 py-2">
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search countries…"
                            className="placeholder:text-purple-700/70"
                        />
                    </div>
                    <CommandList className="max-h-64 overflow-y-auto">
                        {filtered.length === 0 && <CommandEmpty>No results.</CommandEmpty>}
                        <CommandGroup heading={query ? `Results for “${query}”` : "All countries"}>
                            {filtered.map((c) => {
                                const isSelected = c.iso2 === selected?.iso2;
                                return (
                                    <CommandItem
                                        key={c.iso2}
                                        value={c.iso2}
                                        onSelect={() => {
                                            onChange(c.iso2);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer aria-selected:bg-purple-50 border-b border-purple-100"
                                    >
                                        <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="shrink-0">{flagEmoji(c.iso2)}</span>
                                            <span className="text-sm text-purple-900 font-medium truncate">{c.name}</span>
                                            <span className="text-xs text-purple-700/80 truncate">{c.dial}</span>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
