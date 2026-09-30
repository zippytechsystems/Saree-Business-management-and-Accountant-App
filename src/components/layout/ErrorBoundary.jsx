import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application Error Caught by Boundary]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <div className="error-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div className="card-icon icon-red" style={{ width: '48px', height: '48px' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button className="btn-primary" onClick={this.handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
