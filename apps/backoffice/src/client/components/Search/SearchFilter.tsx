import React, { useState } from 'react';
import { TRACK_TYPES, TrackTypeMeta } from '../../constants/trackTypes';
import './SearchFilter.css';

interface SearchFilterProps {
  /** Controlled type filter ('' = all). Kept in sync with the StatsBar. */
  type: string;
  onSearch: (search: string) => void;
  onTypeChange: (type: string) => void;
  onReset: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  type,
  onSearch,
  onTypeChange,
  onReset,
}) => {
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  const handleReset = () => {
    setSearch('');
    onReset();
  };

  return (
    <form className="search-filter" onSubmit={handleSubmit}>
      <input
        type="text"
        className="neo-input search-input"
        placeholder="Search tracks…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="neo-select type-filter"
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="">All Types</option>
        {TRACK_TYPES.map((t) => (
          <option key={t} value={t}>
            {TrackTypeMeta[t].label}
          </option>
        ))}
      </select>
      <div className="search-actions">
        <button type="submit" className="neo-btn neo-btn--secondary neo-btn--sm">
          Search
        </button>
        <button
          type="button"
          className="neo-btn neo-btn--ghost neo-btn--sm"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </form>
  );
};
