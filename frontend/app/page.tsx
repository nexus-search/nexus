import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import Tabs from '@/components/Tabs';
import UploadZone from '@/components/UploadZone';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-3 text-center">Go to Upload</Link>
          <Link href="/search" className="bg-purple-600 hover:bg-purple-500 text-white rounded px-4 py-3 text-center">Go to Search</Link>
          <Link href="/results/demo" className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-3 text-center">View Demo Results</Link>
        </div>
        <Tabs />
        <UploadZone />
        <MediaGrid />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 Nexus Search</p>
      </footer>
    </div>
  );
}
