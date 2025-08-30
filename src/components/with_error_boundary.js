import React from 'react';
import ErrorBoundary from './error_boundary';

/**
 * Higher-order component that wraps a component with an error boundary
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.Component} Component wrapped with error boundary
 */
const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const WithErrorBoundaryComponent = (props) => {
    const defaultFallback = (error, errorInfo, retry, canRetry) => (
      <div className="component-error">
        <h3>Component Error</h3>
        <p>The {WrappedComponent.displayName || WrappedComponent.name || 'component'} encountered an error.</p>
        {canRetry && (
          <button onClick={retry} type="button">
            Retry Component
          </button>
        )}
        {process.env.NODE_ENV === 'development' && (
          <details>
            <summary>Technical Details</summary>
            <pre>{error.toString()}</pre>
          </details>
        )}
      </div>
    );

    return (
      <ErrorBoundary 
        {...errorBoundaryProps}
        fallback={errorBoundaryProps.fallback || defaultFallback}
        onError={(error, errorInfo) => {
          console.error(`Error in ${WrappedComponent.displayName || WrappedComponent.name}:`, error);
          if (errorBoundaryProps.onError) {
            errorBoundaryProps.onError(error, errorInfo);
          }
        }}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
};

export default withErrorBoundary;