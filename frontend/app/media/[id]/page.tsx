import Header from '@/components/Header';

type MediaPageProps = {
  params: { id: string };
};

export default function MediaPage({ params }: MediaPageProps) {
  const { id } = params;
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-white text-2xl mb-4">Media {id}</h1>
        <div className="text-gray-300">Media detail placeholder. Linkable route.</div>
      </main>
    </div>
  );
}


