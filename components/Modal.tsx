import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 print:hidden"
      onClick={onClose}
    >
      <div 
        className={`bg-[var(--bg-secondary)] rounded-lg shadow-2xl p-6 w-full m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale ${maxWidth}`}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
          <h3 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Modal;
