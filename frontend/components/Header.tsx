
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  console.log('Header component rendered');
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-40 bg-gray-900/70 backdrop-blur text-white border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <Link href="/" className="text-xl font-bold tracking-tight">Nexus Search</Link>
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="text-sm bg-white/10 hover:bg-white/20 border border-white/10 rounded-md px-3 py-2">Search</button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-md overflow-hidden border border-white/10 bg-gray-900/95 backdrop-blur shadow-lg z-50 pointer-events-auto">
              <Link href="/search/text" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/10" onClick={() => setOpen(false)}>Text</Link>
              <Link href="/search/media" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/10" onClick={() => setOpen(false)}>Media</Link>
              <div className="h-px bg-white/10" />
              <Link href="/results/demo" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/10" onClick={() => setOpen(false)}>Results demo</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
