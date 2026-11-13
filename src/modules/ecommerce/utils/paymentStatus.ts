export function isPaymentVerified(response: any): boolean {
  const status = String(response?.status ?? response?.payment_status ?? response?.paymentStatus ?? '').toLowerCase();
  // An HTTP success flag does not mean a pending/failed payment was captured.
  if (status) return ['paid', 'captured', 'success', 'verified'].includes(status);
  return response?.verified === true;
}
