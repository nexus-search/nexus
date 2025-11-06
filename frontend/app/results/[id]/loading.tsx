export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="h-6 w-40 bg-gray-800 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg h-60 animate-pulse" />)
        )}
      </div>
    </div>
  );
}


