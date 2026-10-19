// Format displayed rupee amounts without exposing floating-point arithmetic tails.
// Keep payment calculations numeric; use this only when rendering amounts.
export const formatMoney = (amount: number | string | null | undefined): string => {
  const value = Number(amount ?? 0);
  return `₹${(Number.isFinite(value) ? Math.max(0, value) : 0).toFixed(2)}`;
};
