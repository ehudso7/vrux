import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Diagnostic() {
  const [errors, setErrors] = useState<string[]>([]);
  const [apiTest, setApiTest] = useState<{ success: boolean; data?: Record<string, unknown>; error?: string } | null>(null);

  useEffect(() => {
    // Catch any client-side errors
    window.onerror = (msg, url, lineNo, columnNo) => {
      setErrors(prev => [...prev, `Error: ${msg} at ${url}:${lineNo}:${columnNo}`]);
      return true;
    };

    // Test API endpoint
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiTest({ success: true, data }))
      .catch(err => setApiTest({ success: false, error: err.message }));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">VRUX Diagnostic Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment</h2>
          <pre className="text-sm">{JSON.stringify({
            nodeEnv: process.env.NODE_ENV,
            browser: typeof window !== 'undefined',
            nextVersion: process.env.NEXT_RUNTIME ? 'Edge Runtime' : 'Node.js Runtime'
          }, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Client-Side Errors</h2>
          {errors.length === 0 ? (
            <p className="text-green-600">No client-side errors detected</p>
          ) : (
            <ul className="text-red-600">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Test (/api/health)</h2>
          {apiTest === null ? (
            <p>Testing API...</p>
          ) : apiTest.success ? (
            <pre className="text-green-600 text-sm">{JSON.stringify(apiTest.data, null, 2)}</pre>
          ) : (
            <p className="text-red-600">API Error: {apiTest.error}</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Page Links</h2>
          <ul className="space-y-2">
            <li><Link href="/"><a className="text-blue-600 hover:underline">Home (Complex)</a></Link></li>
            <li><Link href="/index-safe"><a className="text-blue-600 hover:underline">Home (Safe)</a></Link></li>
            <li><Link href="/generate"><a className="text-blue-600 hover:underline">Generate Page</a></Link></li>
            <li><Link href="/test"><a className="text-blue-600 hover:underline">Test Page</a></Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}