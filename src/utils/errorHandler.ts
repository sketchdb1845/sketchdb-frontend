export interface SQLError {
  type: 'syntax' | 'parsing' | 'validation' | 'constraint' | 'export' | 'import' | 'network' | 'unknown';
  title: string;
  message: string;
  details?: string;
  suggestions?: string[];
  retryable?: boolean;
}

export class SQLErrorHandler {
  static categorizeError(error: any, context: 'import' | 'export' | 'validation'): SQLError {
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || '';
    
    // SQL Syntax Errors
    if (this.isSyntaxError(errorMessage)) {
      return {
        type: 'syntax',
        title: 'SQL Syntax Error',
        message: 'There is a syntax error in your SQL statement.',
        details: errorMessage,
        suggestions: [
          'Check for missing commas, semicolons, or parentheses',
          'Ensure proper SQL keyword usage (CREATE TABLE, etc.)',
          'Verify table and column names are valid',
          'Make sure string values are properly quoted'
        ],
        retryable: true
      };
    }
    
    // SQL Parsing Errors
    if (this.isParsingError(errorMessage)) {
      return {
        type: 'parsing',
        title: 'SQL Parsing Error',
        message: 'Unable to parse the SQL schema. The SQL structure may not be supported.',
        details: errorMessage,
        suggestions: [
          'Ensure you\'re using standard SQL CREATE TABLE statements',
          'Check that foreign key references are properly formatted',
          'Verify that data types are supported',
          'Try simplifying complex table definitions'
        ],
        retryable: true
      };
    }
    
    // Foreign Key Constraint Errors
    if (this.isConstraintError(errorMessage)) {
      return {
        type: 'constraint',
        title: 'Foreign Key Constraint Error',
        message: 'There is an issue with foreign key relationships in your schema.',
        details: errorMessage,
        suggestions: [
          'Ensure referenced tables exist before creating foreign keys',
          'Check that referenced columns exist in the target table',
          'Verify data types match between foreign key and referenced columns',
          'Make sure primary keys are defined before being referenced'
        ],
        retryable: true
      };
    }
    
    // Validation Errors
    if (this.isValidationError(errorMessage)) {
      return {
        type: 'validation',
        title: 'Schema Validation Error',
        message: 'The schema contains validation errors that prevent processing.',
        details: errorMessage,
        suggestions: [
          'Check that all tables have at least one column',
          'Ensure primary keys are properly defined',
          'Verify foreign key references point to existing tables and columns',
          'Make sure column names are unique within each table'
        ],
        retryable: true
      };
    }
    
    // Import/Export specific errors
    if (context === 'import') {
      return {
        type: 'import',
        title: 'Schema Import Failed',
        message: 'Failed to import the SQL schema. Please check your SQL format.',
        details: errorMessage,
        suggestions: [
          'Ensure your SQL contains valid CREATE TABLE statements',
          'Check that the SQL is properly formatted with semicolons',
          'Remove any database-specific syntax not supported',
          'Try importing a smaller schema first to test'
        ],
        retryable: true
      };
    }
    
    if (context === 'export') {
      return {
        type: 'export',
        title: 'SQL Export Failed',
        message: 'Failed to generate SQL from your schema. There may be an issue with the table definitions.',
        details: errorMessage,
        suggestions: [
          'Check that all tables have valid names and columns',
          'Ensure foreign key relationships are properly configured',
          'Verify that all required fields are filled in',
          'Try removing complex constraints and export again'
        ],
        retryable: true
      };
    }
    
    // Network or system errors
    if (this.isNetworkError(errorMessage)) {
      return {
        type: 'network',
        title: 'Network Error',
        message: 'A network error occurred while processing your request.',
        details: errorMessage,
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Ensure no firewall is blocking the application'
        ],
        retryable: true
      };
    }
    
    // Default unknown error
    return {
      type: 'unknown',
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while processing your request.',
      details: `${errorMessage}\n\nStack trace:\n${errorStack}`,
      suggestions: [
        'Try refreshing the page and attempting the operation again',
        'Check the browser console for additional error details',
        'If the problem persists, try with a simpler schema',
        'Consider reporting this issue with the error details'
      ],
      retryable: true
    };
  }
  
  private static isSyntaxError(message: string): boolean {
    const syntaxPatterns = [
      /syntax error/i,
      /unexpected token/i,
      /missing.*[,;)]/i,
      /expected.*but found/i,
      /invalid.*syntax/i,
      /parse.*error/i,
      /unexpected.*character/i
    ];
    
    return syntaxPatterns.some(pattern => pattern.test(message));
  }
  
  private static isParsingError(message: string): boolean {
    const parsingPatterns = [
      /failed to parse/i,
      /cannot parse/i,
      /parsing.*failed/i,
      /invalid.*structure/i,
      /unsupported.*format/i,
      /malformed.*sql/i
    ];
    
    return parsingPatterns.some(pattern => pattern.test(message));
  }
  
  private static isConstraintError(message: string): boolean {
    const constraintPatterns = [
      /foreign key/i,
      /constraint.*violation/i,
      /reference.*not found/i,
      /table.*not found/i,
      /column.*not found/i,
      /primary key/i,
      /unique.*constraint/i
    ];
    
    return constraintPatterns.some(pattern => pattern.test(message));
  }
  
  private static isValidationError(message: string): boolean {
    const validationPatterns = [
      /validation.*failed/i,
      /invalid.*data/i,
      /required.*field/i,
      /missing.*required/i,
      /duplicate.*name/i,
      /empty.*table/i
    ];
    
    return validationPatterns.some(pattern => pattern.test(message));
  }
  
  private static isNetworkError(message: string): boolean {
    const networkPatterns = [
      /network.*error/i,
      /connection.*failed/i,
      /timeout/i,
      /fetch.*failed/i,
      /cors.*error/i
    ];
    
    return networkPatterns.some(pattern => pattern.test(message));
  }
  
  static getErrorTitle(errorType: SQLError['type']): string {
    const titles = {
      syntax: 'SQL Syntax Error',
      parsing: 'SQL Parsing Error',
      validation: 'Schema Validation Error',
      constraint: 'Foreign Key Constraint Error',
      export: 'SQL Export Failed',
      import: 'Schema Import Failed',
      network: 'Network Error',
      unknown: 'Unexpected Error'
    };
    
    return titles[errorType] || 'Error';
  }
  
  static formatSuggestions(suggestions: string[]): string {
    return suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
  }
}

// Hook for managing error states
export const useErrorHandler = () => {
  const [error, setError] = React.useState<SQLError | null>(null);
  
  const showError = (error: any, context: 'import' | 'export' | 'validation' = 'unknown' as any) => {
    const categorizedError = SQLErrorHandler.categorizeError(error, context);
    setError(categorizedError);
  };
  
  const clearError = () => {
    setError(null);
  };
  
  const retryOperation = (retryCallback: () => void) => {
    clearError();
    retryCallback();
  };
  
  return {
    error,
    showError,
    clearError,
    retryOperation,
    hasError: error !== null
  };
};

import React from 'react';