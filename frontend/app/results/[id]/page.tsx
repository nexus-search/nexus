"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import { useEffect, useState, use, useRef } from 'react';
import { getSearchResults } from '@/lib/api';
import { MediaItem } from '@/lib/types';
import MediaViewer from '@/components/MediaViewer';
import Pagination from '@/components/Pagination';

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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
  
  // basic filter placeholders
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [threshold, setThreshold] = useState<number>(0);

  const filtered = items
    .filter((it) => (typeFilter === 'all' ? true : it.mediaType === typeFilter))
    .filter((it) => (it.similarityScore == null ? true : it.similarityScore >= threshold));

  // infinite scroll observer
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
  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.12),transparent_40%)]" />
      <Header />
      <main className="relative flex-grow container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl">Results</h1>
          <div className="text-gray-400 text-sm">Query: {id}</div>
        </div>
        <div className="flex gap-6">
          <aside className="hidden md:block w-64 shrink-0 sticky top-4 h-fit backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-white font-semibold mb-3">Filters</div>
            <label className="block text-gray-300 text-sm mb-2">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full bg-gray-800 text-white rounded px-3 py-2 mb-4">
              <option value="all">All</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <label className="block text-gray-300 text-sm mb-2">Threshold</label>
            <div className="flex items-center gap-2">
              <input className="flex-1" type="range" min={0} max={1} step={0.05} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
              <span className="text-gray-300 text-sm w-10 text-right">{Math.round(threshold * 100)}%</span>
            </div>
          </aside>
          <section className="flex-1">
            <div className="md:hidden mb-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-4">
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="bg-gray-800 text-white rounded px-3 py-2">
                    <option value="all">All</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm">Thresh</label>
                    <input type="range" min={0} max={1} step={0.05} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
                    <span className="text-gray-300 text-sm">{Math.round(threshold * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl h-56 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <MediaGrid items={filtered} onItemClick={setActive} />
                <div ref={sentinelRef} className="h-10" />
                {isFetchingMore && (
                  <div className="text-center text-gray-400 text-sm">Loading more…</div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
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


