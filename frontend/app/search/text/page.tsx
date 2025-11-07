"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import MediaGrid from '@/components/MediaGrid';
import MediaViewer from '@/components/MediaViewer';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchByText } from '@/lib/api';
import { MediaItem } from '@/lib/types';

export default function SearchTextPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [queryId, setQueryId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 12;
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scope, setScope] = useState<string>('all');
  const [status, setStatus] = useState<string>('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check for initial query from URL params
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      handleSearchText(q, 1);
    }
  }, []);

  const handleSearchText = async (q: string, pageNum: number = 1) => {
    setLoading(true);
    setSearchComplete(false);
    setSearchQuery(q);
    
    try {
      const res = await searchByText(q, scope, pageNum, pageSize);
      if (pageNum === 1) {
        setItems(res.items);
        setPage(1);
      } else {
        setItems(prev => [...prev, ...res.items]);
      }
      setQueryId(res.queryId);
      setPage(pageNum);
      setTotal(res.total || res.items.length);
      setSearchComplete(true);
    } catch (error: any) {
      console.error('Search failed:', error);
      setStatus(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!searchQuery) return;
    const obs = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (isFetchingMore) return;
      const canLoadMore = items.length < total;
      if (!canLoadMore) return;
      setIsFetchingMore(true);
      try {
        const next = page + 1;
        await handleSearchText(searchQuery, next);
      } finally {
        setIsFetchingMore(false);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [searchQuery, items.length, total, page, pageSize, isFetchingMore, scope]);

  // Example search suggestions
  const suggestions = [
    { text: 'sunset over mountains', icon: '🏔️' },
    { text: 'people working together', icon: '👥' },
    { text: 'modern architecture', icon: '🏛️' },
    { text: 'colorful abstract art', icon: '🎨' }
  ];

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-fuchsia-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header Section */}
        <section className="text-center py-12 sm:py-16 lg:py-20">
          {/* Floating Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Natural Language Search
            </span>
          </div>

          {/* Main Heading */}
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="block bg-gradient-to-r from-purple-200 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent drop-shadow-2xl">
              Search by Text
            </span>
          </h1>

          <p className={`text-lg sm:text-xl text-gray-300/90 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Describe what you're looking for in <span className="text-purple-300 font-semibold">natural language</span>.
            <br className="hidden sm:block" />
            Our AI will find the perfect visual matches.
          </p>

          {/* Search Bar Section */}
          <div className={`max-w-4xl mx-auto transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative group">
              {/* Premium Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              
              {/* Search Bar Container */}
              <div className="relative backdrop-blur-2xl bg-white/[0.07] border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl">
                <SearchBar onSearchText={(q) => handleSearchText(q, 1)} loading={loading} showText={true} showMedia={false} />
              </div>
            </div>

            {/* Search Stats */}
            {searchComplete && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 animate-fadeInUp">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-gray-400">
                    Found <span className="text-white font-bold">{total}</span> matching items
                  </span>
                </div>
                <button
                  onClick={() => {
                    setItems([]);
                    setQueryId(null);
                    setSearchComplete(false);
                    setSearchQuery('');
                  }}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 transition-all duration-300"
                >
                  <svg className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Search
                </button>
              </div>
            )}

            {/* Search Suggestions */}
            {!searchComplete && !loading && (
              <div className="mt-6 animate-fadeInUp">
                <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchText(suggestion.text, 1)}
                      className="group px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 hover:border-purple-400/40 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-base">{suggestion.icon}</span>
                        {suggestion.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Query Display Section */}
        {searchQuery && searchComplete && (
          <section className="max-w-4xl mx-auto mb-12 animate-fadeInUp">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50"></div>
              <div className="relative backdrop-blur-xl bg-white/[0.05] border border-white/20 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Your Search Query</h3>
                    <p className="text-sm text-gray-400">Natural language processing in action</p>
                  </div>
                </div>
                
                <div className="relative rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-white/10 p-6">
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                      <span className="text-xs font-semibold text-purple-300">AI Processing</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xl text-white font-medium leading-relaxed">
                        "{searchQuery}"
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {searchQuery.split(' ').slice(0, 4).map((word, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        <section className={`pb-16 transition-all duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {loading && !items.length ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full animate-pulse" />
                <h2 className="text-2xl font-bold text-white">Processing your query...</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
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
          ) : items.length > 0 ? (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Matching Results</h2>
                    <p className="text-sm text-gray-400 mt-1">Showing {items.length} of {total} items</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-sm text-purple-300 font-medium">AI Powered</span>
                </div>
              </div>

              <MediaGrid items={items} onItemClick={setActive} />
              
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
                  <p className="text-gray-400 text-sm mt-6 font-medium">Finding more matches...</p>
                </div>
              )}

              {/* End of Results */}
              {!isFetchingMore && items.length >= total && items.length > 0 && (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">All results displayed</p>
                      <p className="text-gray-500 text-sm">You've seen all {total} matching items</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : searchComplete ? (
            <div className="text-center py-20">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Matches Found</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Try rephrasing your search query or using different keywords.
              </p>
              <button
                onClick={() => {
                  setSearchComplete(false);
                  setSearchQuery('');
                }}
                className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Another Search
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center animate-float">
                  <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Describe What You Need</h3>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Use natural language to find the perfect media
              </p>
              
              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  {
                    icon: '🧠',
                    title: 'Smart Understanding',
                    desc: 'AI interprets your intent',
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  {
                    icon: '🎯',
                    title: 'Precise Results',
                    desc: 'Get exactly what you describe',
                    gradient: 'from-pink-500 to-fuchsia-500'
                  },
                  {
                    icon: '💬',
                    title: 'Natural Language',
                    desc: 'Search like you speak',
                    gradient: 'from-fuchsia-500 to-purple-500'
                  }
                ].map((feature, i) => (
                  <div 
                    key={i}
                    className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 transition-all duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative h-full rounded-2xl p-6 backdrop-blur-2xl bg-gray-900/50 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                      <div className="relative z-10">
                        <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-500">
                          {feature.icon}
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{feature.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
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