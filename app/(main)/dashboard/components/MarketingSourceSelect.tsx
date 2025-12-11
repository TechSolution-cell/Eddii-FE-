"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useMarketingSources } from "@/features/marketing-sources/api";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { TruncText } from "@/components/TruncText";

import type { MarketingSource, Paginated } from "@/types";
import type { UseQueryResult } from "@tanstack/react-query";

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const noneOption: MarketingSource = {
    id: "#",
    name: "No marketing source",
    description: "Do not attribute this to a marketing source",
};

type Props = {
    values: string[];
    onChange: (vals: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    pageSize?: number;
    includeNoneOption?: boolean;
};

export function MarketingSourceSelect({
    values,
    onChange,
    disabled,
    placeholder = "Filter by marketing sources",
    pageSize = 25,
    includeNoneOption = true,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debounced = useDebouncedValue(search, 250);

    const [page, setPage] = useState(1);
    const [items, setItems] = useState<MarketingSource[]>(
        includeNoneOption ? [noneOption] : [],
    );
    const [total, setTotal] = useState<number | null>(null);

    const {
        data,
        isFetching,
        isError,
    }: {
        data: Paginated<MarketingSource> | undefined;
        isFetching: boolean;
        isError: boolean;
        refetch?: UseQueryResult<Paginated<MarketingSource>, Error>["refetch"];
    } = useMarketingSources({ page, limit: pageSize, name: debounced });

    // Reset pagination when search changes
    useEffect(() => {
        setPage(1);
        setItems(includeNoneOption ? [noneOption] : []);
        setTotal(null);
    }, [debounced, includeNoneOption]);

    // Append new page when data changes
    useEffect(() => {
        if (!data) return;

        setItems((prev) => {
            const incoming = data.items ?? [];
            const isFirstPage = (data.meta.page ?? page) === 1;

            if (isFirstPage) {
                return includeNoneOption ? [noneOption, ...incoming] : [...incoming];
            }

            const byId = new Map<string, MarketingSource>();
            for (const it of prev) byId.set(String(it.id), it);
            for (const it of incoming) byId.set(String(it.id), it);
            return Array.from(byId.values());
        });

        setTotal(data.meta.total);
    }, [data, page, includeNoneOption]);

    const selectedSet = useMemo(
        () => new Set((values ?? []).map(String)),
        [values],
    );

    const baseCount = includeNoneOption ? items.length - 1 : items.length;
    const canLoadMore = total == null ? true : baseCount < total;

    // Label for trigger button
    const selectedLabel = useMemo(() => {
        if (!values || values.length === 0) return placeholder;

        if (values.length === 1) {
            const single = items.find((i) => String(i.id) === values[0]);
            return single?.name ?? "1 source selected";
        }

        return `${values.length} sources selected`;
    }, [values, items, placeholder]);

    // Infinite scroll
    const listRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current;

        const onScroll = () => {
            const nearBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
            if (nearBottom && !isFetching && canLoadMore) {
                setPage((p) => p + 1);
            }
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [open, isFetching, canLoadMore]);

    const toggleId = (id: string) => {
        const current = new Set(values ?? []);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        onChange(Array.from(current));
    };

    const handleClear = () => {
        onChange([]);
        setSearch("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between border-purple-200 focus:border-purple-500"
                >
                    <span
                        className={cn(
                            "truncate whitespace-nowrap w-full text-left",
                            values && values.length > 0
                                ? "text-gray-900"
                                : "text-gray-400",
                        )}
                    >
                        {selectedLabel}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className={cn(
                    "border-purple-200/50 p-0",
                    "w-[var(--radix-popover-trigger-width)]",
                    "max-h-[var(--radix-popover-content-available-height)] overflow-auto",
                )}
                align="start"
            >
                <Command shouldFilter={false}>
                    <div className="flex items-center px-2 py-2 gap-2 w-full">
                        <CommandInput
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search marketing sources…"
                            className="placeholder:text-purple-700/70 w-full"
                        />
                        {values && values.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs whitespace-nowrap text-purple-600"
                                onClick={handleClear}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    <CommandList ref={listRef} className="max-h-64 overflow-y-auto">
                        {isError && <CommandEmpty>Failed to load sources.</CommandEmpty>}
                        {!isFetching && items.length === 0 && (
                            <CommandEmpty>No results.</CommandEmpty>
                        )}

                        <CommandGroup
                            heading={
                                debounced ? `Results for “${debounced}”` : "All sources"
                            }
                        >
                            {items.map((ms) => {
                                const id = String(ms.id);
                                const selected = selectedSet.has(id);

                                return (
                                    <CommandItem
                                        key={id}
                                        value={id}
                                        // row click toggles selection
                                        onSelect={() => toggleId(id)}
                                        aria-selected={selected}
                                        className="cursor-pointer aria-selected:bg-purple-50 border-b border-purple-100"
                                    >
                                        <Checkbox
                                            checked={selected}
                                            onCheckedChange={() => toggleId(id)} // checkbox click also toggles
                                            className="cursor-pointer mr-2 h-4 w-4 rounded-[2px] border-purple-400 data-[state=checked]:bg-purple-600"
                                        />
                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <TruncText
                                                value={ms.name}
                                                lines={1}
                                                className="text-purple-600 font-medium"
                                            />
                                            {ms.description && (
                                                <TruncText
                                                    value={ms.description}
                                                    lines={1}
                                                    className="text-xs text-muted-foreground"
                                                />
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>

                        {canLoadMore && (
                            <div className="flex items-center justify-center py-2">
                                {isFetching ? (
                                    <span className="inline-flex items-center gap-2 text-sm text-purple-700/80">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-purple-700/90 hover:bg-purple-50"
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Load more
                                    </Button>
                                )}
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
