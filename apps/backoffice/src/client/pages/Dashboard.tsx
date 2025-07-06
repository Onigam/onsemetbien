import React, { useState, useEffect } from 'react';
import { TrackList } from '../components/TrackList/TrackList';
import { SearchFilter } from '../components/Search/SearchFilter';
import { Pagination } from '../components/Pagination/Pagination';
import { useTrackList } from '../hooks/useTrackList';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const { tracks, pagination, loading, error, refetch } = useTrackList({
    page,
    limit,
    search,
    type,
  });

  const handleSearch = (searchTerm: string, trackType: string) => {
    setSearch(searchTerm);
    setType(trackType);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Track Management</h2>
        <div className="dashboard-controls">
          <SearchFilter onSearch={handleSearch} />
          <div className="limit-selector">
            <label htmlFor="limit">Items per page:</label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">Error loading tracks: {error}</div>
      )}

      {loading ? (
        <div className="loading">Loading tracks...</div>
      ) : (
        <>
          <TrackList tracks={tracks} onTrackUpdate={refetch} />
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};
