import { ReactNode } from 'react';
import Sidebar from '../Sidebar';

interface GeneratorLayoutProps {
  children: ReactNode;
}

export default function GeneratorLayout({ children }: GeneratorLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
