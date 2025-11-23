"use client";

// ──  React & libs  ──────────────────────────────────────────────────────
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

// ──  App utilities / hooks / state  ────────────────────────────────────
import { cn } from "@/lib/utils";

import { useMarketingSources } from "@/features/marketing-sources/api";

// ──  UI (radix + icons)  ───────────────────────────────────────────────
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { TruncText } from '@/components/TruncText';

// ──  Types  ───────────────────────────────────────────────
import type { MarketingSource, Paginated } from "@/types";
import { type UseQueryResult } from '@tanstack/react-query';

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export function MarketingSourcePicker({
    value,
    onChange,
    disabled,
    placeholder = "Select marketing source",
    pageSize = 25,
}: {
    value?: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
    pageSize?: number;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debounced = useDebouncedValue(search, 250);

    const defaultOption: MarketingSource = {
        id: '#',
        name: "No marketing source",
        description: "Do not attribute this to a marketing source",
    };

    const [page, setPage] = useState(1);
    const [items, setItems] = useState<MarketingSource[]>([defaultOption]);
    const [total, setTotal] = useState<number | null>(null);

    const { data, isFetching, isError }: {
        data: Paginated<MarketingSource> | undefined,
        isFetching: boolean,
        isError: boolean,
        refetch?: UseQueryResult<Paginated<MarketingSource>, Error>['refetch'];
    } = useMarketingSources({ page, limit: pageSize, name: debounced });

    // Default (synthetic) option for "no marketing source"
    // const defaultOption: MarketingSource = useMemo(() => ({
    //     id: '#',
    //     name: "No marketing source",
    //     description: "Do not attribute this to a marketing source",
    // }), []);


    // Reset pagination when search changes or popover opens
    useEffect(() => {
        setPage(1);
        setItems([defaultOption]);
        setTotal(null);

    }, [debounced]);

    // Append new page when data changes
    useEffect(() => {
        if (!data) return;
        setItems((prev) => {
            const incoming = data.items ?? [];
            const isFirstPage = (data.meta.page ?? page) === 1;

            if (isFirstPage) return [defaultOption, ...incoming];

            // merge by id to avoid dupes
            const byId = new Map<string, MarketingSource>();
            for (const it of prev) byId.set(String(it.id), it);
            for (const it of incoming) byId.set(String(it.id), it);
            return Array.from(byId.values());
        });
        setTotal(data.meta.total);
    }, [data, page]);

    const selectedItem = useMemo(() => items.find((i) => String(i.id) === value), [items, value]);
    const canLoadMore = total == null ? true : (items.length - 1) < total;

    // Infinite scroll
    const listRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current;
        const onScroll = () => {
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
            if (nearBottom && !isFetching && canLoadMore) {
                setPage((p) => p + 1);
            }
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [open, isFetching, canLoadMore]);

    const handleClear = () => {
        onChange('');
        setSearch('');
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
                    <span className={cn("truncate whitespace-nowrap w-full text-left", selectedItem ? "text-gray-900" : "text-gray-400")}>
                        {selectedItem ? selectedItem.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className={`border-purple-200/50 p-0 w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] overflow-auto`}
                align="start"
            >
                <Command shouldFilter={false}>
                    <div className="flex items-center px-2 py-2 gap-2 w-full">
                        {/* <Search className="h-4 w-4 text-purple-700/80" /> */}
                        <CommandInput
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search marketing sources…"
                            className="placeholder:text-purple-700/70 w-full"
                        />
                        {selectedItem && (
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
                        {!isFetching && items.length === 0 && <CommandEmpty>No results.</CommandEmpty>}

                        <CommandGroup heading={debounced ? `Results for “${debounced}”` : "All sources"}>
                            {items.map((ms) => {
                                const id = String(ms.id);
                                const selected = value === id;
                                return (
                                    <CommandItem
                                        key={id}
                                        value={id}
                                        onSelect={() => {
                                            onChange(id);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer aria-selected:bg-purple-50 border-b border-purple-100"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <TruncText
                                                value={ms.name}
                                                lines={1}
                                                className="text-purple-600 font-medium"
                                            />
                                            {/* <span className="text-purple-900 font-medium">{ms.name}</span> */}
                                            {ms.description && (
                                                <TruncText
                                                    value={ms.description}
                                                    lines={1}
                                                    // preserveNewlines
                                                    className="text-xs text-muted-foreground"
                                                />
                                                // <span className="text-xs text-purple-700/80">{ms.description}</span>
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
