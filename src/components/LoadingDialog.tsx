import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  onCancel?: () => void;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  isOpen,
  message = "Parsing to SQL...",
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2
        -translate-y-1/2
        z-[100] bg-white border-2 border-[#0074D9]
        rounded-lg shadow-lg p-8 min-w-[500px]
        text-center
      "
    >
      {/* Loading Spinner */}
      <div
        className="
          w-10 h-10 border-4 border-gray-200 
          border-t-[#0074D9] rounded-full 
          animate-spin mx-auto mb-5
        "
      ></div>

      {/* Loading Message */}
      <h3 className="text-[#0074D9] mt-0 mb-2 text-lg font-bold">
        {message}
      </h3>

      <p
        className={`
          text-gray-600 text-sm mb-${onCancel ? "5" : "0"}
        `}
      >
        Please wait while we generate your SQL schema...
      </p>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="cursor-pointer
            bg-gray-400 text-white px-4 py-2 
            rounded-md text-sm hover:bg-gray-500
          "
        >
          Cancel
        </button>
      )}
    </div>
  );
};