export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function validateLoanDocument(
  file:
    | { size?: number | null; type?: string | null; uri?: string }
    | undefined,
) {
  if (!file?.uri || !Number.isFinite(file.size) || file.size <= 0) {
    return 'We couldn’t read this file. Please choose another copy.';
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return 'This file is too large. Choose a file up to 10 MB.';
  }
  if (
    !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type || '')
  ) {
    return 'Choose a PDF, JPG or PNG file.';
  }
  return undefined;
}
