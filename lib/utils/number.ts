export function formatNumberFixed(
    value: number | null | undefined,
    fractionDigits = 2,
): string {
    const n = Number(value ?? 0);

    return n.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}