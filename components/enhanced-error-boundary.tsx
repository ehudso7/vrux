import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { monitoring } from '../lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  customErrorMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsExpanded: boolean;
  errorId: string;
  isReporting: boolean;
  reportSent: boolean;
  copied: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsExpanded: false,
      errorId: '',
      isReporting: false,
      reportSent: false,
      copied: false,
    };
  }

  componentDidMount() {
    // Set up global error handler
    const unsubscribe = monitoring.onError((errorMetric) => {
      console.error('Global error captured:', errorMetric);
    });

    // Cleanup on unmount
    (this as unknown as { unsubscribe: () => void }).unsubscribe = unsubscribe;
  }

  componentWillUnmount() {
    const self = this as unknown as { unsubscribe?: () => void };
    if (self.unsubscribe) {
      self.unsubscribe();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      isDetailsExpanded: false,
      errorId,
      reportSent: false,
      copied: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Record error in monitoring system
    monitoring.recordError({
      error,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        timestamp: new Date().toISOString(),
      },
      severity: 'critical',
      timestamp: new Date(),
    });
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsExpanded: false,
      errorId: '',
      isReporting: false,
      reportSent: false,
      copied: false,
    });
    
    // Record recovery interaction
    monitoring.recordInteraction({
      action: 'error_boundary_reset',
      component: 'ErrorBoundary',
      timestamp: new Date(),
      metadata: { errorId: this.state.errorId },
    });
  };

  handleCopyError = async () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
`;
    
    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  handleReportError = async () => {
    this.setState({ isReporting: true });
    
    try {
      // In production, this would send to an error reporting service
      const response = await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          error: {
            message: this.state.error?.message,
            stack: this.state.error?.stack,
          },
          errorInfo: {
            componentStack: this.state.errorInfo?.componentStack,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        this.setState({ reportSent: true });
        monitoring.recordInteraction({
          action: 'error_reported',
          component: 'ErrorBoundary',
          timestamp: new Date(),
          metadata: { errorId: this.state.errorId },
        });
      }
    } catch (err) {
      console.error('Failed to report error:', err);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8" />
                    <div>
                      <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
                      <p className="text-sm text-white/80 mt-1">Error ID: {this.state.errorId}</p>
                    </div>
                  </div>
                  {isDevelopment && (
                    <button
                      onClick={this.handleCopyError}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Copy error details"
                    >
                      {this.state.copied ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {this.props.customErrorMessage || 
                    "We apologize for the inconvenience. The application encountered an unexpected error. Our team has been notified and is working to fix this issue."}
                </p>

                {/* Error Preview (Development only) */}
                {isDevelopment && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm font-mono text-red-700 dark:text-red-400">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </motion.button>

                  {this.props.showReportButton !== false && !this.state.reportSent && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={this.handleReportError}
                      disabled={this.state.isReporting}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {this.state.isReporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Reporting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Report Issue
                        </>
                      )}
                    </motion.button>
                  )}

                  {this.state.reportSent && (
                    <div className="flex items-center gap-2 px-4 py-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Report sent successfully
                    </div>
                  )}

                  <button
                    onClick={() => this.setState({ isDetailsExpanded: !this.state.isDetailsExpanded })}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-auto"
                  >
                    {this.state.isDetailsExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {isDevelopment ? 'Show Details' : 'Error Info'}
                      </>
                    )}
                  </button>
                </div>

                {/* Error Details */}
                <AnimatePresence>
                  {this.state.isDetailsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6"
                    >
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                        {/* Error ID and Timestamp */}
                        <div className="mb-4 pb-4 border-b border-gray-300 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Error ID:</span>
                              <p className="font-mono text-xs mt-1">{this.state.errorId}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                              <p className="font-mono text-xs mt-1">{new Date().toISOString()}</p>
                            </div>
                          </div>
                        </div>

                        {isDevelopment && (
                          <>
                            {this.state.error && (
                              <>
                                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                                  Error Message:
                                </h3>
                                <p className="text-sm font-mono mb-4 text-gray-700 dark:text-gray-300">
                                  {this.state.error.toString()}
                                </p>
                              </>
                            )}

                            {this.state.error?.stack && (
                              <>
                                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                                  Stack Trace:
                                </h3>
                                <pre className="text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  {this.state.error.stack}
                                </pre>
                              </>
                            )}

                            {this.state.errorInfo?.componentStack && (
                              <>
                                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 mt-4">
                                  Component Stack:
                                </h3>
                                <pre className="text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  {this.state.errorInfo.componentStack}
                                </pre>
                              </>
                            )}
                          </>
                        )}

                        {!isDevelopment && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Please reference this error ID when contacting support:
                            </p>
                            <code className="text-lg font-mono bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded">
                              {this.state.errorId}
                            </code>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling with monitoring
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      monitoring.recordError({
        error,
        context: { hook: 'useErrorHandler' },
        severity: 'high',
        timestamp: new Date(),
      });
      throw error;
    }
  }, [error]);

  const handleError = (error: Error, context?: Record<string, unknown>) => {
    monitoring.recordError({
      error,
      context: { ...context, handler: 'manual' },
      severity: 'medium',
      timestamp: new Date(),
    });
    setError(error);
  };

  return { handleError, throwError: setError };
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'unhandledRejection' }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [handleError]);

  return <>{children}</>;
}