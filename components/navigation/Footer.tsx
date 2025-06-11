import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  darkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ darkMode = false }) => {
  return (
    <footer className={`py-12 ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'} border-t`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/features"><a className="hover:text-purple-600">Features</a></Link></li>
              <li><Link href="/pricing"><a className="hover:text-purple-600">Pricing</a></Link></li>
              <li><Link href="/templates"><a className="hover:text-purple-600">Templates</a></Link></li>
              <li><Link href="/examples"><a className="hover:text-purple-600">Examples</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/documentation"><a className="hover:text-purple-600">Documentation</a></Link></li>
              <li><Link href="/api-reference"><a className="hover:text-purple-600">API Reference</a></Link></li>
              <li><Link href="/blog"><a className="hover:text-purple-600">Blog</a></Link></li>
              <li><Link href="/community"><a className="hover:text-purple-600">Community</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/about"><a className="hover:text-purple-600">About</a></Link></li>
              <li><Link href="/privacy"><a className="hover:text-purple-600">Privacy</a></Link></li>
              <li><Link href="/terms"><a className="hover:text-purple-600">Terms</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-purple-600">Contact</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-4 mb-6">
              <a href="https://twitter.com/vrux" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com/vrux" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/vrux" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:hello@vrux.dev" className="text-gray-600 hover:text-purple-600">
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Subscribe to our newsletter for updates
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 VRUX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};