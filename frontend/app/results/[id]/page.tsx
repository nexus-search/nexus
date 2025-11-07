"use client";
import Header from '@/components/Header';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export default function ResultsPage({ params }: ResultsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page - results are now shown directly on search pages
    router.push('/');
  }, [router]);

  // Show loading message while redirecting
  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col">
      <Header />
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Redirecting...</h1>
          <p className="text-gray-400 mb-8">
            Search results are now shown directly on search pages.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            Go to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
