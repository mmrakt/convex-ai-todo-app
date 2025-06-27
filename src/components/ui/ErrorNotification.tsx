'use client';

import { memo } from 'react';
import type { ErrorState } from '@/hooks/useErrorHandler';
import { Button } from './Button';

interface ErrorNotificationProps {
  error: ErrorState;
  onClose: () => void;
}

export const ErrorNotification = memo(function ErrorNotification({
  error,
  onClose,
}: ErrorNotificationProps) {
  const getErrorStyles = (type: ErrorState['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getIcon = (type: ErrorState['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom duration-300">
      <div className={`rounded-lg border-2 p-4 shadow-lg ${getErrorStyles(error.type)}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{getIcon(error.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{error.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 flex-shrink-0 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
});
