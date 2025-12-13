'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import EditMediaModal from '@/components/EditMediaModal';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { mediaService } from '@/lib/services/media.service';
import { collectionService } from '@/lib/services/collection.service';
import type { MediaItemResponse, CollectionResponse } from '@/lib/types/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [totalPins, setTotalPins] = useState(0);
  const [editingMedia, setEditingMedia] = useState<MediaItemResponse | null>(null);

  // Fetch user's created media
  const fetchUserMedia = useCallback(async (page: number, pageSize: number) => {
    const result = await mediaService.getUserMedia({ page, pageSize });
    // Update total count from first page
    if (page === 1 && result.total !== undefined) {
      setTotalPins(result.total);
    }
    return result;
  }, []);

  const { items, loading, hasMore, loadMore, isInitialLoad, removeItem, updateItem } = useInfiniteScroll(
    fetchUserMedia,
    { pageSize: 30 }
  );

  const handleDeleteMedia = async (media: MediaItemResponse) => {
    // Optimistic update
    removeItem(media.id);
    setTotalPins(prev => Math.max(0, prev - 1));

    const toastId = toast.loading('Deleting pin...');

    try {
      await mediaService.deleteMedia(media.id);
      toast.success('Pin deleted', { id: toastId });
    } catch (err) {
      console.error('Failed to delete media:', err);
      toast.error('Failed to delete pin', { id: toastId });
      // Reload on failure
      window.location.reload();
    }
  };

  // Fetch collections on mount
  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const response = await collectionService.getAll();
      setCollections(response || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  // Load collections on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    }
  }, [isAuthenticated, fetchCollections]);

  // Load collections when switching to saved tab
  const handleTabChange = (tab: 'created' | 'saved') => {
    setActiveTab(tab);
    if (tab === 'saved' && collections.length === 0) {
      fetchCollections();
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#e60023]"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-12">
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex flex-col items-center text-center mb-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-gray-200">
              <img
                src="/profile.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{user?.username}</h1>
            <p className="text-gray-600">{user?.email}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{totalPins}</p>
                <p className="text-sm text-gray-600">Pins</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{collections.length}</p>
                <p className="text-sm text-gray-600">Boards</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center border-b border-gray-200">
            <button
              onClick={() => handleTabChange('created')}
              className={`px-6 py-4 font-semibold transition-colors relative ${
                activeTab === 'created'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Created
              {activeTab === 'created' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => handleTabChange('saved')}
              className={`px-6 py-4 font-semibold transition-colors relative ${
                activeTab === 'saved'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4">
          {activeTab === 'created' ? (
            /* Created Pins */
            <>
              {isInitialLoad ? (
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const heights = ['250px', '320px', '280px', '350px'];
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
              ) : items.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nothing to show...yet!</h3>
                  <p className="text-gray-600 mb-8">Pins you create will live here.</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-6 py-3 bg-[#e60023] hover:bg-[#ad081b] text-white font-semibold rounded-full transition-colors"
                  >
                    Create Pin
                  </button>
                </div>
              ) : (
                <MasonryGrid
                  items={items}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  loading={loading}
                  onItemClick={(item) => {
                    const idx = items.findIndex(i => i.id === item.id);
                    setSelectedMediaIndex(idx);
                  }}
                  onDeleteClick={handleDeleteMedia}
                  onEditClick={setEditingMedia}
                />
              )}
            </>
          ) : (
            /* Saved Boards */
            <>
              {collectionsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nothing to show...yet!</h3>
                  <p className="text-gray-600 mb-8">Save Pins to boards to view them here.</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-[#e60023] hover:bg-[#ad081b] text-white font-semibold rounded-full transition-colors"
                  >
                    Explore Pins
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => router.push(`/collections/${collection.id}`)}
                      className="group text-left"
                    >
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 relative hover:opacity-90 transition-opacity mb-2">
                        {collection.coverImageUrl ? (
                          <img
                            src={collection.coverImageUrl}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{collection.name}</h3>
                      <p className="text-sm text-gray-500">{collection.mediaCount} pins</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Media Viewer Modal */}
      {selectedMediaIndex >= 0 && items[selectedMediaIndex] && (
        <MediaViewer
          mediaUrl={items[selectedMediaIndex].mediaUrl || items[selectedMediaIndex].thumbnailUrl || ''}
          mediaType={items[selectedMediaIndex].mediaType}
          onClose={() => setSelectedMediaIndex(-1)}
          items={items}
          currentIndex={selectedMediaIndex}
          onNavigate={(idx) => setSelectedMediaIndex(idx)}
        />
      )}

      {/* Edit Media Modal */}
      {editingMedia && (
        <EditMediaModal
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onUpdated={(updated) => {
            updateItem(updated.id, updated);
            setEditingMedia(null);
          }}
        />
      )}
    </div>
  );
}
