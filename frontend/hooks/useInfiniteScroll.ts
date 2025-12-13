import { useState, useCallback, useEffect, useRef } from 'react';
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
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    // Prevent concurrent calls
    if (loading || !hasMore || isLoadingRef.current) {
      console.log('loadMore blocked:', { loading, hasMore, isLoading: isLoadingRef.current });
      return;
    }

    console.log('loadMore called, fetching page:', page);
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(page, pageSize);

      setItems(prev => {
        // Filter out any duplicates based on id
        const existingIds = new Set(prev.map((item: any) => item.id));
        const newItems = response.items.filter((item: any) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
      setHasMore(response.has_more);
      setPage(prev => prev + 1);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'));
      console.error('Failed to load more:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
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
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
  }, [initialPage]);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter((item: any) => item.id !== itemId));
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<T>) => {
    setItems(prev => prev.map((item: any) =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  // Load initial data only once on mount or after reset
  useEffect(() => {
    if (initialLoad && items.length === 0 && !loading && !hasLoadedRef.current) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoad, items.length]);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    removeItem,
    updateItem,
    isInitialLoad: initialLoad && loading,
  };
}
