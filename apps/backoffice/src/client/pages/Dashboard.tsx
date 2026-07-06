import React, { useCallback, useState } from 'react';
import { TrackList } from '../components/TrackList/TrackList';
import { SearchFilter } from '../components/Search/SearchFilter';
import { Pagination } from '../components/Pagination/Pagination';
import { AddTrackDialog } from '../components/AddTrackDialog/AddTrackDialog';
import { StatsBar } from '../components/StatsBar/StatsBar';
import { useTrackList } from '../hooks/useTrackList';
import { useTrackStats } from '../hooks/useTrackStats';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { tracks, pagination, loading, error, refetch } = useTrackList({
    page,
    limit,
    search,
    type,
  });

  const { stats, loading: statsLoading, refetch: refetchStats } = useTrackStats();

  // Re-fetch both the list and the stats after any mutation.
  const handleTrackUpdate = useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1);
  };

  const handleSelectType = (nextType: string) => {
    setType(nextType);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setType('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="dashboard">
      <StatsBar
        stats={stats}
        loading={statsLoading}
        activeType={type}
        onSelectType={handleSelectType}
      />

      <div className="dashboard-header neo-panel">
        <h2>Track Management</h2>
        <div className="dashboard-controls">
          <SearchFilter
            type={type}
            onSearch={handleSearch}
            onTypeChange={handleSelectType}
            onReset={handleReset}
          />
          <div className="limit-selector">
            <label htmlFor="limit">Per page</label>
            <select
              id="limit"
              className="neo-select"
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            className="neo-btn neo-btn--primary add-track-button"
            onClick={() => setIsAddDialogOpen(true)}
          >
            + Add New Track
          </button>
        </div>
      </div>

      {error && (
        <div className="neo-message neo-message--error dashboard-error">
          Error loading tracks: {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading neo-panel">Loading tracks…</div>
      ) : (
        <>
          <TrackList tracks={tracks} onTrackUpdate={handleTrackUpdate} />
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <AddTrackDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onTrackAdded={handleTrackUpdate}
      />
    </div>
  );
};
