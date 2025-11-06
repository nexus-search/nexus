"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import MediaGrid from '@/components/MediaGrid';
import MediaViewer from '@/components/MediaViewer';
import Pagination from '@/components/Pagination';
import { useState, useRef, useEffect } from 'react';
import { getSearchResults, searchByText } from '@/lib/api';
import { MediaItem } from '@/lib/types';

export default function SearchTextPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [queryId, setQueryId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 12;
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleSearchText = async (q: string) => {
    setLoading(true);
    try {
      const res = await searchByText(q, 1, pageSize);
      setItems(res.items);
      setQueryId(res.queryId);
      setPage(1);
      setTotal(res.total || res.items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!queryId) return;
    const obs = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (isFetchingMore) return;
      const canLoadMore = items.length < total;
      if (!canLoadMore) return;
      setIsFetchingMore(true);
      try {
        const next = page + 1;
        const res = await getSearchResults(queryId, next, pageSize);
        setItems((prev) => [...prev, ...res.items]);
        setPage(next);
      } finally {
        setIsFetchingMore(false);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [queryId, items.length, total, page, pageSize, isFetchingMore]);

  return (
    <div className="bg-gray-950 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-white text-2xl mb-4">Search by Text</h1>
        <div className="max-w-3xl">
          <SearchBar onSearchText={handleSearchText} loading={loading} showText={true} showMedia={false} />
        </div>
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl h-56 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <MediaGrid items={items} onItemClick={setActive} />
              <div ref={sentinelRef} className="h-10" />
              {isFetchingMore && (
                <div className="text-center text-gray-400 text-sm">Loading more…</div>
              )}
            </>
          )}
        </div>
      </main>
      {active && (
        <MediaViewer mediaUrl={active.mediaUrl} mediaType={active.mediaType} onClose={() => setActive(null)} />
      )}
    </div>
  );
}


