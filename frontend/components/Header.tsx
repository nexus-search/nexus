
import React from 'react';

const Header = () => {
  console.log('Header component rendered');
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">Nexus Search</h1>
      </div>
    </header>
  );
};

export default Header;
