"use client";
import { useEffect, useRef } from 'react';
import type { MediaItemResponse } from '@/lib/types/api';
import PinCard from './PinCard';

interface MasonryGridProps {
  items: MediaItemResponse[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onItemClick: (item: MediaItemResponse) => void;
  onSaveClick?: (item: MediaItemResponse) => void;
}

export default function MasonryGrid({
  items,
  onLoadMore,
  hasMore,
  loading,
  onItemClick,
  onSaveClick,
}: MasonryGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '400px', // Start loading before reaching the bottom
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    }, options);

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [loading, hasMore, onLoadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-20 h-20 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No media found</h3>
        <p className="text-sm">Upload some media to get started!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Masonry Grid using CSS columns */}
      <div
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4"
        style={{ columnFill: 'balance' }}
      >
        {items.map((item) => (
          <div key={item.id} className="break-inside-avoid mb-4">
            <PinCard
              item={item}
              onClick={() => onItemClick(item)}
              onSaveClick={onSaveClick}
            />
          </div>
        ))}
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && !loading && <div ref={loadMoreRef} className="h-4" />}

      {/* End of Results */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">You've seen it all!</span>
          </div>
        </div>
      )}
    </div>
  );
}
