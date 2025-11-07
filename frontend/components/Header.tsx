"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && !(e.target as Element).closest('.dropdown-container')) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const isActive = (path: string) => pathname === path;

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' 
          : 'bg-gray-900/40 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Section */}
          <Link 
            href="/" 
            className="group flex items-center gap-3 transition-all duration-300"
          >
            {/* Logo Icon */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
            </div>

            {/* Logo Text */}
            <div className="hidden sm:block">
              <span className="text-xl font-black bg-gradient-to-r from-blue-200 via-cyan-200 to-white bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-cyan-300 group-hover:to-white transition-all duration-300">
                Nexus
              </span>
              <span className="text-xl font-black text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Search
              </span>
            </div>
          </Link>

          {/* Navigation Section */}
          <nav className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/search/text"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive('/search/text')
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Text Search
              </Link>
              <Link
                href="/search/media"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive('/search/media')
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Media Search
              </Link>
            </div>

            {/* Search Dropdown Button */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setOpen(!open)}
                className="group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 overflow-hidden"
              >
                {/* Button Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Button Content */}
                <span className="relative flex items-center gap-2 text-white">
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                  <span className="hidden sm:inline">Search</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </span>
              </button>

              {/* Dropdown Menu */}
              {open && (
                <div className="absolute right-0 mt-3 w-56 animate-fadeInUp origin-top-right">
                  {/* Dropdown Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20"></div>
                  
                  {/* Dropdown Content */}
                  <div className="relative rounded-xl overflow-hidden border border-white/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Search Options
                      </p>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-2">
                      <Link
                        href="/search/text"
                        className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20 transition-all duration-200"
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">Text Search</p>
                          <p className="text-xs text-gray-400">Search by description</p>
                        </div>
                      </Link>

                      <Link
                        href="/search/media"
                        className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20 transition-all duration-200"
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">Media Search</p>
                          <p className="text-xs text-gray-400">Upload image/video</p>
                        </div>
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Demo Link */}
                    <div className="py-2">
                      <Link
                        href="/results/demo"
                        className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 transition-all duration-200"
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">Results Demo</p>
                          <p className="text-xs text-gray-400">See example results</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/upload"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Upload
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 hidden sm:inline">{user?.username}</span>
                    <button
                      onClick={() => {
                        logout();
                        router.push('/');
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-lg text-gray-300 text-sm font-medium hover:bg-white/5 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button - Optional for future expansion */}
            <button className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </nav>
        </div>
      </div>

      {/* Progress Bar on Scroll */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 transition-all duration-300"
        style={{ 
          width: scrolled ? '100%' : '0%',
          opacity: scrolled ? 1 : 0
        }}
      />
    </header>
  );
};

export default Header;