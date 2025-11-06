"use client";
import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import { useEffect, useState, use } from 'react';
import { getSearchResults } from '@/lib/api';
import { MediaItem } from '@/lib/types';

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export default function ResultsPage({ params }: ResultsPageProps) {
  const { id } = use(params);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSearchResults(id);
        if (mounted) setItems(res.items);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-white text-2xl mb-4">Results for {id}</h1>
        {loading ? (
          <div className="text-gray-300">Loading results...</div>
        ) : (
          <MediaGrid items={items} />
        )}
      </main>
    </div>
  );
}


