import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { EnhancedGenerationInterface } from '../components/enhanced-generation-interface';
import GeneratorLayout from '../components/layouts/GeneratorLayout';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function GenerateEnhanced() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showViewComfy, setShowViewComfy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleGenerate = (code: string, variant: number) => {
    toast.success(`Variant ${variant + 1} generated successfully!`);
  };

  return (
    <>
      <Head>
        <title>Enhanced Generate - VRUX</title>
        <meta name="description" content="Generate UI components with real-time AI streaming" />
      </Head>

      <GeneratorLayout>
        <div className="flex-1 flex flex-col h-screen">
          <EnhancedGenerationInterface 
            onGenerate={handleGenerate}
            initialPrompt=""
          />
        </div>
      </GeneratorLayout>
    </>
  );
}