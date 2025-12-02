import { parseISO } from "date-fns";

/**
 * Serialize a Date to an ISO string for use in URL/search params.
 * Returns undefined if date is null/undefined.
 */
export const serializeDateParam = (date?: Date | null): string | undefined =>
    date ? date.toISOString() : undefined;

/**
 * Safely parse an ISO date string from URL/search params.
 * Returns undefined if the value is empty or invalid.
 */
export const parseDateParam = (value?: string | null): Date | undefined => {
    if (!value) return undefined;

    try {
        const d = parseISO(value); // stricter than new Date()
        return isNaN(d.getTime()) ? undefined : d;
    } catch {
        return undefined;
    }
};
