import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useErrorHandler } from './useErrorHandler';

// Mock setTimeout and clearTimeout
vi.useFakeTimers();

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
  });

  it('should show error with default type', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('Test error message');
    });

    expect(result.current.error).toEqual({
      message: 'Test error message',
      type: 'error',
      timestamp: expect.any(Number),
    });
  });

  it('should show error with custom type', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('Test warning', 'warning');
    });

    expect(result.current.error).toEqual({
      message: 'Test warning',
      type: 'warning',
      timestamp: expect.any(Number),
    });
  });

  it('should clear error manually', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('Test error');
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should auto-clear error after 5 seconds', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('Test error');
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle Error object in handleError', () => {
    const { result } = renderHook(() => useErrorHandler());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const testError = new Error('Test error message');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toEqual({
      message: 'Test error message',
      type: 'error',
      timestamp: expect.any(Number),
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error caught by error handler:', testError);

    consoleSpy.mockRestore();
  });

  it('should handle string error in handleError', () => {
    const { result } = renderHook(() => useErrorHandler());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.handleError('String error message');
    });

    expect(result.current.error).toEqual({
      message: 'String error message',
      type: 'error',
      timestamp: expect.any(Number),
    });

    consoleSpy.mockRestore();
  });

  it('should use fallback message for unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.handleError({ unknown: 'error' }, 'Custom fallback message');
    });

    expect(result.current.error).toEqual({
      message: 'Custom fallback message',
      type: 'error',
      timestamp: expect.any(Number),
    });

    consoleSpy.mockRestore();
  });

  it('should use default fallback message when no custom fallback provided', () => {
    const { result } = renderHook(() => useErrorHandler());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.handleError({ unknown: 'error' });
    });

    expect(result.current.error).toEqual({
      message: 'An error occurred',
      type: 'error',
      timestamp: expect.any(Number),
    });

    consoleSpy.mockRestore();
  });
});
