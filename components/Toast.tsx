import React, { useEffect } from 'react';
import type { ToastMessage } from '../types';
import { InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const typeClasses = {
    success: 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-text)]/30',
    error: 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-text)]/30',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  };

  const Icon = {
    success: <InformationCircleIcon className="w-6 h-6" />,
    error: <ExclamationTriangleIcon className="w-6 h-6" />,
    info: <InformationCircleIcon className="w-6 h-6" />,
  }[toast.type];

  return (
    <div
      className={`relative w-full max-w-sm p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-toast-in ${typeClasses[toast.type]}`}
      role="alert"
    >
      <div className="flex-shrink-0">{Icon}</div>
      <p className="flex-grow text-sm font-semibold">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-current opacity-70 hover:opacity-100"
        aria-label="Close"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
