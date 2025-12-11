"use client";
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mediaService } from '@/lib/services/media.service';
import { collectionService } from '@/lib/services/collection.service';

export default function ProfilePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMedia: 0,
    totalCollections: 0,
    storageUsed: 0,
    storageQuota: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats();
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [mediaRes, collections] = await Promise.all([
        mediaService.listUserMedia(1, 1).catch(() => ({ total: 0, items: [], page: 1, page_size: 1, has_more: false })),
        collectionService.getAll().catch(() => []),
      ]);
      setStats({
        totalMedia: mediaRes.total || 0,
        totalCollections: collections.length || 0,
        storageUsed: 0,
        storageQuota: 10 * 1024 * 1024 * 1024,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const storagePercent = stats.storageQuota > 0 
    ? (stats.storageUsed / stats.storageQuota) * 100 
    : 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="text-gray-400 font-medium">Loading profile...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Hero Section with User Card */}
            <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-900/90 border border-gray-800/50 backdrop-blur-xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative p-8 sm:p-12">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                    {/* Avatar Section */}
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-gray-900">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full border-4 border-gray-900 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="mb-4">
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-2">
                          {user?.username}
                        </h1>
                        <p className="text-gray-400 text-lg">{user?.email}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 backdrop-blur-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Verified
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 backdrop-blur-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                          Premium Member
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 backdrop-blur-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Joined 2025
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
                          <div className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                            {stats.totalMedia}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">Media Files</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
                          <div className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                            {stats.totalCollections}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">Collections</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
                          <div className="text-3xl font-bold bg-gradient-to-br from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                            {formatBytes(stats.storageQuota - stats.storageUsed)}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">Available</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
                          <div className="text-3xl font-bold bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">
                            {storagePercent.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-400 font-medium">Used</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className={`mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex gap-2 p-1.5 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 w-fit">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'overview'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'activity'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Storage Details Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      Storage Analytics
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm text-gray-400">Storage Usage</span>
                        <span className="text-2xl font-bold text-white">{formatBytes(stats.storageUsed)} <span className="text-sm text-gray-500">/ {formatBytes(stats.storageQuota)}</span></span>
                      </div>
                      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 transition-all duration-1000"
                          style={{ width: `${Math.min(storagePercent, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500">0%</span>
                        <span className="text-xs font-semibold text-cyan-400">{storagePercent.toFixed(1)}%</span>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                    </div>

                    {/* Storage Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-300">Images</span>
                        </div>
                        <p className="text-xl font-bold text-white">0 B</p>
                        <p className="text-xs text-gray-500 mt-1">0 files</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-300">Videos</span>
                        </div>
                        <p className="text-xl font-bold text-white">0 B</p>
                        <p className="text-xs text-gray-500 mt-1">0 files</p>
                      </div>
                    </div>

                    {storagePercent > 80 && (
                      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-orange-300 mb-1">Storage Almost Full</p>
                          <p className="text-sm text-gray-400">Consider removing unused files or upgrading your plan.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Account Created</p>
                        <p className="text-sm text-gray-400">Welcome to your new media library</p>
                      </div>
                      <span className="text-xs text-gray-500">Today</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/upload"
                      className="group relative overflow-hidden flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm font-semibold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="relative z-10">Upload Media</span>
                    </Link>
                    <Link
                      href="/library"
                      className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all text-sm font-medium border border-gray-700/50 hover:border-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      My Library
                    </Link>
                    <Link
                      href="/collections"
                      className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all text-sm font-medium border border-gray-700/50 hover:border-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Collections
                    </Link>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Username</label>
                      <div className="px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-medium">
                        {user?.username}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
                      <div className="px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-medium break-all">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips Card */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-1">Pro Tip</h4>
                      <p className="text-sm text-gray-300">Organize your media into collections for easier access and better management.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}