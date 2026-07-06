import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsBar } from './StatsBar';
import type { TrackStats } from '../../services/api';

const stats: TrackStats = {
  byType: {
    music: { total: 10, visible: 8, hidden: 2 },
    excerpt: { total: 4, visible: 4, hidden: 0 },
    sketch: { total: 3, visible: 1, hidden: 2 },
    jingle: { total: 2, visible: 2, hidden: 0 },
  },
  totals: { total: 19, visible: 15, hidden: 4 },
};

describe('StatsBar', () => {
  it('renders the loading text when stats is null and loading is true', () => {
    render(
      <StatsBar stats={null} loading activeType="" onSelectType={() => {}} />
    );
    expect(screen.getByText('Loading stats…')).toBeInTheDocument();
  });

  it('renders nothing when stats is null and not loading', () => {
    const { container } = render(
      <StatsBar
        stats={null}
        loading={false}
        activeType=""
        onSelectType={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a Total card and one card per known track type', () => {
    render(
      <StatsBar
        stats={stats}
        loading={false}
        activeType=""
        onSelectType={() => {}}
      />
    );

    // Total + 4 types = 5 clickable cards.
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(5);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Excerpt')).toBeInTheDocument();
    expect(screen.getByText('Sketch')).toBeInTheDocument();
    expect(screen.getByText('Jingle')).toBeInTheDocument();
  });

  it('shows the correct totals and visible/hidden breakdown per card', () => {
    render(
      <StatsBar
        stats={stats}
        loading={false}
        activeType=""
        onSelectType={() => {}}
      />
    );

    const totalCard = screen.getByText('Total').closest('button')!;
    expect(totalCard).toHaveTextContent('19');
    expect(totalCard).toHaveTextContent('15 visibles · 4 masqués');

    const musicCard = screen.getByText('Music').closest('button')!;
    expect(musicCard).toHaveTextContent('10');
    expect(musicCard).toHaveTextContent('8 visibles · 2 masqués');

    const sketchCard = screen.getByText('Sketch').closest('button')!;
    expect(sketchCard).toHaveTextContent('3');
    expect(sketchCard).toHaveTextContent('1 visibles · 2 masqués');
  });

  it('zero-fills a type missing from byType', () => {
    const partial: TrackStats = {
      byType: {
        music: { total: 5, visible: 5, hidden: 0 },
      } as TrackStats['byType'],
      totals: { total: 5, visible: 5, hidden: 0 },
    };

    render(
      <StatsBar
        stats={partial}
        loading={false}
        activeType=""
        onSelectType={() => {}}
      />
    );

    const jingleCard = screen.getByText('Jingle').closest('button')!;
    expect(jingleCard).toHaveTextContent('0 visibles · 0 masqués');
  });

  it('calls onSelectType with the type when a type card is clicked', async () => {
    const onSelectType = vi.fn();
    render(
      <StatsBar
        stats={stats}
        loading={false}
        activeType=""
        onSelectType={onSelectType}
      />
    );

    await userEvent.click(screen.getByText('Sketch').closest('button')!);
    expect(onSelectType).toHaveBeenCalledWith('sketch');
  });

  it('calls onSelectType with empty string when the Total card is clicked', async () => {
    const onSelectType = vi.fn();
    render(
      <StatsBar
        stats={stats}
        loading={false}
        activeType="music"
        onSelectType={onSelectType}
      />
    );

    await userEvent.click(screen.getByText('Total').closest('button')!);
    expect(onSelectType).toHaveBeenCalledWith('');
  });

  it('marks the active card via aria-pressed', () => {
    render(
      <StatsBar
        stats={stats}
        loading={false}
        activeType="music"
        onSelectType={() => {}}
      />
    );

    expect(screen.getByText('Music').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('Total').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
