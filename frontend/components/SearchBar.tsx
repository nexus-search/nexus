
"use client";
import React, { useRef, useState } from 'react';

interface SearchBarProps {
  onSearch?: (file: File) => void;
  onSearchText?: (query: string) => void;
  loading?: boolean;
  showText?: boolean;
  showMedia?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSearchText, loading, showText = true, showMedia = true }) => {
  console.log('SearchBar component rendered');
  const [fileName, setFileName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => inputRef.current?.click();
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      onSearch?.(f);
    }
  };

  const triggerTextSearch = () => {
    if (!query.trim()) return;
    onSearchText?.(query.trim());
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg flex flex-col gap-3 md:flex-row md:items-center">
      {showText && (
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by text (e.g., 'sunset beach')"
            className="flex-1 bg-gray-800 text-white rounded px-3 py-2 outline-none"
          />
          <button onClick={triggerTextSearch} disabled={loading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded px-3 py-2">Search</button>
        </div>
      )}
      {showMedia && (
        <div className="flex items-center gap-3">
          <button onClick={handlePick} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded px-3 py-2">Choose File</button>
          <span className="text-gray-200 text-sm truncate w-48">{fileName || 'No file selected'}</span>
          <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
