import React from 'react';
import logoImg from '../assets/images/logo.png';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="آزمونیک" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold primary-text">آزمونیک</h1>
        </div>
        <span className="text-gray-500 font-medium hidden sm:block">مولد آزمون هوشمند</span>
      </div>
    </header>
  );
};

export default Header;