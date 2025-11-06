import Header from '@/components/Header';
import MediaGrid from '@/components/MediaGrid';
import Tabs from '@/components/Tabs';
import UploadZone from '@/components/UploadZone';

export default function Home() {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
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
