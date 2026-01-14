import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'max-w-md'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl ${maxWidth} w-full my-8 border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
