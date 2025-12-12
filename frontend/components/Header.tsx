"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'image'>('text');
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownOpen && !(e.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userDropdownOpen]);

  const handleImageSearch = () => {
    router.push('/search/media');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between gap-2 h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Nexus" className="w-10 h-10" />
            <span className="text-xl font-bold text-[#e60023] hidden sm:block">Nexus</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-3xl">
            <div className="relative flex items-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <button
                onClick={() => setSearchType(searchType === 'text' ? 'image' : 'text')}
                className="flex-shrink-0 p-3 hover:bg-gray-300 rounded-full transition-colors"
                title={searchType === 'text' ? 'Switch to image search' : 'Switch to text search'}
              >
                {searchType === 'text' ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {searchType === 'text' ? (
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 px-2 py-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        router.push(`/explore?q=${encodeURIComponent(value)}`);
                      }
                    }
                  }}
                />
              ) : (
                <button
                  onClick={() => router.push('/search/image')}
                  className="flex-1 px-2 py-3 text-left text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Upload an image to search...
                </button>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Create Button */}
                <Link
                  href="/create"
                  className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-full hover:bg-gray-100 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>

                {/* Notifications */}
                <button className="hidden sm:flex p-3 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity border-2 border-gray-200"
                  >
                    <img
                      src="/profile.png"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-2">Currently in</p>
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src="/profile.png"
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user?.username}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 py-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Your profile
                        </Link>
                        <Link
                          href="/collections"
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Your boards
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={() => {
                            logout();
                            router.push('/');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-full hover:bg-gray-100 font-semibold transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-full bg-[#e60023] hover:bg-[#ad081b] text-white font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
