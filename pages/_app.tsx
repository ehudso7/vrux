import type { AppProps } from 'next/app';
import '../globals.css';
import PageLoading from '../components/page-loading';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../lib/auth-context';
 
export default function App({ Component, pageProps }: AppProps) {
  return (
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
  );
} 