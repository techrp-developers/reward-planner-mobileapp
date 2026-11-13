import { useCallback, useEffect, useState } from 'react';
export function useOtpTimer(initialSeconds: number, initialDeadline?: number) {
  const [deadline, setDeadline] = useState(() => initialDeadline ?? Date.now() + initialSeconds * 1000);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const reset = useCallback((seconds: number = initialSeconds) => { const current = Date.now(); setNow(current); setDeadline(current + seconds * 1000); }, [initialSeconds]);
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return { secondsLeft, canResend: secondsLeft === 0, reset };
}
