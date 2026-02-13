import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '@/components/Header';

// Mock the api module
const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header with title', () => {
      render(<Header />);
      expect(screen.getByText('Augment Skills')).toBeInTheDocument();
    });

    it('should render the MVP badge', () => {
      render(<Header />);
      expect(screen.getByText('MVP')).toBeInTheDocument();
    });

    it('should render scoring mode buttons', () => {
      render(<Header />);
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('Team Readiness')).toBeInTheDocument();
      expect(screen.getByText('Coverage %')).toBeInTheDocument();
    });

    it('should render the Collapse button', () => {
      render(<Header />);
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should render the Filters button', () => {
      render(<Header />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render the Export dropdown button', () => {
      render(<Header />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render the Views dropdown button', () => {
      render(
        <Header
          currentViewState={{
            scoringMode: 'average',
            skills: [],
            roles: [],
            managerId: null,
            notAssessed: 'exclude',
          }}
          onLoadView={() => {}}
        />
      );
      expect(screen.getByText('Views')).toBeInTheDocument();
    });

    it('should render the Admin button', () => {
      render(<Header />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render the Logout button', () => {
      render(<Header />);
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe('Scoring Mode Toggle', () => {
    it('should call onScoringModeChange when a scoring mode button is clicked', () => {
      const mockOnScoringModeChange = jest.fn();
      render(<Header onScoringModeChange={mockOnScoringModeChange} />);

      fireEvent.click(screen.getByText('Team Readiness'));
      expect(mockOnScoringModeChange).toHaveBeenCalledWith('team_readiness');

      fireEvent.click(screen.getByText('Coverage %'));
      expect(mockOnScoringModeChange).toHaveBeenCalledWith('coverage');
    });
  });

  describe('Collapse Button', () => {
    it('should call onCollapseAll when Collapse button is clicked', () => {
      const mockOnCollapseAll = jest.fn();
      render(<Header onCollapseAll={mockOnCollapseAll} />);

      fireEvent.click(screen.getByText('Collapse'));
      expect(mockOnCollapseAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filters Button', () => {
    it('should call onToggleFilterPanel when Filters button is clicked', () => {
      const mockOnToggleFilterPanel = jest.fn();
      render(<Header onToggleFilterPanel={mockOnToggleFilterPanel} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(mockOnToggleFilterPanel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin Dropdown', () => {
    it('should show dropdown menu on click', () => {
      render(<Header />);

      const adminButton = screen.getByText('Admin');
      fireEvent.click(adminButton);

      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getByText('Upload CSV')).toBeInTheDocument();
    });

    it('should have correct links in dropdown', () => {
      render(<Header />);

      const adminButton = screen.getByText('Admin');
      fireEvent.click(adminButton);

      expect(screen.getByText('Employees').closest('a')).toHaveAttribute('href', '/admin/employees');
      expect(screen.getByText('Upload CSV').closest('a')).toHaveAttribute('href', '/admin/employees/upload');
    });

    it('should show dropdown on mouse enter', async () => {
      render(<Header />);

      const adminButton = screen.getByText('Admin');
      const adminContainer = adminButton.closest('div.relative');

      if (adminContainer) {
        fireEvent.mouseEnter(adminContainer);

        await waitFor(() => {
          expect(screen.getByText('Employees')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout API and redirect to login on logout button click', async () => {
      mockPost.mockResolvedValueOnce({});

      render(<Header />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/auth/logout');
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login even if logout API fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      render(<Header />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/auth/logout');
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });
});

