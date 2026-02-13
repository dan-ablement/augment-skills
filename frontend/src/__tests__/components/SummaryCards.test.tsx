import { render, screen } from '@testing-library/react';
import { SummaryCards } from '@/components/SummaryCards';
import type { SummaryData } from '@/types/hierarchy';

/** Helper to build a SummaryData object with sensible defaults */
function makeSummary(overrides: Partial<SummaryData> & {
  overallOverrides?: Partial<SummaryData['overall']>;
  filteredOverrides?: Partial<SummaryData['filtered']>;
} = {}): SummaryData {
  const {
    overallOverrides = {},
    filteredOverrides = {},
    ...rest
  } = overrides;
  return {
    overall: { totalEmployees: 150, totalSkills: 45, totalAssessments: 320, score: 78, ...overallOverrides },
    filtered: { totalEmployees: 150, totalSkills: 45, totalAssessments: 320, score: 78, ...filteredOverrides },
    hasFilters: false,
    scoreDistribution: [],
    recentAssessments: [],
    ...rest,
  };
}

describe('SummaryCards', () => {
  describe('Rendering without filters (single row)', () => {
    it('should render all four summary cards', () => {
      render(<SummaryCards summary={makeSummary()} />);

      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });

    it('should display correct values for each card', () => {
      render(<SummaryCards summary={makeSummary()} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('should display icons for each card', () => {
      render(<SummaryCards summary={makeSummary()} />);

      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  describe('Rendering with filters (dual row)', () => {
    it('should show Overall and Filtered View labels', () => {
      const summary = makeSummary({
        hasFilters: true,
        overallOverrides: { totalEmployees: 200, score: 80 },
        filteredOverrides: { totalEmployees: 50, score: 72 },
      });
      render(<SummaryCards summary={summary} />);

      expect(screen.getByText('Overall')).toBeInTheDocument();
      expect(screen.getByText('Filtered View')).toBeInTheDocument();
    });

    it('should render 8 cards (4 overall + 4 filtered)', () => {
      const summary = makeSummary({ hasFilters: true });
      const { container } = render(<SummaryCards summary={summary} />);

      const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow');
      expect(cards).toHaveLength(8);
    });
  });

  describe('Number formatting', () => {
    it('should display zero values correctly', () => {
      const summary = makeSummary({
        overallOverrides: { totalEmployees: 0, totalSkills: 0, totalAssessments: 0, score: 0 },
      });
      render(<SummaryCards summary={summary} />);

      expect(screen.getAllByText('0')).toHaveLength(3);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display large numbers correctly', () => {
      const summary = makeSummary({
        overallOverrides: { totalEmployees: 10000, totalSkills: 500, totalAssessments: 25000, score: 100 },
      });
      render(<SummaryCards summary={summary} />);

      expect(screen.getByText('10000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('25000')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should format score with percentage sign', () => {
      render(<SummaryCards summary={makeSummary()} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  describe('Card structure', () => {
    it('should render cards with proper grid structure', () => {
      const { container } = render(<SummaryCards summary={makeSummary()} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('should render each card with white background and shadow', () => {
      const { container } = render(<SummaryCards summary={makeSummary()} />);

      const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow');
      expect(cards).toHaveLength(4);
    });
  });

  describe('Scoring mode labels', () => {
    it('should show Team Readiness label for team_readiness mode', () => {
      render(<SummaryCards summary={makeSummary()} scoringMode="team_readiness" />);
      expect(screen.getByText('Team Readiness')).toBeInTheDocument();
    });

    it('should show Coverage % label for coverage mode', () => {
      render(<SummaryCards summary={makeSummary()} scoringMode="coverage" />);
      expect(screen.getByText('Coverage %')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle null score', () => {
      const summary = makeSummary({ overallOverrides: { score: null } });
      render(<SummaryCards summary={summary} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should handle decimal score by rounding', () => {
      const summary = makeSummary({ overallOverrides: { score: 85.5 } });
      render(<SummaryCards summary={summary} />);
      expect(screen.getByText('86%')).toBeInTheDocument();
    });
  });
});

