export function formatNumberFixed(
    value: number | null | undefined,
    fractionDigits = 2,
  ): string {
    const n = Number(value ?? 0);
    const hasFraction = !Number.isInteger(n);
  
    return n.toLocaleString(undefined, {
      minimumFractionDigits: hasFraction ? fractionDigits : 0,
      maximumFractionDigits: hasFraction ? fractionDigits : 0,
    });
  }