"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import SaveToCollectionModal from '@/components/SaveToCollectionModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { mediaService } from '@/lib/services/media.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { MediaItemResponse } from '@/lib/types/api';

export default function Home() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItemResponse | null>(null);
  const [saveModalMedia, setSaveModalMedia] = useState<MediaItemResponse | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Fetch function for infinite scroll
  const fetchMedia = useCallback(async (page: number, pageSize: number) => {
    return await mediaService.listMedia({ page, pageSize });
  }, []);

  // Use infinite scroll hook
  const { items, loading, hasMore, loadMore, isInitialLoad, reset } = useInfiniteScroll(
    fetchMedia,
    { pageSize: 30 }
  );

  // Reset items when auth state changes (login/logout)
  // Use a ref to track previous auth state to avoid unnecessary resets
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    // Only reset if auth state actually changed (not on initial mount)
    if (prevAuthRef.current !== isAuthenticated) {
      console.log('Auth state changed, resetting feed');
      reset();
      prevAuthRef.current = isAuthenticated;
    }
  }, [isAuthenticated, reset]);

  const handleSaveClick = (item: MediaItemResponse) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setSaveModalMedia(item);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-24 px-2 sm:px-4 max-w-[1600px] mx-auto">
        {/* Initial Loading State */}
        {isInitialLoad ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {Array.from({ length: 20 }).map((_, idx) => {
              // Random heights for initial skeleton loading
              const heights = ['250px', '320px', '280px', '350px', '300px', '270px', '310px', '290px', '330px', '260px'];
              const randomHeight = heights[idx % heights.length];

              return (
                <div key={idx} className="break-inside-avoid mb-4">
                  <div
                    className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse"
                    style={{ height: randomHeight }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
                  </div>
                </div>
              );
            })}
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

      {/* Save to Collection Modal */}
      {saveModalMedia && (
        <SaveToCollectionModal
          mediaId={saveModalMedia.id}
          mediaTitle={saveModalMedia.title || saveModalMedia.filename}
          onClose={() => setSaveModalMedia(null)}
          onSaved={() => {
            // Optional: Show success message
            console.log('Saved successfully');
          }}
        />
      )}
    </div>
  );
}
