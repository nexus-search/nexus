"use client";
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserMedia, getCollections } from '@/lib/api';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMedia: 0,
    totalCollections: 0,
    storageUsed: 0,
    storageQuota: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats();
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [mediaRes, collectionsRes] = await Promise.all([
        getUserMedia(1, 1).catch(() => ({ total: 0 })),
        getCollections().catch(() => ({ collections: [] })),
      ]);
      setStats({
        totalMedia: mediaRes.total || 0,
        totalCollections: collectionsRes.collections?.length || 0,
        storageUsed: 0, // TODO: Get from user object when available
        storageQuota: 10 * 1024 * 1024 * 1024, // 10GB default
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
    <div className="relative bg-gray-950 min-h-screen flex flex-col">
      <Header />
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">
            Manage your account and view your statistics
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username</label>
                    <div className="px-4 py-2 bg-gray-800 rounded-lg text-white">{user?.username}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <div className="px-4 py-2 bg-gray-800 rounded-lg text-white">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Total Media</span>
                      <span className="text-white font-semibold">{stats.totalMedia}</span>
                    </div>
                    <Link
                      href="/library"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View Library →
                    </Link>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Collections</span>
                      <span className="text-white font-semibold">{stats.totalCollections}</span>
                    </div>
                    <Link
                      href="/collections"
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      View Collections →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Storage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Used</span>
                    <span className="text-white font-semibold">{formatBytes(stats.storageUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quota</span>
                    <span className="text-white font-semibold">{formatBytes(stats.storageQuota)}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    {storagePercent.toFixed(1)}% used
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/upload"
                    className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-center text-sm font-medium"
                  >
                    Upload Media
                  </Link>
                  <Link
                    href="/library"
                    className="block w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all text-center text-sm font-medium"
                  >
                    My Library
                  </Link>
                  <Link
                    href="/collections"
                    className="block w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all text-center text-sm font-medium"
                  >
                    Collections
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

