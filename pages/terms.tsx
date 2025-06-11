import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Scale, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Footer } from '../components/navigation/Footer';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    id: 'service-description',
    title: 'Service Description',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'user-accounts',
    title: 'User Accounts',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'payment-terms',
    title: 'Payment Terms',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    id: 'termination',
    title: 'Termination',
    icon: <XCircle className="w-5 h-5" />,
  },
];

export default function TermsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('acceptance');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>Terms of Service - VRUX</title>
        <meta name="description" content="VRUX Terms of Service - Read our terms and conditions for using VRUX services." />
      </Head>

      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
        {/* Navigation */}
        <nav className={`border-b ${darkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <a className="flex items-center gap-2 group">
                  <div className={`w-9 h-9 ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight">VRUX</span>
                </a>
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`w-64 min-h-screen border-r ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
          } sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden md:block`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Terms of Service</h2>
              
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-sm ${
                      activeSection === section.id
                        ? darkMode
                          ? 'bg-gray-800 text-white'
                          : 'bg-white shadow-sm'
                        : darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-8 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
                  Effective Date: January 15, 2024
                </p>

                {/* Acceptance of Terms */}
                <section id="acceptance" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    By accessing or using VRUX (&quot;Service&quot;), you agree to be bound by these Terms of Service 
                    (&quot;Terms&quot;). If you disagree with any part of these terms, then you may not access the Service.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    These Terms apply to all visitors, users, and others who access or use the Service. By 
                    using the Service, you represent that you are at least 18 years old or have parental consent.
                  </p>
                </section>

                {/* Service Description */}
                <section id="service-description" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    VRUX provides an AI-powered component generation service that allows users to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                    <li>Generate UI components using natural language prompts</li>
                    <li>Access pre-built component templates</li>
                    <li>Customize and export generated code</li>
                    <li>Share components with team members</li>
                    <li>Access API endpoints for programmatic generation</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue any part of the Service at any 
                    time without prior notice.
                  </p>
                </section>

                {/* User Accounts */}
                <section id="user-accounts" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} mb-6`}>
                    <h3 className="font-medium mb-3">Account Responsibilities:</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li>• You are responsible for maintaining the confidentiality of your account</li>
                      <li>• You must provide accurate and complete information</li>
                      <li>• You are responsible for all activities under your account</li>
                      <li>• You must notify us immediately of any unauthorized use</li>
                      <li>• One person or legal entity may maintain no more than one free account</li>
                    </ul>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We reserve the right to refuse service, terminate accounts, or remove content at our 
                    sole discretion.
                  </p>
                </section>

                {/* Acceptable Use */}
                <section id="acceptable-use" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    You agree not to use the Service to:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {[
                      'Generate illegal or harmful content',
                      'Violate intellectual property rights',
                      'Distribute malware or malicious code',
                      'Attempt to gain unauthorized access',
                      'Interfere with service operations',
                      'Violate any applicable laws',
                      'Harass or harm other users',
                      'Engage in automated excessive use',
                    ].map((item) => (
                      <div
                        key={item}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-start gap-2`}
                      >
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual-property" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>
                  
                  <h3 className="text-lg font-medium mb-3">Your Content</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    You retain all rights to the content you create using VRUX. By using the Service, you 
                    grant us a limited license to process your prompts and display generated content solely 
                    for the purpose of providing the Service.
                  </p>

                  <h3 className="text-lg font-medium mb-3">Generated Content</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Components generated by VRUX are provided to you under a permissive license. You are 
                    free to use, modify, and distribute the generated code in your projects, including 
                    commercial projects.
                  </p>

                  <h3 className="text-lg font-medium mb-3">VRUX Property</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    The Service, including its original content, features, and functionality, is owned by 
                    VRUX and is protected by international copyright, trademark, and other intellectual 
                    property laws.
                  </p>
                </section>

                {/* Payment Terms */}
                <section id="payment-terms" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} mb-6`}>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Subscription fees are billed in advance on a monthly or annual basis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>All fees are non-refundable unless required by law</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Prices may change with 30 days notice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Failed payments may result in service suspension</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section id="limitation-liability" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
                  <div className={`p-6 rounded-xl border-2 border-amber-500/20 ${
                    darkMode ? 'bg-amber-900/10' : 'bg-amber-50'
                  } mb-6`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VRUX SHALL NOT BE LIABLE FOR ANY 
                          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY 
                          LOSS OF PROFITS OR REVENUES.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. 
                    We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                  </p>
                </section>

                {/* Termination */}
                <section id="termination" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We may terminate or suspend your account immediately, without prior notice or liability, 
                    for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Upon termination, your right to use the Service will cease immediately. All provisions 
                    of the Terms which by their nature should survive termination shall survive termination.
                  </p>
                </section>

                {/* General */}
                <section className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">General Provisions</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <li>• These Terms are governed by the laws of California, USA</li>
                    <li>• Changes to Terms will be notified via email or Service announcement</li>
                    <li>• If any provision is found unenforceable, the remaining provisions continue</li>
                    <li>• Our failure to enforce any right is not a waiver of that right</li>
                    <li>• You may not assign your rights under these Terms without our consent</li>
                  </ul>
                </section>

                {/* Contact */}
                <section className="mt-12">
                  <h3 className="font-medium mb-3">Questions?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    If you have any questions about these Terms, please contact us at{' '}
                    <a href="mailto:legal@vrux.dev" className="text-purple-600 hover:text-purple-700">
                      legal@vrux.dev
                    </a>
                  </p>
                </section>
              </motion.div>
            </div>
          </main>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}