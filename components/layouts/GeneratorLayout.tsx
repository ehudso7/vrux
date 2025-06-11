import { ReactNode } from 'react';
import Sidebar from '../Sidebar';

interface GeneratorLayoutProps {
  children: ReactNode;
}

export default function GeneratorLayout({ children }: GeneratorLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden lg:ml-0">
        <div className="h-full pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
