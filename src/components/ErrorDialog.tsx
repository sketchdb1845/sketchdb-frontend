import React from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl p-6 max-w-[90%] max-h-[80%] w-[500px] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 border-red-500">
        {/* Header */}
        <div className="flex items-center mb-4 pb-3 border-b border-red-100">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm">
            !
          </div>
          <h2 className="m-0 text-red-500 text-lg font-semibold">
            {title}
          </h2>
        </div>
        
        {/* Main Message */}
        <div className="mb-4">
          <p className="m-0 text-gray-700 text-sm leading-6">
            {message}
          </p>
        </div>

        {/* Error Details */}
        {details && (
          <div className="mb-5">
            <details className="cursor-pointer">
              <summary className="text-gray-500 text-xs font-medium mb-2 outline-none">
                Show Error Details
              </summary>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 font-mono text-xs text-gray-700 max-h-[150px] overflow-auto whitespace-pre-wrap">
                {details}
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 border border-blue-500 rounded-md bg-white text-blue-500 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-50"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border-none rounded-md bg-red-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};