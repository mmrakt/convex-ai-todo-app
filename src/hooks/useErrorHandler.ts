import { useCallback, useState } from 'react';

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((message: string, type: ErrorState['type'] = 'error') => {
    setError({
      message,
      type,
      timestamp: Date.now(),
    });

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (error: unknown, fallbackMessage = 'An error occurred') => {
      console.error('Error caught by error handler:', error);

      let message = fallbackMessage;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      showError(message, 'error');
    },
    [showError],
  );

  return {
    error,
    showError,
    clearError,
    handleError,
  };
}
