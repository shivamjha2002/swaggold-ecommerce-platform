import { describe, it, expect, vi } from 'vitest';
import { AxiosError } from 'axios';
import { getErrorMessage, handleApiError } from '../utils/errorHandler';

// Mock the toast utility
vi.mock('../utils/toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('getErrorMessage', () => {
  it('should extract error message from response.data.error.message', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: 'Invalid credentials',
          },
        },
        status: 401,
        statusText: 'Unauthorized',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Invalid credentials');
  });

  it('should extract error message from response.data.message', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'User not found',
        },
        status: 404,
        statusText: 'Not Found',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('User not found');
  });

  it('should extract error message from response.data.error as string', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: 'Validation failed',
        },
        status: 400,
        statusText: 'Bad Request',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Validation failed');
  });

  it('should handle validation errors with details', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            details: {
              username: 'Username is required',
              email: 'Invalid email format',
            },
          },
        },
        status: 400,
        statusText: 'Bad Request',
      },
    } as AxiosError;

    const message = getErrorMessage(error);
    expect(message).toContain('username: Username is required');
    expect(message).toContain('email: Invalid email format');
  });

  it('should handle direct string response', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: 'Server error occurred',
        status: 500,
        statusText: 'Internal Server Error',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Server error occurred');
  });

  it('should return status text with code as fallback', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Internal Server Error (500)');
  });

  it('should handle network errors', () => {
    const error = {
      isAxiosError: true,
      request: {},
      message: 'Network Error',
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Network error. Please check your internet connection.');
  });

  it('should handle timeout errors', () => {
    const error = {
      isAxiosError: true,
      request: {},
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded',
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Request timeout. Please try again.');
  });

  it('should handle connection errors', () => {
    const error = {
      isAxiosError: true,
      request: {},
      message: 'Connection refused',
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Unable to connect to server. Please check your connection and try again.');
  });

  it('should handle standard Error objects', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('should handle string errors', () => {
    const error = 'Custom error message';
    expect(getErrorMessage(error)).toBe('Custom error message');
  });

  it('should return default message for unknown errors', () => {
    const error = { unknown: 'error' };
    expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
  });

  it('should prioritize error.message over message when both exist', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: 'Detailed error message',
          },
          message: 'Generic message',
        },
        status: 400,
        statusText: 'Bad Request',
      },
    } as AxiosError;

    expect(getErrorMessage(error)).toBe('Detailed error message');
  });
});

describe('handleApiError', () => {
  it('should use custom message when provided', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'Server error',
        },
        status: 500,
        statusText: 'Internal Server Error',
      },
    } as AxiosError;

    const message = handleApiError(error, 'Custom error message');
    expect(message).toBe('Custom error message');
  });

  it('should extract message when custom message not provided', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: 'Invalid input',
          },
        },
        status: 400,
        statusText: 'Bad Request',
      },
    } as AxiosError;

    const message = handleApiError(error);
    expect(message).toBe('Invalid input');
  });

  it('should not show toast for 401 errors', async () => {
    const { default: showToast } = await import('../utils/toast');
    vi.mocked(showToast.error).mockClear();

    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'Unauthorized',
        },
        status: 401,
        statusText: 'Unauthorized',
      },
    } as AxiosError;

    handleApiError(error);
    expect(showToast.error).not.toHaveBeenCalled();
  });
});
