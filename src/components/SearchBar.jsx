import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (searchQuery && searchQuery.trim() !== '') {
          const element = document.getElementById("current-issues-feed");
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }}
      className="hidden md:flex items-center flex-1 max-w-lg mx-8 relative"
    >
      <input
        type="text"
        placeholder="Search by title, category, location, or status..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-800 placeholder-slate-400 font-medium ${
          searchQuery ? 'pr-16' : 'pr-10'
        }`}
      />
      <div className="absolute right-2.5 flex items-center space-x-1">
        {searchQuery && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearchQuery('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
            title="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="p-1 text-slate-400 hover:text-green-600 rounded-lg transition-all cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
