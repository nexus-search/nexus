"use client";
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import { useAuth } from '@/contexts/AuthContext';
import { collectionService } from '@/lib/services/collection.service';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { CollectionResponse, MediaItemResponse } from '@/lib/types/api';
import Link from 'next/link';

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = use(params);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(true);

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

  // Fetch function for infinite scroll
  const fetchMedia = useCallback(async (page: number, pageSize: number) => {
    return await collectionService.getMedia(id, { page, pageSize });
  }, [id]);

  // Use infinite scroll hook
  const { items, loading, hasMore, loadMore, isInitialLoad } = useInfiniteScroll(
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
            ) : items.length > 0 ? (
              <MasonryGrid
                items={items}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                onItemClick={(item) => router.push(`/pin/${item.id}`)}
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
    </div>
  );
}
