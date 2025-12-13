
"use client";
import React, { useRef } from 'react';

interface UploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, disabled }) => {
  console.log('UploadZone component rendered');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected?.(files);
  };

  return (
    <div className="border-dashed border-2 border-gray-500 p-8 rounded-lg text-center cursor-pointer" onClick={handleClick}>
      <p className="text-gray-400">Drag & drop files here or click to select</p>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} disabled={disabled} />
    </div>
  );
};

export default UploadZone;
