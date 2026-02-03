import { render, screen } from '@testing-library/react';
import { SummaryCards } from '@/components/SummaryCards';

describe('SummaryCards', () => {
  const mockSummary = {
    totalEmployees: 150,
    totalSkills: 45,
    totalAssessments: 320,
    averageScore: 78,
  };

  describe('Rendering with correct data', () => {
    it('should render all four summary cards', () => {
      render(<SummaryCards summary={mockSummary} />);

      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getByText('Total Skills')).toBeInTheDocument();
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });

    it('should display correct values for each card', () => {
      render(<SummaryCards summary={mockSummary} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('should display icons for each card', () => {
      render(<SummaryCards summary={mockSummary} />);

      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  describe('Number formatting', () => {
    it('should display zero values correctly', () => {
      const zeroSummary = {
        totalEmployees: 0,
        totalSkills: 0,
        totalAssessments: 0,
        averageScore: 0,
      };

      render(<SummaryCards summary={zeroSummary} />);

      expect(screen.getAllByText('0')).toHaveLength(3);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display large numbers correctly', () => {
      const largeSummary = {
        totalEmployees: 10000,
        totalSkills: 500,
        totalAssessments: 25000,
        averageScore: 100,
      };

      render(<SummaryCards summary={largeSummary} />);

      expect(screen.getByText('10000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('25000')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should format average score with percentage sign', () => {
      render(<SummaryCards summary={mockSummary} />);

      const averageScoreValue = screen.getByText('78%');
      expect(averageScoreValue).toBeInTheDocument();
    });
  });

  describe('Card structure', () => {
    it('should render cards with proper structure', () => {
      const { container } = render(<SummaryCards summary={mockSummary} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('should render each card with white background and shadow', () => {
      const { container } = render(<SummaryCards summary={mockSummary} />);

      const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow');
      expect(cards).toHaveLength(4);
    });
  });

  describe('Edge cases', () => {
    it('should handle decimal average score', () => {
      const decimalSummary = {
        totalEmployees: 10,
        totalSkills: 5,
        totalAssessments: 20,
        averageScore: 85.5,
      };

      render(<SummaryCards summary={decimalSummary} />);

      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should handle negative values (edge case)', () => {
      const negativeSummary = {
        totalEmployees: -1,
        totalSkills: 0,
        totalAssessments: 0,
        averageScore: -5,
      };

      render(<SummaryCards summary={negativeSummary} />);

      expect(screen.getByText('-1')).toBeInTheDocument();
      expect(screen.getByText('-5%')).toBeInTheDocument();
    });
  });
});

