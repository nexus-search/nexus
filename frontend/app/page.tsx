"use client";
import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { mediaService } from '@/lib/services/media.service';
import type { MediaItemResponse } from '@/lib/types/api';

export default function Home() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItemResponse | null>(null);

  // Fetch function for infinite scroll
  const fetchMedia = useCallback(async (page: number, pageSize: number) => {
    return await mediaService.listMedia({ page, pageSize, visibility: 'public' });
  }, []);

  // Use infinite scroll hook
  const { items, loading, hasMore, loadMore, isInitialLoad } = useInfiniteScroll(
    fetchMedia,
    { pageSize: 20 }
  );

  const handleSaveClick = (item: MediaItemResponse) => {
    // TODO: Implement save to collection modal
    console.log('Save clicked:', item.id);
    // For now, just alert
    alert(`Save feature coming soon! Media: ${item.title || item.id}`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Discover
          </h1>
          <p className="text-gray-400">
            Explore {items.length > 0 && `${items.length}+ `}amazing visual content
          </p>
        </div>

        {/* Initial Loading State */}
        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-gray-400 animate-pulse">Loading amazing content...</p>
          </div>
        ) : (
          /* Masonry Grid with Infinite Scroll */
          <MasonryGrid
            items={items}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            onItemClick={setSelectedMedia}
            onSaveClick={handleSaveClick}
          />
        )}
      </main>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewer
          mediaUrl={selectedMedia.mediaUrl}
          mediaType={selectedMedia.mediaType}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}
