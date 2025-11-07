"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import MediaViewer from '@/components/MediaViewer';
import { useState, useEffect } from 'react';
import { getCollection, addMediaToCollection, removeMediaFromCollection, searchByText } from '@/lib/api';
import { Collection, MediaItem } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    loadCollection();
  }, [isAuthenticated, id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const res = await getCollection(id);
      const normalized = {
        ...res,
        id: res.id || res.collectionId || id,
      };
      setCollection(normalized);
      const searchRes = await searchByText('', `collection:${id}`, 1, 100);
      setItems(searchRes.items);
    } catch (error: any) {
      console.error('Failed to load collection:', error);
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        router.push('/collections');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchByText(query, 'my_images', 1, 20);
      setSearchResults(res.items);
    } catch (error: any) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMedia = async (mediaId: string) => {
    try {
      await addMediaToCollection(id, [mediaId]);
      await loadCollection();
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Failed to add media:', error);
      alert('Failed to add media: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    if (!confirm('Remove this media from the collection?')) return;
    try {
      await removeMediaFromCollection(id, mediaId);
      setItems(prev => prev.filter(item => item.id !== mediaId));
    } catch (error: any) {
      console.error('Failed to remove media:', error);
      alert('Failed to remove media: ' + (error.message || 'Unknown error'));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        </div>
        <Header />
        <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="text-gray-400 font-medium">Loading collection...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="relative bg-gray-950 min-h-screen flex flex-col">
        <Header />
        <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-3xl font-bold text-white mb-4">Collection not found</h2>
            <p className="text-gray-400 mb-8">This collection may have been deleted or you don't have access to it.</p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Collections
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className={`mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Collections
          </Link>
        </div>

        {/* Collection Header */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
                    {collection.name}
                  </h1>
                </div>
                
                {collection.description && (
                  <p className="text-gray-400 mb-4 leading-relaxed">{collection.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300 font-medium">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  
                  {collection.isPublic ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Public Collection
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private Collection
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Media
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {items.length > 0 ? (
            <MediaGrid items={items} onItemClick={setActive} />
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Empty Collection</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                This collection doesn't have any media yet. Start adding media to organize your files.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Media to Collection
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full border border-gray-800 shadow-2xl max-h-[85vh] flex flex-col animate-scaleIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Add Media to Collection
              </h2>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-800">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="Search your media library..."
                  autoFocus
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-400">Searching your library...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {searchResults.map((item) => {
                    const isInCollection = items.some(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="relative group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all"
                      >
                        <div className="aspect-video bg-gray-900 relative overflow-hidden">
                          {item.mediaType === 'image' ? (
                            <img
                              src={item.mediaUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                              <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gray-400 truncate mb-2">{item.filename}</p>
                          {isInCollection ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              In collection
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddMedia(item.id)}
                              className="w-full px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">No media found matching "<span className="text-white">{searchQuery}</span>"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400">Start typing to search your media library</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-800/50 border-t border-gray-800">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full px-4 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {active && (
        <MediaViewer
          mediaUrl={active.mediaUrl}
          mediaType={active.mediaType}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}