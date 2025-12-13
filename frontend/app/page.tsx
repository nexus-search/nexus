"use client";
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const animals = [
    { name: 'Dogs', image: '2cdeb9f8b327e5533ed5e1c1b48c8859.jpg', rows: 2, cols: 1 },
    { name: 'Snakes', image: 'cb4b9a2cb3776bdd4fca42bd86b10fef.jpg', rows: 1, cols: 1 },
    { name: 'Tigers', image: '9ca4ff7a6524188fc44edd98e476b172.jpg', rows: 2, cols: 1 },
    { name: 'Pigs', image: 'aa4d18d5f9441e6891f4ec82bfc26cbb.jpg', rows: 1, cols: 1 },
    { name: 'Elephants', image: '69d3ea63308b27f122747fccda09734a.jpg', rows: 1, cols: 1 },
    { name: 'Bears', image: '97c38100389441e513fca39875e0c59d.jpg', rows: 2, cols: 1 },
    { name: 'Turkeys', image: '327bba844f34207157fbecec3a3473b1.jpg', rows: 1, cols: 1 },
    { name: 'Rabbits', image: 'cb4b9a2cb3776bdd4fca42bd86b10fef.jpg', rows: 1, cols: 1 },
    { name: 'Zebras', image: '343a584535b96bb7302265eecd251050.jpg', rows: 2, cols: 1 },
    { name: 'Lions', image: 'b3ea879d7ea28fe77d2b39f4207c36f2.jpg', rows: 1, cols: 1 },
    { name: 'Wolves', image: '867a5e1dd74ccc04c9baa2064695a75d.jpg', rows: 1, cols: 1 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
          Discover Beautiful <span className="text-[#e60023]">Animal Images</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Explore our curated collection of stunning animal photographs. Search, save, and organize your favorite images.
        </p>
        <button
          onClick={() => router.push('/explore')}
          className="px-8 py-4 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Start Exploring
        </button>
      </section>

      {/* Category Grid - Pinterest Style Masonry */}
      {/* Category Grid - Pinterest Style Masonry */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
        
        <style jsx>{`
          .masonry-grid {
            display: grid;
            /* Responsive columns: 2 columns on mobile, 3 on md, 4 on lg */
            grid-template-columns: repeat(2, 1fr); 
            /* Set the base unit height for one row */
            grid-auto-rows: 150px; 
            /* This is crucial for filling empty spaces */
            grid-auto-flow: dense;
          }
          /* Apply responsive column count using media queries within the style block */
          @media (min-width: 768px) { /* md breakpoint */
            .masonry-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          @media (min-width: 1024px) { /* lg breakpoint */
            .masonry-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }

          /* Item spanning is correct for creating the irregular look */
          .masonry-item[data-rows="2"] {
            grid-row: span 2;
          }
          
          .masonry-item[data-cols="2"] {
            grid-column: span 2;
          }
        `}</style>
        
        {/* Added gap-4 class for spacing, overriding the old 'gap: 0' */}
        <div className="masonry-grid gap-4"> 
          {animals.map((animal, idx) => (
            <button
              key={animal.name}
              onClick={() => router.push(`/explore?q=${encodeURIComponent(animal.name.toLowerCase())}`)}
              className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 masonry-item"
              data-rows={animal.rows}
              data-cols={animal.cols}
            >
              {/* Background Image */}
              <img
                src={`/images/${animal.image}`}
                alt={animal.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                <p className="text-white font-bold text-lg text-center px-2 drop-shadow-lg">{animal.name}</p>
              </div>
            </button>
          ))}
        </div>
      </section> 

      {/* Features Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Powerful Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#e60023]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#e60023]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">Find animal images by text or upload your own photo to discover similar content.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#e60023]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#e60023]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organize Boards</h3>
              <p className="text-gray-600">Create collections to save and organize your favorite animal images.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#e60023]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#e60023]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.36 4.24l-.707-.707M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Discovery</h3>
              <p className="text-gray-600">Find visually similar images using advanced AI embeddings technology.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to explore?</h2>
        <p className="text-gray-600 mb-8">Join thousands discovering beautiful animal images today.</p>
        <button
          onClick={() => router.push('/explore')}
          className="px-8 py-4 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Start Browsing Now
        </button>
      </section>
    </div>
  );
}
