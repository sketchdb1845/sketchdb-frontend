import React, { useState } from "react";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'pdf', options: ExportOptions) => Promise<void>;
  onError?: (error: Error) => void;
}

interface ExportOptions {
  quality: number;
  backgroundColor: string;
  includeTitle: boolean;
  paperSize?: 'a4' | 'a3' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

interface ValidationError {
  field: string;
  message: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ 
  isOpen, 
  onClose, 
  onExport, 
  onError 
}) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [options, setOptions] = useState<ExportOptions>({
    quality: 2,
    backgroundColor: '#ffffff',
    includeTitle: true,
    paperSize: 'a4',
    orientation: 'landscape'
  });
  
  // Error handling states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  if (!isOpen) return null;

  // Validation functions
  const validateOptions = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Validate quality
    if (options.quality < 1 || options.quality > 3) {
      errors.push({ field: 'quality', message: 'Quality must be between 1 and 3' });
    }
    
    // Validate background color
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(options.backgroundColor)) {
      errors.push({ field: 'backgroundColor', message: 'Invalid background color format' });
    }
    
    // Validate PDF-specific options
    if (format === 'pdf') {
      if (!options.paperSize || !['a4', 'a3', 'letter'].includes(options.paperSize)) {
        errors.push({ field: 'paperSize', message: 'Invalid paper size' });
      }
      
      if (!options.orientation || !['portrait', 'landscape'].includes(options.orientation)) {
        errors.push({ field: 'orientation', message: 'Invalid orientation' });
      }
    }
    
    return errors;
  };

  const clearErrors = () => {
    setExportError(null);
    setValidationErrors([]);
  };

  const handleFormatChange = (newFormat: 'png' | 'pdf') => {
    setFormat(newFormat);
    clearErrors();
  };

  const handleOptionsChange = (newOptions: Partial<ExportOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    clearErrors();
  };

  const handleExport = async () => {
    try {
      // Clear previous errors
      clearErrors();
      
      // Validate options
      const errors = validateOptions();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      // Set loading state
      setIsExporting(true);
      
      // Attempt export
      await onExport(format, options);
      
      // Close dialog on success
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during export';
      
      setExportError(errorMessage);
      
      // Call onError callback if provided
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (isExporting) {
      return; // Prevent closing during export
    }
    clearErrors();
    onClose();
  };

  // Helper to get validation error for a field
  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(error => error.field === field)?.message;
  };

  // Helper to check if field has error
  const hasFieldError = (field: string): boolean => {
    return validationErrors.some(error => error.field === field);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Options</h2>
        
        {/* Global Error Display */}
        {exportError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Export Error:</span>
            </div>
            <p className="mt-1">{exportError}</p>
          </div>
        )}
        
        {/* Format Selection */}
        <div className="mb-4">
          <label htmlFor="format-select" className="block text-sm font-medium mb-2">Format</label>
          <select 
            id="format-select"
            value={format} 
            onChange={(e) => handleFormatChange(e.target.value as 'png' | 'pdf')}
            className="w-full p-2 border rounded"
            disabled={isExporting}
          >
            <option value="png">PNG Image</option>
            <option value="pdf">PDF Document</option>
          </select>
        </div>

        {/* Quality */}
        <div className="mb-4">
          <label htmlFor="quality-select" className="block text-sm font-medium mb-2">Quality</label>
          <select 
            id="quality-select"
            value={options.quality} 
            onChange={(e) => handleOptionsChange({quality: Number(e.target.value)})}
            className={`w-full p-2 border rounded ${hasFieldError('quality') ? 'border-red-500' : ''}`}
            disabled={isExporting}
          >
            <option value={1}>Standard (1x)</option>
            <option value={2}>High (2x)</option>
            <option value={3}>Ultra (3x)</option>
          </select>
          {getFieldError('quality') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('quality')}</p>
          )}
        </div>

        {/* Background Color */}
        <div className="mb-4">
          <label htmlFor="background-color" className="block text-sm font-medium mb-2">Background Color</label>
          <input
            id="background-color"
            type="color"
            value={options.backgroundColor}
            onChange={(e) => handleOptionsChange({backgroundColor: e.target.value})}
            className={`w-full h-10 border rounded ${hasFieldError('backgroundColor') ? 'border-red-500' : ''}`}
            disabled={isExporting}
          />
          {getFieldError('backgroundColor') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('backgroundColor')}</p>
          )}
        </div>

        {/* Include Title */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeTitle}
              onChange={(e) => handleOptionsChange({includeTitle: e.target.checked})}
              className="mr-2"
              disabled={isExporting}
            />
            Include title in export
          </label>
        </div>

        {/* PDF specific options */}
        {format === 'pdf' && (
          <>
            <div className="mb-4">
              <label htmlFor="paper-size" className="block text-sm font-medium mb-2">Paper Size</label>
              <select 
                id="paper-size"
                value={options.paperSize} 
                onChange={(e) => handleOptionsChange({paperSize: e.target.value as any})}
                className={`w-full p-2 border rounded ${hasFieldError('paperSize') ? 'border-red-500' : ''}`}
                disabled={isExporting}
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
              </select>
              {getFieldError('paperSize') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('paperSize')}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="orientation" className="block text-sm font-medium mb-2">Orientation</label>
              <select 
                id="orientation"
                value={options.orientation} 
                onChange={(e) => handleOptionsChange({orientation: e.target.value as any})}
                className={`w-full p-2 border rounded ${hasFieldError('orientation') ? 'border-red-500' : ''}`}
                disabled={isExporting}
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
              {getFieldError('orientation') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('orientation')}</p>
              )}
            </div>
          </>
        )}

        {/* Validation Errors Summary */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Please fix the following errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            disabled={isExporting || validationErrors.length > 0}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              isExporting || validationErrors.length > 0
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isExporting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              `Export ${format.toUpperCase()}`
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              isExporting
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};