import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArchivedSkillsPage from '../../app/admin/skills/archived/page';

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
  usePathname: () => '/admin/skills/archived',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

const mockArchivedSkills = [
  { id: 3, name: 'jQuery', category: 'Frontend', description: 'Legacy library', is_active: false },
  { id: 4, name: 'CoffeeScript', category: 'Language', description: 'Compile-to-JS', is_active: false },
];

function setupSuccessfulMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({ data: { isAuthenticated: true } });
    }
    if (url.includes('/skills')) {
      return Promise.resolve({ data: { data: mockArchivedSkills } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('ArchivedSkillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render archived skills list', async () => {
    setupSuccessfulMocks();
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('jQuery')).toBeInTheDocument();
      expect(screen.getByText('CoffeeScript')).toBeInTheDocument();
    });
  });

  it('should show "Archived Skills" heading', async () => {
    setupSuccessfulMocks();
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('Archived Skills')).toBeInTheDocument();
    });
  });

  it('should call PUT /skills/:id/restore when Restore is clicked', async () => {
    setupSuccessfulMocks();
    mockConfirm.mockReturnValue(true);
    mockPut.mockResolvedValue({});
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('jQuery')).toBeInTheDocument();
    });

    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/skills/3/restore');
    });
  });

  it('should show "Back to Skills" link', async () => {
    setupSuccessfulMocks();
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Skills')).toBeInTheDocument();
    });
  });

  it('should navigate to skills page when Back is clicked', async () => {
    setupSuccessfulMocks();
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Skills')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('← Back to Skills'));
    expect(mockPush).toHaveBeenCalledWith('/admin/skills');
  });

  it('should display skill details in table', async () => {
    setupSuccessfulMocks();
    render(<ArchivedSkillsPage />);

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Legacy library')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
    });
  });
});

