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

    it('should render the Dashboard link', () => {
      render(<Header />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
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

