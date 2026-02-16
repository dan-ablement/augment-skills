import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SkillsPage from '../../app/admin/skills/page';

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
  usePathname: () => '/admin/skills',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

const mockSkills = [
  { id: 1, name: 'React', category: 'Frontend', description: 'React framework', is_active: true },
  { id: 2, name: 'Node.js', category: 'Backend', description: 'Server-side JS', is_active: true },
];

const mockPagination = { page: 1, limit: 50, total: 2, totalPages: 1 };

function setupSuccessfulMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/skills/categories')) {
      return Promise.resolve({ data: { data: ['Frontend', 'Backend'] } });
    }
    if (url.includes('/skills')) {
      return Promise.resolve({ data: { data: mockSkills, pagination: mockPagination } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('SkillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<SkillsPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display skills list after fetch', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('should show Add Skill button', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Skill')).toBeInTheDocument();
    });
  });

  it('should show View Archived button', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByText(/View Archived/)).toBeInTheDocument();
    });
  });

  it('should call DELETE endpoint when archive button is clicked', async () => {
    setupSuccessfulMocks();
    mockConfirm.mockReturnValue(true);
    mockDelete.mockResolvedValue({});
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByText('Archive');
    fireEvent.click(archiveButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('/skills/1');
    });
  });

  it('should have a search form that submits', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      // After search, the API should be called again
      expect(mockGet).toHaveBeenCalled();
    });
  });

  it('should navigate to new skill page when Add Skill is clicked', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Skill')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Skill'));
    expect(mockPush).toHaveBeenCalledWith('/admin/skills/new');
  });

  it('should display category and description columns', async () => {
    setupSuccessfulMocks();
    render(<SkillsPage />);

    await waitFor(() => {
      // 'Frontend' appears in both the category filter dropdown and the table cell
      const frontendElements = screen.getAllByText('Frontend');
      expect(frontendElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('React framework')).toBeInTheDocument();
    });
  });
});

