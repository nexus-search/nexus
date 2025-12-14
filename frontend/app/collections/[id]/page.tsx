"use client";
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import { useAuth } from '@/contexts/AuthContext';
import { collectionService } from '@/lib/services/collection.service';
import { searchService } from '@/lib/services/search.service';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { CollectionResponse, MediaItemResponse } from '@/lib/types/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = use(params);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<MediaItemResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCollection();
    }
  }, [isAuthenticated, id]);

  const loadCollection = async () => {
    try {
      setLoadingCollection(true);
      const data = await collectionService.getById(id);
      setCollection(data);
    } catch (err) {
      console.error('Failed to load collection:', err);
    } finally {
      setLoadingCollection(false);
    }
  };

  const handleRemoveMedia = async (media: MediaItemResponse) => {
    // Optimistic update - remove from UI immediately
    removeItem(media.id);

    // Also remove from search results if in search mode
    if (searchMode) {
      setSearchResults(prev => prev.filter(item => item.id !== media.id));
    }

    // Update collection count
    if (collection) {
      setCollection({
        ...collection,
        mediaCount: Math.max(0, collection.mediaCount - 1)
      });
    }

    // Show loading toast
    const toastId = toast.loading('Removing pin...');

    try {
      await collectionService.removeMedia(id, media.id);
      toast.success('Pin removed from board', { id: toastId });

      // Refresh collection to get accurate count
      loadCollection();
    } catch (err) {
      console.error('Failed to remove media:', err);
      toast.error('Failed to remove pin', { id: toastId });

      // Reload to restore the item if removal failed
      loadCollection();
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const toastId = toast.loading('Searching...');

    try {
      const results = await searchService.searchByText({
        query: query.trim(),
        scope: 'library', // Search user's library within collection
        collectionId: id,
        page: 1,
        pageSize: 100,
      });

      setSearchResults(results.items);
      setSearchMode(true);
      toast.success(`Found ${results.items.length} result${results.items.length === 1 ? '' : 's'}`, { id: toastId });
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Search failed', { id: toastId });
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Fetch function for infinite scroll
  const fetchMedia = useCallback(async (page: number, pageSize: number) => {
    return await collectionService.getMedia(id, { page, pageSize });
  }, [id]);

  // Use infinite scroll hook
  const { items, loading, hasMore, loadMore, isInitialLoad, removeItem } = useInfiniteScroll(
    fetchMedia,
    { pageSize: 30 }
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-4 pt-24 pb-12">
        {loadingCollection ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#e60023] rounded-full animate-spin mx-auto" />
          </div>
        ) : collection ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <Link href="/collections" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
                ← Back to boards
              </Link>
              <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-600 text-lg">{collection.description}</p>
              )}
              <p className="text-gray-500 mt-2">{collection.mediaCount} pins</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    } else if (e.key === 'Escape') {
                      clearSearch();
                    }
                  }}
                  placeholder="Search in this board..."
                  className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
                  disabled={searchLoading}
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {(searchMode || searchQuery) && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-3 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchMode && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
                </p>
              )}
            </div>

            {/* Masonry Grid */}
            {isInitialLoad ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const heights = ['250px', '320px', '280px', '350px', '300px'];
                  return (
                    <div key={idx} className="break-inside-avoid mb-4">
                      <div
                        className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse"
                        style={{ height: heights[idx % heights.length] }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (searchMode ? searchResults.length > 0 : items.length > 0) ? (
              <MasonryGrid
                items={searchMode ? searchResults : items}
                onLoadMore={searchMode ? () => {} : loadMore}
                hasMore={searchMode ? false : hasMore}
                loading={searchMode ? false : loading}
                onItemClick={(item) => {
                  const displayItems = searchMode ? searchResults : items;
                  const idx = displayItems.findIndex(i => i.id === item.id);
                  setSelectedMediaIndex(idx);
                }}
                onRemoveClick={handleRemoveMedia}
              />
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nothing here yet</h3>
                <p className="text-gray-600 mb-6">Start saving pins to this board</p>
                <Link
                  href="/"
                  className="px-6 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] transition-colors inline-block"
                >
                  Explore pins
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">Board not found</h2>
            <Link href="/collections" className="text-[#e60023] hover:underline">
              Back to boards
            </Link>
          </div>
        )}
      </main>

      {/* Media Viewer Modal */}
      {selectedMediaIndex >= 0 && (searchMode ? searchResults : items)[selectedMediaIndex] && (
        <MediaViewer
          mediaUrl={(searchMode ? searchResults : items)[selectedMediaIndex].mediaUrl || (searchMode ? searchResults : items)[selectedMediaIndex].thumbnailUrl || ''}
          mediaType={(searchMode ? searchResults : items)[selectedMediaIndex].mediaType}
          onClose={() => setSelectedMediaIndex(-1)}
          items={searchMode ? searchResults : items}
          currentIndex={selectedMediaIndex}
          onNavigate={(idx) => setSelectedMediaIndex(idx)}
        />
      )}
    </div>
  );
}
