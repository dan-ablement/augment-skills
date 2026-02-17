import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeeEditPage from '../../app/admin/employees/[id]/page';

// Mock the api module
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
let mockParamsId = 'new';
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ id: mockParamsId }),
  usePathname: () => '/admin/employees/new',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Header component
jest.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

const mockManagers = [
  { id: 1, full_name: 'Scott Dietzen', title: 'CEO', department: 'Executive' },
];

function setupCreateMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/employees/managers')) {
      return Promise.resolve({ data: { data: mockManagers } });
    }
    return Promise.resolve({ data: {} });
  });
}

function setupEditMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/employees/managers')) {
      return Promise.resolve({ data: { data: mockManagers } });
    }
    if (url.includes('/employees/10')) {
      return Promise.resolve({
        data: {
          data: {
            id: 10, first_name: 'Jane', last_name: 'Doe',
            email: 'jane@example.com', title: 'Engineer',
            department: 'Engineering', manager_id: 1,
          },
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('EmployeeEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParamsId = 'new';
  });

  describe('Create mode (id = "new")', () => {
    beforeEach(() => {
      mockParamsId = 'new';
      setupCreateMocks();
    });

    it('should render "Create Employee" heading', async () => {
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByText('Create Employee')).toBeInTheDocument();
      });
    });

    it('should call POST when submitting create form', async () => {
      mockPost.mockResolvedValue({});
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByText('Create Employee')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Wang' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'alice@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'PM' } });
      fireEvent.change(screen.getByLabelText(/Department/), { target: { value: 'Product' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/employees', {
          first_name: 'Alice',
          last_name: 'Wang',
          email: 'alice@example.com',
          title: 'PM',
          department: 'Product',
          manager_id: null,
        });
      });
    });
  });

  describe('Edit mode (id = number)', () => {
    beforeEach(() => {
      mockParamsId = '10';
      setupEditMocks();
    });

    it('should render "Edit Employee" heading with loaded data', async () => {
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
        expect(screen.getByLabelText(/First Name/)).toHaveValue('Jane');
        expect(screen.getByLabelText(/Last Name/)).toHaveValue('Doe');
        expect(screen.getByLabelText(/Email/)).toHaveValue('jane@example.com');
      });
    });

    it('should display manager dropdown with full_name — title format', async () => {
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      });
      // Regression test: manager dropdown must show "full_name — title" format
      const managerSelect = screen.getByLabelText(/Manager/);
      const options = managerSelect.querySelectorAll('option');
      const managerOption = Array.from(options).find((opt) => opt.value === '1');
      expect(managerOption).toBeDefined();
      expect(managerOption!.textContent).toBe('Scott Dietzen — CEO');
    });

    it('should call PUT when submitting edit form', async () => {
      mockPut.mockResolvedValue({});
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/)).toHaveValue('Jane');
      });

      fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Janet' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith('/employees/10', {
          first_name: 'Janet',
          last_name: 'Doe',
          email: 'jane@example.com',
          title: 'Engineer',
          department: 'Engineering',
          manager_id: 1,
        });
      });
    });

    it('should navigate to /admin/employees when Cancel is clicked', async () => {
      render(<EmployeeEditPage />);
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockPush).toHaveBeenCalledWith('/admin/employees');
    });
  });
});

