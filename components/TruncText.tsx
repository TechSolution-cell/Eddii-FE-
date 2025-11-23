
import { useEffect, useRef, useState, type DependencyList } from "react";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type TruncTextProps = {
    value?: string | null;
    lines?: 1 | 2 | 3;
    className?: string;
    preserveNewlines?: boolean; // for textarea-like content
    tooltipDelayMs?: number;
};

// @typescript-eslint/no-explicit-any
function useIsOverflowing<T extends HTMLElement>(depKeys: DependencyList = []) {
    const ref = useRef<T | null>(null);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const compute = () => {
            // If clamped or single-line ellipsis, overflow shows as scroll > client
            const widthOverflow = el.scrollWidth > el.clientWidth
            const heightOverflow = el.scrollHeight > el.clientHeight;


            setOverflowing(widthOverflow || heightOverflow);
        };

        // initial
        compute();

        // observe size changes
        const ro = new ResizeObserver(compute);
        ro.observe(el);

        // also re-check after fonts render
        const id = requestAnimationFrame(compute);

        return () => {
            ro.disconnect();
            cancelAnimationFrame(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, depKeys);

    return { ref, overflowing };
}


export function TruncText({
    value,
    lines = 1,
    className,
    preserveNewlines = false,
    tooltipDelayMs = 150,
}: TruncTextProps) {
    const text = (value ?? "").trim();
    const isEmpty = text.length === 0;

    // Detect overflow whenever text/lines change
    const { ref, overflowing } = useIsOverflowing<HTMLDivElement>([text, lines]);

    // Styles: clamp helpers
    // - single line: `truncate`
    // - multi-line: `line-clamp-N` (requires @tailwindcss/line-clamp)
    const clampClass =
        lines === 1
            ? 'truncate whitespace-nowrap'
            : lines === 2
                ? 'line-clamp-2'
                : 'line-clamp-3'; // only 1|2|3
    // const clampClass =
    //     lines === 1
    //         ? "truncate whitespace-nowrap"
    //         : `line-clamp-${lines}`;

    const base = (
        <div
            ref={ref}
            // aria-label={text} 
            className={cn(
                preserveNewlines ? "whitespace-pre-line" : "whitespace-normal",
                className,
                `min-w-0 overflow-hidden break-words ${clampClass}`
            )}
        >
            <span className="hidden line-clamp-3" />
            {isEmpty ? "──────" : text}
        </div>
    );

    return (
        <TooltipProvider>
            <Tooltip delayDuration={tooltipDelayMs} >
                <TooltipTrigger asChild>
                    {base}
                </TooltipTrigger>
                {(!isEmpty && overflowing) && (
                    <TooltipContent className="max-w-sm whitespace-pre-wrap break-words">
                        {text}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
