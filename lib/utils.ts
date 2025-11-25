
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from "zod";


/* ------------------------------------------------------------------ */
/* UI: class name helper                                               */
/* ------------------------------------------------------------------ */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/* ------------------------------------------------------------------ */
/* Diff / payload builder                                              */
/* ------------------------------------------------------------------ */
export type DiffOptions<T> = {
  /** If true, only include fields marked dirty */
  requireDirty?: boolean;
  /** Map of dirty fields (e.g., RHF's formState.dirtyFields flattened) */
  dirty?: Partial<Record<keyof T, boolean>>;
  /** If true, drop keys whose value is undefined */
  stripUndefined?: boolean;
  /** Custom equality check (default: strict ===) */
  equals?: (a: unknown, b: unknown) => boolean;
};

/**
 * Build a partial update payload containing only fields that actually changed.
 * - Shallow compare against `original`
 * - Optionally require RHF dirty flags
 * - Optionally strip `undefined` keys
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildChangedPayload<T extends Record<string, any>>(
  current: Partial<T>,
  original: Partial<T> = {},
  opts: DiffOptions<T> = {}
): Partial<T> {
  const {
    requireDirty = false,
    dirty,
    stripUndefined = true,
    equals = (a, b) => a === b,
  } = opts;

  const out: Partial<T> = {};

  for (const key of Object.keys(current) as (keyof T)[]) {
    const cur = current[key];
    const prev = original[key];

    if (stripUndefined && cur === undefined) continue;
    if (requireDirty && !(dirty?.[key])) continue;

    if (!equals(cur, prev)) {
      out[key] = cur as T[keyof T];
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Zod helpers for update forms                                        */
/* ------------------------------------------------------------------ */

/**
 * Normalizes empty-string ("") to undefined for update payloads.
 * - If value === "", returns undefined (treat as "no change")
 * - Otherwise, validates with the provided string schema
 *
 * @example
 * const UpdateSchema = z.object({
 *   nickname: textUpdateField(),                   // any string | undefined
 *   bio: textUpdateField(z.string().max(255)),     // capped length | undefined
 * });
 */

// Treat "" as undefined, keep proper output typing (string | undefined)
export const textUpdateField = (schema: z.ZodString = z.string()) =>
  z.preprocess(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any) => (typeof v === "string" && v === "" ? undefined : v),
    schema.optional()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any as z.ZodType<string | undefined>;


/**
 * Same as textUpdateField, but trims first.
 * Empty after trim => undefined.
 */
export const textUpdateFieldTrimmed = (schema: z.ZodString = z.string()) =>
  z.preprocess(v => {
    if (typeof v === "string") {
      const trimmed = v.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return v === "" ? undefined : v;
  }, schema.optional());



/**
* Formats a US/Canada phone number string.
* - Strips all non-digits.
* - If it starts with "1" and has ≥ 11 digits, formats as +1 (AAA) BBB-CCCC.
* - Else if it has ≥ 10 digits, formats as (AAA) BBB-CCCC.
* - Otherwise returns the cleaned digits (partial input passthrough).
*
* Examples:
*  fmtPhone("(555)123-4567")      -> "(555) 123-4567"
*  fmtPhone("+1 555 123 4567")    -> "+1 (555) 123-4567"
*  fmtPhone("555123")             -> "555123"
*/
export function fmtPhone(num: string): string {
  const digits = num.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("1") && digits.length >= 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return digits;
}
export const fmt = fmtPhone;

// map short language codes to nicer labels
export const formatLanguage = (lang?: string | null) => {
  if (!lang) return 'Unknown';

  const map: Record<string, string> = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
  };

  const normalized = lang.toLowerCase();
  return map[normalized] ?? lang.toUpperCase();
};
