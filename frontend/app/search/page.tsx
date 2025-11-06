"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import MediaGrid from '@/components/MediaGrid';
import { useState } from 'react';
import { searchSimilar } from '@/lib/api';
import { MediaItem } from '@/lib/types';

export default function SearchPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<MediaItem[]>([]);

  const handleSearch = async (file: File) => {
    setLoading(true);
    try {
      const res = await searchSimilar(file);
      setItems(res.items);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-white text-2xl mb-4">Search</h1>
        <SearchBar onSearch={handleSearch} loading={loading} />
        <div className="mt-6">
          <MediaGrid items={items} />
        </div>
      </main>
    </div>
  );
}


