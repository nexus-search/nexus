"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import MediaViewer from '@/components/MediaViewer';
import { useState, useEffect, useRef } from 'react';
import { getUserMedia, deleteMedia } from '@/lib/api';
import { MediaItem } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LibraryPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const pageSize = 20;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMedia(1);
  }, [isAuthenticated]);

  const loadMedia = async (pageNum: number = 1) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    try {
      const res = await getUserMedia(pageNum, pageSize);
      if (pageNum === 1) {
        setItems(res.items);
        setPage(1);
      } else {
        setItems(prev => [...prev, ...res.items]);
      }
      setTotal(res.total || 0);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (isFetchingMore) return;
      const canLoadMore = items.length < total;
      if (!canLoadMore) return;
      setIsFetchingMore(true);
      try {
        await loadMedia(page + 1);
      } finally {
        setIsFetchingMore(false);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length, total, page, isFetchingMore]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    try {
      await deleteMedia(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
    } catch (error: any) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media: ' + (error.message || 'Unknown error'));
    }
  };

  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    return item.mediaType === filter;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  My Library
                </h1>
                <p className="text-gray-400 text-sm mt-1">Manage your uploaded media files</p>
              </div>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Media
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{total}</p>
                  <p className="text-xs text-gray-400">Total Files</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{items.filter(i => i.mediaType === 'image').length}</p>
                  <p className="text-xs text-gray-400">Images</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{items.filter(i => i.mediaType === 'video').length}</p>
                  <p className="text-xs text-gray-400">Videos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm font-medium">Filter:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All', icon: '🎨' },
                  { value: 'image', label: 'Images', icon: '🖼️' },
                  { value: 'video', label: 'Videos', icon: '🎬' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === option.value
                        ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-white border border-cyan-500/50'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700'
                    }`}
                  >
                    <span className="mr-1.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Showing <span className="text-cyan-400 font-semibold">{filtered.length}</span> of <span className="text-white font-semibold">{total}</span> items
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl h-64 overflow-hidden border border-white/5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <MediaGrid items={filtered} onItemClick={setActive} />
              <div ref={sentinelRef} className="h-10" />
              
              {/* Loading More Indicator */}
              {isFetchingMore && (
                <div className="flex flex-col items-center justify-center py-16 animate-fadeInUp">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-indigo-500 border-l-cyan-500 animate-spin animation-delay-1000" style={{ animationDirection: 'reverse' }}></div>
                  </div>
                  <p className="text-gray-400 text-sm mt-6 font-medium">Loading more...</p>
                </div>
              )}

              {/* End of Results */}
              {!isFetchingMore && items.length >= total && items.length > 0 && (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">All media loaded</p>
                      <p className="text-gray-500 text-sm">You've reached the end of your library</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {filter !== 'all' ? `No ${filter}s found` : 'Your library is empty'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {filter !== 'all' 
                  ? `You don't have any ${filter}s in your library yet. Try changing the filter or upload some ${filter}s.`
                  : "Start building your media library by uploading your first file."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/upload"
                  className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Your First Media
                  </span>
                </Link>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="px-8 py-4 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300"
                  >
                    View All Media
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

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