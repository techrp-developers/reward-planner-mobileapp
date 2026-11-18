import React, { useState } from 'react';
import { sharePreviewDocument } from '../services/loanPreviewDocuments';
import { Button, Copy } from './LoanUI';

export function PreviewDownloadButton({
  title,
  rows,
  label,
}: {
  title: string;
  rows: [string, string][];
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <Button
        secondary
        disabled={busy}
        label={
          busy
            ? 'Preparing PDF…'
            : label || `Save sample ${title.toLowerCase()}`
        }
        onPress={async () => {
          setBusy(true);
          setError('');
          try {
            await sharePreviewDocument(title, rows);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'Could not prepare PDF. Please try again.',
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      {error ? <Copy error>{error}</Copy> : null}
    </>
  );
}
