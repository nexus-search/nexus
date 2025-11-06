interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button disabled={!canPrev} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-40">Prev</button>
      <span className="text-gray-300 text-sm">Page {page} of {pages}</span>
      <button disabled={!canNext} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded bg-gray-800 text-white disabled:opacity-40">Next</button>
    </div>
  );
}


