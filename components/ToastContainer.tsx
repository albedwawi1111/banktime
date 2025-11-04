import React from 'react';
import type { ToastMessage } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <>
      <div className="fixed top-24 right-4 z-50 space-y-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ToastContainer;
