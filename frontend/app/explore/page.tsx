"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);

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

      // Calculate new total before updating state
      const currentItemsCount = items.length;
      const newTotalItems = currentItemsCount + res.items.length;

      // Append new items to existing ones
      setItems(prev => [...prev, ...res.items]);

      // Update total count
      if (res.total !== undefined) setTotal(res.total);

      // Use backend's has_more flag - it knows best!
      setHasMore(res.has_more);
      setPage(pageNum + 1);

      console.log(`Text search - Page ${pageNum}: Loaded ${res.items.length} items. Total loaded: ${newTotalItems}/${res.total}. Has more: ${res.has_more}`);
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
          <>
            {/* Search Query Header */}
            <div className="mb-8">
              {items.length === 0 && loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-6 w-6 border-3 border-[#e60023] border-t-transparent rounded-full"></div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Searching for <span className="text-[#e60023]">"{query}"</span>
                  </h1>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Results for <span className="text-[#e60023]">"{query}"</span>
                  </h1>
                  {total > 0 && (
                    <p className="text-gray-600">
                      Found {total.toLocaleString()} {total === 1 ? 'result' : 'results'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Initial loading skeleton */}
            {items.length === 0 && loading && (
              <div className="w-full">
                <div className="flex gap-3 sm:gap-4">
                  {Array.from({ length: 5 }).map((_, colIdx) => (
                    <div key={colIdx} className="flex-1 flex flex-col gap-3 sm:gap-4">
                      {Array.from({ length: 3 }).map((_, rowIdx) => (
                        <div key={rowIdx} className="animate-pulse">
                          <div
                            className="bg-gray-100 rounded-2xl overflow-hidden"
                            style={{ height: `${200 + ((colIdx + rowIdx) % 3) * 80}px` }}
                          >
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {(items.length > 0 || !loading) && (
              <MasonryGrid
                items={items}
                onLoadMore={() => fetchPage(page)}
                hasMore={hasMore}
                loading={loading}
                onItemClick={(item) => {
                  const idx = items.findIndex(i => i.id === item.id);
                  setSelectedItemIndex(idx);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* MediaViewer Modal */}
      {selectedItemIndex >= 0 && items[selectedItemIndex] && (
        <MediaViewer
          mediaUrl={items[selectedItemIndex].mediaUrl || items[selectedItemIndex].thumbnailUrl || ''}
          mediaType={items[selectedItemIndex].mediaType}
          onClose={() => setSelectedItemIndex(-1)}
          items={items}
          currentIndex={selectedItemIndex}
          onNavigate={(idx) => setSelectedItemIndex(idx)}
        />
      )}
    </div>
  );
}
