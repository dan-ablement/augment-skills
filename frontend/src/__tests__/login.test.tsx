import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
  checkOAuthStatus: jest.fn().mockResolvedValue(false),
}));

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the login page', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Augment Skills')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
  });

  it('should show admin login form when OAuth is not configured', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });
  });

  it('should allow typing in username and password fields', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      
      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('testpass');
    });
  });

  it('should have a sign in button', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});

