"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import { useAuth } from '@/contexts/AuthContext';
import { searchService } from '@/lib/services/search.service';
import type { MediaItemResponse } from '@/lib/types/api';

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const query = useMemo(() => (searchParams?.get('q') || '').trim(), [searchParams]);
  const pageSize = 20;

  const [items, setItems] = useState<MediaItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Require authentication for search endpoints
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Reset when query changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setHasMore(true);
  }, [query]);

  const fetchPage = async (pageNum: number) => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await searchService.searchByText({
        query,
        scope: 'public',
        page: pageNum,
        pageSize,
      });
      setItems(prev => [...prev, ...res.items]);
      if (res.total) setTotal(res.total);
      const nextCount = items.length + res.items.length;
      setHasMore(res.total ? nextCount < res.total : res.items.length === pageSize);
      setPage(pageNum + 1);
    } catch (e) {
      console.error('Search failed', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (query && items.length === 0 && !loading && hasMore && isAuthenticated) {
      fetchPage(1);
    }
  }, [query, items.length, loading, hasMore, isAuthenticated]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 pt-24">
        {!query && (
          <div className="text-center py-20 text-gray-500">
            <p>Type a query in the search bar to explore.</p>
          </div>
        )}

        {query && (
          <MasonryGrid
            items={items}
            onLoadMore={() => fetchPage(page)}
            hasMore={hasMore}
            loading={loading}
            onItemClick={(item) => router.push(`/pin/${item.id}`)}
          />
        )}
      </main>
    </div>
  );
}
