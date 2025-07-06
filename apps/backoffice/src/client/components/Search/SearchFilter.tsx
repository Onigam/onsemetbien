import React, { useState } from 'react';
import './SearchFilter.css';

interface SearchFilterProps {
  onSearch: (search: string, type: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch }) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search, type);
  };

  const handleReset = () => {
    setSearch('');
    setType('');
    onSearch('', '');
  };

  return (
    <form className="search-filter" onSubmit={handleSubmit}>
      <div className="search-input">
        <input
          type="text"
          placeholder="Search tracks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="type-filter">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="music">Music</option>
          <option value="excerpt">Excerpt</option>
          <option value="sketch">Sketch</option>
          <option value="jingle">Jingle</option>
        </select>
      </div>
      <div className="search-actions">
        <button type="submit">Search</button>
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  );
};
