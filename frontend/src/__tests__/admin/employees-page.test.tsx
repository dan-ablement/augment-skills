import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeesPage from '../../app/admin/employees/page';

// Mock the api module
const mockGet = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    post: jest.fn(),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/admin/employees',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Mock Header component
jest.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

const mockEmployees = [
  {
    id: 10, first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
    email: 'jane@example.com', title: 'Engineer', department: 'Engineering',
    manager_id: 1, manager_name: 'Scott Dietzen', is_active: true,
  },
  {
    id: 11, first_name: 'Bob', last_name: 'Smith', full_name: 'Bob Smith',
    email: 'bob@example.com', title: 'Designer', department: 'Design',
    manager_id: 1, manager_name: 'Scott Dietzen', is_active: true,
  },
];

const mockPagination = { page: 1, limit: 50, total: 2, totalPages: 1 };

function setupSuccessfulMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/employees')) {
      return Promise.resolve({ data: { data: mockEmployees, pagination: mockPagination } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<EmployeesPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display employees list after fetch', async () => {
    setupSuccessfulMocks();
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  it('should navigate to /admin/employees/${id} when Edit is clicked', async () => {
    setupSuccessfulMocks();
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/admin/employees/10');
  });

  it('should call DELETE endpoint when Deactivate is clicked', async () => {
    setupSuccessfulMocks();
    mockConfirm.mockReturnValue(true);
    mockDelete.mockResolvedValue({});
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    const deactivateButtons = screen.getAllByText('Deactivate');
    fireEvent.click(deactivateButtons[0]);
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('/employees/10');
    });
  });

  it('should use overflow-x-auto on table wrapper', async () => {
    setupSuccessfulMocks();
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    // Verify overflow-x-auto exists on the table wrapper
    const autoOverflow = document.querySelector('.overflow-x-auto');
    expect(autoOverflow).toBeInTheDocument();
    // Verify overflow-hidden is NOT used on the table wrapper
    const tables = document.querySelectorAll('table');
    tables.forEach((table) => {
      expect(table.parentElement?.classList.contains('overflow-hidden')).toBe(false);
    });
  });

  it('should show Add Employee button that navigates to /admin/employees/new', async () => {
    setupSuccessfulMocks();
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Add Employee')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Add Employee'));
    expect(mockPush).toHaveBeenCalledWith('/admin/employees/new');
  });

  it('should show View Archived button', async () => {
    setupSuccessfulMocks();
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('View Archived')).toBeInTheDocument();
    });
  });
});

