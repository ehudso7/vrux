import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../globals.css';
import '../styles/index.css';
import PageLoading from '../components/page-loading';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../lib/auth-context';
import { ErrorBoundary } from '../components/error-boundary';
import { ThemeProvider } from '../components/theme-provider';
 
export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize monitoring in browser for client-side tracking
    if (typeof window !== 'undefined') {
      // Client-side telemetry initialization would go here
      console.log('VRUX monitoring initialized');
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PageLoading />
          <Component {...pageProps} />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 