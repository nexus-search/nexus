"use client";
import { useEffect, useRef, useState, useMemo } from 'react';
import type { MediaItemResponse } from '@/lib/types/api';
import PinCard from './PinCard';

interface MasonryGridProps {
  items: MediaItemResponse[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onItemClick: (item: MediaItemResponse) => void;
  onSaveClick?: (item: MediaItemResponse) => void;
  onRemoveClick?: (item: MediaItemResponse) => void;
  onDeleteClick?: (item: MediaItemResponse) => void;
  onEditClick?: (item: MediaItemResponse) => void;
}

export default function MasonryGrid({
  items,
  onLoadMore,
  hasMore,
  loading,
  onItemClick,
  onSaveClick,
  onRemoveClick,
  onDeleteClick,
  onEditClick,
}: MasonryGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(5);

  // Detect screen size and set column count
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(2);
      else if (width < 768) setColumnCount(3);
      else if (width < 1024) setColumnCount(4);
      else if (width < 1280) setColumnCount(5);
      else if (width < 1536) setColumnCount(6);
      else setColumnCount(7);
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // Distribute items across columns
  const columns = useMemo(() => {
    const cols: MediaItemResponse[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, idx) => {
      cols[idx % columnCount].push(item);
    });
    return cols;
  }, [items, columnCount]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '400px',
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
        <svg className="w-20 h-20 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2 text-gray-700">No pins yet</h3>
        <p className="text-sm text-gray-500">Upload some media to get started!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Pinterest-style Masonry Layout with column distribution */}
      <div className="flex gap-3 sm:gap-4">
        {columns.map((column, columnIdx) => (
          <div key={columnIdx} className="flex-1 flex flex-col gap-3 sm:gap-4">
            {column.map((item) => (
              <PinCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onSaveClick={onSaveClick}
                onRemoveClick={onRemoveClick}
                onDeleteClick={onDeleteClick}
                onEditClick={onEditClick}
              />
            ))}

            {/* Loading Skeletons - distribute across columns */}
            {loading && columnIdx < 4 && (
              <div className="animate-pulse">
                <div className="bg-gray-100 rounded-2xl overflow-hidden" style={{ height: `${200 + (columnIdx % 3) * 80}px` }}>
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && !loading && <div ref={loadMoreRef} className="h-4" />}

      {/* End of Results */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">That's all for now!</span>
          </div>
        </div>
      )}
    </div>
  );
}
