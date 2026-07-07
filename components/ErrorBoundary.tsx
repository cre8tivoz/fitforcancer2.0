import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8 gap-6">
          <div className="text-center space-y-4 max-w-lg">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-white/70 text-sm">
              We're sorry for the inconvenience. Please try refreshing the page. If the problem persists, contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-neon-blue text-neon-dark font-bold rounded-full hover:bg-neon-blue/90 transition-shadow transition-transform transition-colors"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-4 text-xs bg-white/10 p-4 rounded-lg overflow-auto text-left text-rose-300">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
