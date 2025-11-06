
import React from 'react';

const UploadZone = () => {
  console.log('UploadZone component rendered');
  return (
    <div className="border-dashed border-2 border-gray-500 p-8 rounded-lg text-center">
      <p className="text-gray-400">Drag & drop files here or click to select</p>
    </div>
  );
};

export default UploadZone;
