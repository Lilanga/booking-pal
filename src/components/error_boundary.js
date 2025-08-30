import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
    this.maxRetries = props.maxRetries || 2;
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service if available
    if (this.props.onError && typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (reportingError) {
        console.error('Error reporting failed:', reportingError);
      }
    }
  }

  handleRetry() {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo,
          this.handleRetry,
          this.state.retryCount < this.maxRetries
        );
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred. Please try refreshing the application.</p>
            
            {this.state.retryCount < this.maxRetries && (
              <button 
                onClick={this.handleRetry}
                className="error-retry-button"
                type="button"
              >
                Try Again ({this.maxRetries - this.state.retryCount} attempts remaining)
              </button>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <pre>{this.state.error?.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  maxRetries: PropTypes.number
};

ErrorBoundary.defaultProps = {
  maxRetries: 2
};

export default ErrorBoundary;