"use client";
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import ProgressBar from '@/components/ProgressBar';
import { useState } from 'react';
import { uploadMedia } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setStatus('Uploading...');
    setProgress(10);
    try {
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadMedia(files[i], visibility, tags);
        uploadedFiles.push(result);
        setProgress(Math.min(90, Math.round(((i + 1) / files.length) * 90)));
      }
      setProgress(100);
      setStatus(`Upload complete! ${uploadedFiles.length} file(s) uploaded.`);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus(`Upload failed: ${e.message || 'Please try again.'}`);
      setProgress(0);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 max-w-4xl">
        <h1 className="text-white text-2xl mb-4">Upload Media</h1>
        
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="nature, sunset, vacation"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <UploadZone onFilesSelected={handleFiles} />
        <div className="mt-4 space-y-3">
          <ProgressBar progress={progress} />
          <p className="text-gray-300 text-sm">{status}</p>
        </div>
      </main>
    </div>
  );
}


