
"use client";
import React, { useRef, useState } from 'react';

interface SearchBarProps {
  onSearch?: (file: File) => void;
  loading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  console.log('SearchBar component rendered');
  const [fileName, setFileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => inputRef.current?.click();
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      onSearch?.(f);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg flex items-center gap-3">
      <button onClick={handlePick} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded px-3 py-2">Choose File</button>
      <span className="text-gray-200 text-sm flex-1 truncate">{fileName || 'No file selected'}</span>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
    </div>
  );
};

export default SearchBar;
