import { useEffect, useRef, useState } from 'react';
import { fetchSearchSuggestions, type SearchData } from '../api/GlobalSearchAPI';

const DEBOUNCE_MS  = 300;
const MIN_CHARS    = 2;

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request from the previous keystroke
    controllerRef.current?.abort();

    const trimmed = query.trim();

    if (trimmed.length < MIN_CHARS) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchSearchSuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const reset = () => {
    controllerRef.current?.abort();
    setResults(null);
    setLoading(false);
  };

  const hasProducts = (results?.products.length ?? 0) > 0;
  const hasServices = (results?.services.length ?? 0) > 0;
  const hasResults  = hasProducts || hasServices;
  const isEmpty     = !loading && results !== null && !hasResults;

  return { results, loading, hasResults, isEmpty, reset };
}
