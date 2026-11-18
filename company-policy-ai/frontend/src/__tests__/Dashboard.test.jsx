import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';

// Mock useAuth hook
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee',
        department: 'IT',
      },
      logout: vi.fn(),
      isAuthenticated: true,
    }),
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with user greeting', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  it('should display user role and department', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/employee/i)).toBeInTheDocument();
      expect(screen.getByText(/IT/i)).toBeInTheDocument();
    });
  });

  it('should show AI Assistant CTA button', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const ctaButton = screen.getByTestId('go-to-chat');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveTextContent(/Open AI Assistant/i);
    });
  });

  it('should display quick actions section', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Ask AI Assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/View Profile/i)).toBeInTheDocument();
    });
  });

  it('should display getting started section', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Getting Started/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Created/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile Completed/i)).toBeInTheDocument();
    });
  });

  it('should show appropriate greeting based on time of day', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
      const hasGreeting = greetings.some((greeting) =>
        screen.queryByText(new RegExp(greeting, 'i'))
      );
      expect(hasGreeting).toBe(true);
    });
  });
});
