"use client";
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import ProgressBar from '@/components/ProgressBar';
import { useState } from 'react';
import { uploadMedia } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setStatus('Uploading...');
    setProgress(10);
    try {
      // Simulate per-file uploads; navigate to a demo results on completion
      for (let i = 0; i < files.length; i++) {
        await uploadMedia(files[i]);
        setProgress(Math.min(90, Math.round(((i + 1) / files.length) * 90)));
      }
      setProgress(100);
      setStatus('Upload complete. Redirecting to results...');
      router.push('/results/demo');
    } catch (e) {
      console.error(e);
      setStatus('Upload failed. Please try again.');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-white text-2xl mb-4">Upload</h1>
        <UploadZone onFilesSelected={handleFiles} />
        <div className="mt-4 space-y-3">
          <ProgressBar progress={progress} />
          <p className="text-gray-300 text-sm">{status}</p>
        </div>
      </main>
    </div>
  );
}


