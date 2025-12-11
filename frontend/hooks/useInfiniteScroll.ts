import { useState, useCallback, useEffect } from 'react';
import type { PaginatedResponse } from '@/lib/types/api';

interface UseInfiniteScrollOptions {
  pageSize?: number;
  initialPage?: number;
}

export function useInfiniteScroll<T>(
  fetchFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  options: UseInfiniteScrollOptions = {}
) {
  const { pageSize = 20, initialPage = 1 } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(page, pageSize);

      setItems(prev => [...prev, ...response.items]);
      setHasMore(response.has_more);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'));
      console.error('Failed to load more:', err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [fetchFn, page, pageSize, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setLoading(false);
    setError(null);
    setInitialLoad(true);
  }, [initialPage]);

  // Load initial data
  useEffect(() => {
    if (initialLoad && items.length === 0) {
      loadMore();
    }
  }, [initialLoad, items.length, loadMore]);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    isInitialLoad: initialLoad && loading,
  };
}
