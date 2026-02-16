import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SkillEditPage from '../../app/admin/skills/[id]/page';

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
  usePathname: () => '/admin/skills/new',
  useSearchParams: () => new URLSearchParams(),
}));

describe('SkillEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParamsId = 'new';
  });

  describe('Create mode (id = "new")', () => {
    beforeEach(() => {
      mockParamsId = 'new';
      mockGet.mockImplementation((url: string) => {
        if (url.includes('/auth/me')) {
          return Promise.resolve({ data: { isAuthenticated: true } });
        }
        return Promise.resolve({ data: {} });
      });
    });

    it('should render create form with "Create Skill" heading', async () => {
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Skill')).toBeInTheDocument();
      });
    });

    it('should render empty form fields', async () => {
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toHaveValue('');
        expect(screen.getByLabelText(/Category/)).toHaveValue('');
        expect(screen.getByLabelText(/Description/)).toHaveValue('');
      });
    });

    it('should call POST when submitting create form', async () => {
      mockPost.mockResolvedValue({});
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Skill')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'TypeScript' } });
      fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Language' } });
      fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Typed JS' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/skills', {
          name: 'TypeScript',
          category: 'Language',
          description: 'Typed JS',
        });
      });
    });
  });

  describe('Edit mode (id = number)', () => {
    beforeEach(() => {
      mockParamsId = '5';
      mockGet.mockImplementation((url: string) => {
        if (url.includes('/auth/me')) {
          return Promise.resolve({ data: { isAuthenticated: true } });
        }
        if (url.includes('/skills/5')) {
          return Promise.resolve({
            data: { data: { id: 5, name: 'React', category: 'Frontend', description: 'UI library' } },
          });
        }
        return Promise.resolve({ data: {} });
      });
    });

    it('should render edit form with "Edit Skill" heading and loaded data', async () => {
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/)).toHaveValue('React');
        expect(screen.getByLabelText(/Category/)).toHaveValue('Frontend');
        expect(screen.getByLabelText(/Description/)).toHaveValue('UI library');
      });
    });

    it('should call PUT when submitting edit form', async () => {
      mockPut.mockResolvedValue({});
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toHaveValue('React');
      });

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'React.js' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith('/skills/5', {
          name: 'React.js',
          category: 'Frontend',
          description: 'UI library',
        });
      });
    });

    it('should navigate back when Cancel is clicked', async () => {
      render(<SkillEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockPush).toHaveBeenCalledWith('/admin/skills');
    });
  });
});

