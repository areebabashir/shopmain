/** Pakistani Rupee — all storefront amounts use PKR. */

const intlPkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const intlPkrDecimals = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPkr(amount: number, decimals = false): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return intlPkr.format(0);
  return decimals ? intlPkrDecimals.format(n) : intlPkr.format(Math.round(n));
}

/** Strip currency symbols / commas for CSV or parsing */
export function stripMoneyToNumber(s: string): string {
  return s.replace(/Rs\.?|PKR|,|\s/gi, "").trim();
}
