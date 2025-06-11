import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import TemplateLibrary from '../components/template-library';
import { Template } from '../lib/template-store';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';

const Templates: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [darkMode] = useState(false);

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

  const handleSelectTemplate = (template: Template) => {
    // Navigate to the generate page with the template code
    const params = new URLSearchParams({
      template: template.id,
      code: template.code,
      prompt: `Using ${template.name} template`
    });
    
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <>
      <Head>
        <title>Template Library - VRUX</title>
        <meta name="description" content="Browse and use professional UI component templates" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="bottom-center" />
      
      <div className={darkMode ? 'dark' : ''}>
        <TemplateLibrary 
          onSelectTemplate={handleSelectTemplate}
          darkMode={darkMode}
        />
      </div>
    </>
  );
};

export default Templates;