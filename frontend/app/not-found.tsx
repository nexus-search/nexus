'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Nexus" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#e60023]">Nexus</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#e60023]/10 mb-6">
            <svg className="w-10 h-10 text-[#e60023]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Page Not Found</h1>
          <p className="text-gray-600 mb-8">We couldn't find what you were looking for. Try exploring popular pins or search for something new.</p>

          {/* Quick Search */}
          <div className="mx-auto max-w-xl">
            <div className="relative flex items-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
                  }
                }}
                placeholder="Search ideas (e.g. animals, travel, art)"
                className="flex-1 px-4 py-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => query.trim() && router.push(`/explore?q=${encodeURIComponent(query.trim())}`)}
                className="flex-shrink-0 p-3 hover:bg-gray-300 rounded-full transition-colors"
                title="Search"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="px-5 py-3 rounded-full bg-[#e60023] hover:bg-[#ad081b] text-white font-semibold transition-colors">Go Home</Link>
            <Link href="/explore" className="px-5 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors">Explore</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
