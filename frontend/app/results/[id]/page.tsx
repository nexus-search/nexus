"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import { useEffect, useState, use, useRef } from 'react';
import { getSearchResults } from '@/lib/api';
import { MediaItem } from '@/lib/types';
import MediaViewer from '@/components/MediaViewer';

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export default function ResultsPage({ params }: ResultsPageProps) {
  const { id } = use(params);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [threshold, setThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'similarity' | 'recent'>('similarity');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSearchResults(id, 1, pageSize);
        if (mounted) {
          setItems(res.items);
          setTotal(res.total || res.items.length);
          setPage(1);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const filtered = items
    .filter((it) => (typeFilter === 'all' ? true : it.mediaType === typeFilter))
    .filter((it) => (it.similarityScore == null ? true : it.similarityScore >= threshold))
    .sort((a, b) => {
      if (sortBy === 'similarity') {
        return (b.similarityScore || 0) - (a.similarityScore || 0);
      }
      return 0;
    });

  // Infinite scroll observer
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
        const nextPage = page + 1;
        const res = await getSearchResults(id, nextPage, pageSize);
        setItems((prev) => [...prev, ...res.items]);
        setPage(nextPage);
      } finally {
        setIsFetchingMore(false);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length, total, id, page, pageSize, isFetchingMore]);

  const stats = {
    total: items.length,
    images: items.filter(i => i.mediaType === 'image').length,
    videos: items.filter(i => i.mediaType === 'video').length,
    avgSimilarity: items.reduce((acc, i) => acc + (i.similarityScore || 0), 0) / items.length
  };

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Search Results
                </h1>
                <p className="text-gray-400 text-sm mt-1">Query ID: <span className="text-purple-400 font-mono">{id}</span></p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-xl">
                <div className="text-xs text-gray-400 mb-0.5">Total Results</div>
                <div className="text-xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600/20 to-fuchsia-600/20 border border-pink-500/30 backdrop-blur-xl">
                <div className="text-xs text-gray-400 mb-0.5">Avg Match</div>
                <div className="text-xl font-bold text-white">{(stats.avgSimilarity * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className={`hidden lg:block w-80 shrink-0 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <div className="sticky top-24 space-y-4">
              {/* Filter Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50 group-hover:opacity-70 transition duration-500"></div>
                <div className="relative backdrop-blur-xl bg-white/[0.05] border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Filters</h3>
                  </div>

                  {/* Type Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Media Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'all', label: 'All', icon: '🎨' },
                        { value: 'image', label: 'Images', icon: '🖼️' },
                        { value: 'video', label: 'Videos', icon: '🎬' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTypeFilter(option.value as any)}
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            typeFilter === option.value
                              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/50 shadow-lg'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 border border-white/5'
                          }`}
                        >
                          <div className="text-lg mb-1">{option.icon}</div>
                          <div className="text-xs">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Similarity Threshold */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Similarity Threshold
                      <span className="float-right text-purple-400 font-bold">{Math.round(threshold * 100)}%</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.05} 
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        style={{
                          background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${threshold * 100}%, rgb(31 41 55) ${threshold * 100}%, rgb(31 41 55) 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Sort By</label>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="similarity">Best Match</option>
                      <option value="recent">Most Recent</option>
                    </select>
                  </div>

                  {/* Stats Summary */}
                  <div className="pt-6 border-t border-white/10">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Images</span>
                        <span className="text-white font-semibold">{stats.images}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Videos</span>
                        <span className="text-white font-semibold">{stats.videos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Filtered</span>
                        <span className="text-purple-400 font-semibold">{filtered.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 rounded-2xl blur opacity-50"></div>
                <div className="relative backdrop-blur-xl bg-white/[0.05] border border-white/20 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setThreshold(0);
                        setSortBy('similarity');
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Filters
                    </button>
                    <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Export Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filters */}
          <div className={`lg:hidden mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="backdrop-blur-xl bg-white/[0.05] border border-white/20 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Type</label>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-white/10"
                  >
                    <option value="all">All</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Sort</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-white/10"
                  >
                    <option value="similarity">Best Match</option>
                    <option value="recent">Recent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Threshold: <span className="text-purple-400 font-bold">{Math.round(threshold * 100)}%</span>
                </label>
                <input 
                  type="range" 
                  min={0} 
                  max={1} 
                  step={0.05} 
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <section className={`flex-1 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Results Header */}
            {!loading && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-gray-300 text-sm">
                    Showing <span className="text-white font-bold">{filtered.length}</span> of <span className="text-white font-bold">{items.length}</span> results
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-purple-300 font-medium">Live</span>
                </div>
              </div>
            )}

            {loading ? (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-gray-400 text-sm">Loading results...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl h-72 overflow-hidden border border-white/5"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ) : filtered.length > 0 ? (
              <>
                <MediaGrid items={filtered} onItemClick={setActive} />
                
                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-10" />
                
                {/* Loading More Indicator */}
                {isFetchingMore && (
                  <div className="flex flex-col items-center justify-center py-16 animate-fadeInUp">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-fuchsia-500 border-l-purple-500 animate-spin animation-delay-1000" style={{ animationDirection: 'reverse' }}></div>
                    </div>
                    <p className="text-gray-400 text-sm mt-6 font-medium">Loading more results...</p>
                  </div>
                )}

                {/* End of Results */}
                {!isFetchingMore && items.length >= total && items.length > 0 && (
                  <div className="text-center py-16 animate-fadeInUp">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
                      </div>
                      <div>
                        <p className="text-gray-300 font-semibold mb-1">All results loaded</p>
                        <p className="text-gray-500 text-sm">You've seen all {total} matching items</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Results Match Your Filters</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Try adjusting your filters or lowering the similarity threshold to see more results.
                </p>
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setThreshold(0);
                  }}
                  className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset All Filters
                  </span>
                </button>
              </div>
            )}
          </section>
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