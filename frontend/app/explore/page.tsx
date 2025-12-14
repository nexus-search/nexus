"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import SaveToCollectionModal from '@/components/SaveToCollectionModal';
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
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [saveModalMedia, setSaveModalMedia] = useState<MediaItemResponse | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

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

  const fetchPage = async (pageNum: number, searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q && !hasInitialLoad) return; // Don't fetch if no query and not initial load
    
    setLoading(true);
    try {
      const res = await searchService.searchByText({
        query: q || 'animals', // Default to 'animals' for initial load
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

  // Initial load of default animals
  useEffect(() => {
    if (isAuthenticated && !hasInitialLoad && !query) {
      setHasInitialLoad(true);
      fetchPage(1, 'animals');
    }
  }, [isAuthenticated, hasInitialLoad, query, fetchPage]);

  // Load when query changes
  useEffect(() => {
    if (query && items.length === 0 && isAuthenticated) {
      fetchPage(1);
    }
  }, [query, items.length, isAuthenticated, fetchPage]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 pt-24">
        {/* Always show category chips */}
        <div className="py-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Explore popular animals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {['cats','dogs','birds','lions','tigers','elephants','wolves','foxes','bears','zebras','sea','rabbits'].map((label) => (
              <button
                key={label}
                onClick={() => router.push(`/explore?q=${encodeURIComponent(label)}`)}
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                  query === label 
                    ? 'bg-[#e60023] text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Query Header */}
        {query && (
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
        )}

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
            onSaveClick={setSaveModalMedia}
          />
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

      {/* Save to Collection Modal */}
      {saveModalMedia && (
        <SaveToCollectionModal
          mediaId={saveModalMedia.id}
          onClose={() => setSaveModalMedia(null)}
          onSaved={() => setSaveModalMedia(null)}
        />
      )}
    </div>
  );
}
