"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import SearchBar from '@/components/SearchBar';
import { useEffect, useState } from 'react';
import { searchService } from '@/lib/services/search.service';
import type { MediaItemResponse } from '@/lib/types/api';
import { useRouter } from 'next/navigation';
import MediaViewer from '@/components/MediaViewer';

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [active, setActive] = useState<MediaItemResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoading(false);
  }, []);

  const handleSearchText = async (q: string) => {
    router.push(`/search/text?q=${encodeURIComponent(q)}`);
  };

  const handleSearchFile = async (file: File) => {
    router.push('/search/media');
  };

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)]" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Spotlight Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center py-16 sm:py-20 lg:py-24">
          {/* Floating Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-xl mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-medium bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              AI-Powered Visual Search
            </span>
          </div>

          {/* Main Heading */}
          <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="block bg-gradient-to-r from-indigo-200 via-white to-fuchsia-200 bg-clip-text text-transparent drop-shadow-2xl">
              Find visually
            </span>
            <span className="block bg-gradient-to-r from-fuchsia-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-2xl">
              similar media
            </span>
          </h1>

          <p className={`text-lg sm:text-xl text-gray-300/90 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Search your library using <span className="text-indigo-300 font-semibold">natural language</span> or an <span className="text-purple-300 font-semibold">example image/video</span>.
            <br />
            Powered by advanced AI embeddings.
          </p>

          {/* Search Bar Container */}
          <div className={`max-w-4xl mx-auto transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              
              {/* Search Bar */}
              <div className="relative backdrop-blur-2xl bg-white/[0.07] border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl">
                <SearchBar onSearchText={handleSearchText} onSearch={handleSearchFile} loading={searching} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-400">10M+ Media Items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse animation-delay-1000" />
                <span className="text-gray-400">99.9% Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse animation-delay-2000" />
                <span className="text-gray-400">&lt;100ms Response</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Section */}
        <section className="mt-8 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
              <h2 className="text-white text-2xl sm:text-3xl font-bold">Trending Now</h2>
              <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-xs font-semibold text-indigo-300">LIVE</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/results/demo')} 
              className="group flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 transition-all duration-300"
            >
              <span>Explore more</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl h-72 overflow-hidden border border-white/5"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <MediaGrid items={items.slice(0, 6)} onItemClick={setActive} />
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Nexus Search</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the next generation of visual search technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Visual Similarity',
                description: 'Find lookalikes using deep embeddings across images and videos.',
                icon: '🎯',
                gradient: 'from-indigo-500 to-blue-500',
                delay: '0ms'
              },
              {
                title: 'Natural Language',
                description: 'Describe what you want; we search using multimodal models.',
                icon: '💬',
                gradient: 'from-purple-500 to-pink-500',
                delay: '100ms'
              },
              {
                title: 'Fast & Scalable',
                description: 'Optimized for responsive UX with lazy loading and caching.',
                icon: '⚡',
                gradient: 'from-pink-500 to-orange-500',
                delay: '200ms'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 transition-all duration-500"
                style={{ animationDelay: feature.delay }}
              >
                <div className="relative h-full rounded-2xl p-8 backdrop-blur-2xl bg-gray-900/50 overflow-hidden">
                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-bold text-xl mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => router.push('/search/text')} 
                className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Try Text Search
                </span>
              </button>

              <button 
                onClick={() => router.push('/search/media')} 
                className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Try Media Search
                </span>
              </button>
            </div>
            <p className="text-sm text-gray-500">No credit card required • Free forever</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bg-gray-900/50 backdrop-blur-xl border-t border-white/5 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400">&copy; 2025 Nexus Search. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a>
            </div>
          </div>
        </div>
      </footer>

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