import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { OperationsDashboard } from '../components/operations-dashboard';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function OperationsPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Operations Dashboard - VRUX</title>
        <meta name="description" content="Real-time operations monitoring and system observability" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <OperationsDashboard />
        </div>
      </div>
    </>
  );
}