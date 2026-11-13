export const isPositiveAmount = (value: unknown): boolean => {
  const text = String(value ?? '').trim();
  return /^\d+(?:\.\d{1,2})?$/.test(text) && Number.isFinite(Number(text)) && Number(text) > 0;
};

export const isValidCheckoutOrder = (order: any): boolean =>
  Boolean(order?.key && order?.orderId && order?.transaction_id) &&
  isPositiveAmount(order?.amount) && Number.isSafeInteger(Number(order.amount));

export const canRetryRequest = (method?: string): boolean =>
  ['get', 'head', 'options'].includes((method || 'get').toLowerCase());
