"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "./api";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

// Small GET-and-cache hook. Pass `null` as url to skip fetching.
// Re-fetches whenever the url changes; `refetch` lets pages reload on demand.
export function useFetch<T>(url: string | null): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      setData(res.data);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let active = true;
    // Defer past a microtask so the request's state updates don't run
    // synchronously inside the effect body.
    void (async () => {
      await Promise.resolve();
      if (active) await refetch();
    })();
    return () => {
      active = false;
    };
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
