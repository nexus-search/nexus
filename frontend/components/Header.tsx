"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownOpen && !(e.target as Element).closest('.search-dropdown')) {
        setSearchDropdownOpen(false);
      }
      if (userDropdownOpen && !(e.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchDropdownOpen, userDropdownOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3">
              {/* Search Dropdown Button */}
              <div className="relative search-dropdown">
                <button
                  onClick={() => {
                    setSearchDropdownOpen(!searchDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
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
                    <span>Search</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${searchDropdownOpen ? 'rotate-180' : ''}`}
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
                {searchDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 animate-fadeInUp origin-top-right">
                    {/* Dropdown Content */}
                    <div className="relative rounded-xl overflow-hidden border border-white/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl">
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                          Search Options
                        </p>
                      </div>

                      {/* Dropdown Items */}
                      <div className="py-2">
                        <Link
                          href="/search/text"
                          className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20 transition-all duration-200"
                          onClick={() => setSearchDropdownOpen(false)}
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
                          onClick={() => setSearchDropdownOpen(false)}
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
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/upload"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Upload
                  </Link>
                  {/* User Dropdown */}
                  <div className="relative user-dropdown">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(!userDropdownOpen);
                        setSearchDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-300 hidden sm:block">{user?.username}</span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-56 animate-fadeInUp origin-top-right">
                        <div className="relative rounded-xl overflow-hidden border border-white/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl">
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-semibold text-white">{user?.username}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                          </div>
                          <div className="py-2">
                            <Link
                              href="/library"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20 transition-all duration-200"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                              </svg>
                              <span>My Library</span>
                            </Link>
                            <Link
                              href="/collections"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 transition-all duration-200"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span>Collections</span>
                            </Link>
                            <Link
                              href="/profile"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-all duration-200"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Profile</span>
                            </Link>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <div className="py-2">
                            <button
                              onClick={() => {
                                logout();
                                router.push('/');
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-600/20 transition-all duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-950/95 backdrop-blur-xl animate-fadeIn">
          <div className="container mx-auto px-4 py-20">
            <nav className="space-y-2">
              {/* Search Options */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
                  Search Options
                </p>
                <Link
                  href="/search/text"
                  className={`flex items-center gap-4 px-4 py-4 rounded-lg text-white transition-all duration-200 ${
                    isActive('/search/text')
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Text Search</p>
                    <p className="text-xs text-gray-400">Search by description</p>
                  </div>
                </Link>

                <Link
                  href="/search/media"
                  className={`flex items-center gap-4 px-4 py-4 rounded-lg text-white transition-all duration-200 ${
                    isActive('/search/media')
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Media Search</p>
                    <p className="text-xs text-gray-400">Upload image/video</p>
                  </div>
                </Link>

              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6" />

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="space-y-3 px-4">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user?.username}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/upload"
                    className="block w-full py-3 px-4 text-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Upload Media
                  </Link>
                  <Link
                    href="/library"
                    className={`block w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                      isActive('/library')
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    My Library
                  </Link>
                  <Link
                    href="/collections"
                    className={`block w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                      isActive('/collections')
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    Collections
                  </Link>
                  <Link
                    href="/profile"
                    className={`block w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                      isActive('/profile')
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full py-3 px-4 text-center rounded-lg bg-gray-800 text-gray-300 font-semibold hover:bg-gray-700 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3 px-4">
                  <Link
                    href="/auth/login"
                    className="block w-full py-3 px-4 text-center rounded-lg bg-white/5 text-white font-semibold hover:bg-white/10 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block w-full py-3 px-4 text-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;