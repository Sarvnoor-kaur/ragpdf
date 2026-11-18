import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api from '../services/api';

// Mock the API
vi.mock('../services/api');

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with no user when no token exists', async () => {
    api.get.mockResolvedValue({ data: { success: false } });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employee',
    };

    api.get.mockResolvedValue({ data: { success: false } });
    api.post.mockResolvedValue({
      data: {
        success: true,
        token: 'test-token',
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('should handle login failure', async () => {
    api.get.mockResolvedValue({ data: { success: false } });
    api.post.mockResolvedValue({
      data: {
        success: false,
        message: 'Invalid credentials',
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.message).toBe('Invalid credentials');
    expect(result.current.user).toBeNull();
  });

  it('should logout successfully', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };

    localStorage.setItem('token', 'test-token');
    api.get.mockResolvedValue({
      data: {
        success: true,
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should register successfully', async () => {
    const mockUser = {
      _id: '123',
      name: 'New User',
      email: 'new@example.com',
      role: 'employee',
    };

    api.get.mockResolvedValue({ data: { success: false } });
    api.post.mockResolvedValue({
      data: {
        success: true,
        token: 'new-token',
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register(
        'New User',
        'new@example.com',
        'password123',
        'employee',
        'IT'
      );
    });

    expect(registerResult.success).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('should validate existing session on mount', async () => {
    const mockUser = {
      _id: '123',
      name: 'Existing User',
      email: 'existing@example.com',
    };

    localStorage.setItem('token', 'existing-token');
    api.get.mockResolvedValue({
      data: {
        success: true,
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear invalid token on mount', async () => {
    localStorage.setItem('token', 'invalid-token');
    api.get.mockRejectedValue(new Error('Invalid token'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
