import React from 'react';
import type { TrackStats } from '../../services/api';
import { TRACK_TYPES, TrackTypeMeta, type TrackType } from '../../constants/trackTypes';
import './StatsBar.css';

interface StatsBarProps {
  stats: TrackStats | null;
  loading: boolean;
  /** Currently active type filter ('' = all / Total). */
  activeType: string;
  /** Toggle a type filter. Passing '' selects the Total card. */
  onSelectType: (type: string) => void;
}

interface StatCardProps {
  label: string;
  total: number;
  visible: number;
  hidden: number;
  color: string;
  active: boolean;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  total,
  visible,
  hidden,
  color,
  active,
  onClick,
}) => (
  <button
    type="button"
    className={`stat-card ${active ? 'stat-card--active' : ''}`}
    style={{ ['--card-color' as string]: color }}
    onClick={onClick}
    aria-pressed={active}
  >
    <span className="stat-card__accent" />
    <span className="stat-card__total">{total}</span>
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__breakdown">
      {visible} visibles · {hidden} masqués
    </span>
  </button>
);

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  loading,
  activeType,
  onSelectType,
}) => {
  if (loading && !stats) {
    return <div className="stats-bar stats-bar--loading">Loading stats…</div>;
  }

  if (!stats) return null;

  return (
    <div className="stats-bar">
      <StatCard
        label="Total"
        total={stats.totals.total}
        visible={stats.totals.visible}
        hidden={stats.totals.hidden}
        color="var(--neo-primary)"
        active={activeType === ''}
        onClick={() => onSelectType('')}
      />
      {TRACK_TYPES.map((type: TrackType) => {
        const meta = TrackTypeMeta[type];
        const counts = stats.byType[type] ?? { total: 0, visible: 0, hidden: 0 };
        return (
          <StatCard
            key={type}
            label={meta.label}
            total={counts.total}
            visible={counts.visible}
            hidden={counts.hidden}
            color={meta.color}
            active={activeType === type}
            onClick={() => onSelectType(type)}
          />
        );
      })}
    </div>
  );
};
