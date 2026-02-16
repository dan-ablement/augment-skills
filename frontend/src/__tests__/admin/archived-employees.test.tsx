import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArchivedEmployeesPage from '../../app/admin/employees/archived/page';

// Mock the api module
const mockGet = jest.fn();
const mockPut = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
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
  usePathname: () => '/admin/employees/archived',
  useSearchParams: () => new URLSearchParams(),
}));

const mockArchivedEmployees = [
  {
    id: 10,
    first_name: 'Jane',
    last_name: 'Doe',
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    title: 'Engineer',
    department: 'Engineering',
    manager_id: null,
    manager_name: '',
    is_active: false,
  },
  {
    id: 11,
    first_name: 'Bob',
    last_name: 'Smith',
    full_name: 'Bob Smith',
    email: 'bob@example.com',
    title: 'Designer',
    department: 'Design',
    manager_id: 1,
    manager_name: 'Alice Manager',
    is_active: false,
  },
];

function setupSuccessfulMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/employees')) {
      return Promise.resolve({ data: { data: mockArchivedEmployees } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('ArchivedEmployeesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render archived employees list', async () => {
    setupSuccessfulMocks();
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  it('should show "Archived Employees" heading', async () => {
    setupSuccessfulMocks();
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Archived Employees')).toBeInTheDocument();
    });
  });

  it('should call PUT /employees/:id/restore when Restore is clicked', async () => {
    setupSuccessfulMocks();
    mockPut.mockResolvedValue({});
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/employees/10/restore');
    });
  });

  it('should show "Back to Employees" link', async () => {
    setupSuccessfulMocks();
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Employees')).toBeInTheDocument();
    });
  });

  it('should navigate to employees page when Back is clicked', async () => {
    setupSuccessfulMocks();
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Employees')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('← Back to Employees'));
    expect(mockPush).toHaveBeenCalledWith('/admin/employees');
  });

  it('should display employee details in table', async () => {
    setupSuccessfulMocks();
    render(<ArchivedEmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });
});

