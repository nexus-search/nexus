"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import SearchBar from '@/components/SearchBar';
import { useEffect, useState } from 'react';
import { getSearchResults, searchByText, searchSimilar } from '@/lib/api';
import { MediaItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import MediaViewer from '@/components/MediaViewer';

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [active, setActive] = useState<MediaItem | null>(null);

  useEffect(() => {
    (async () => {
      const res = await getSearchResults('demo');
      setItems(res.items);
      setLoading(false);
    })();
  }, []);

  const handleSearchText = async (q: string) => {
    setSearching(true);
    try {
      const res = await searchByText(q);
      router.push(`/results/${res.queryId}`);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchFile = async (file: File) => {
    setSearching(true);
    try {
      const res = await searchSimilar(file);
      router.push(`/results/${res.queryId}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.2),transparent_40%)]" />
      <Header />
      <main className="relative flex-grow container mx-auto p-4">
        <section className="text-center py-14">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 bg-clip-text text-transparent">Find visually similar media</h1>
          <p className="text-gray-300/90 mb-8">Search your library using natural language or an example image/video.</p>
          <div className="max-w-3xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]">
            <SearchBar onSearchText={handleSearchText} onSearch={handleSearchFile} loading={searching} />
          </div>
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-xl">Trending now</h2>
            <button onClick={() => router.push('/results/demo')} className="text-sm text-violet-300 hover:text-violet-200">Explore more →</button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl h-56 animate-pulse" />
              ))}
            </div>
          ) : (
            <MediaGrid items={items.slice(0, 6)} onItemClick={setActive} />
          )}
        </section>

        <section className="mt-16">
          <h2 className="text-white text-2xl text-center mb-8">Why Nexus Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl p-5 backdrop-blur-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Visual Similarity</h3>
              <p className="text-gray-300 text-sm">Find lookalikes using deep embeddings across images and videos.</p>
            </div>
            <div className="rounded-2xl p-5 backdrop-blur-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Natural Language</h3>
              <p className="text-gray-300 text-sm">Describe what you want; we search using multimodal models.</p>
            </div>
            <div className="rounded-2xl p-5 backdrop-blur-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Fast & Scalable</h3>
              <p className="text-gray-300 text-sm">Optimized for responsive UX with lazy loading and caching.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <button onClick={() => router.push('/search/text')} className="bg-violet-600 hover:bg-violet-500 text-white rounded px-4 py-2 mr-3">Try Text Search</button>
            <button onClick={() => router.push('/search/media')} className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2">Try Media Search</button>
          </div>
        </section>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 Nexus Search</p>
      </footer>
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
