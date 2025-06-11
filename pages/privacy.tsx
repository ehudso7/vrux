import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Lock, Eye, Database, Globe, Mail, FileText } from 'lucide-react';
import { Footer } from '../components/navigation/Footer';

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    icon: <Database className="w-5 h-5" />,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: 'data-security',
    title: 'Data Security',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    id: 'third-parties',
    title: 'Third Parties',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: <Mail className="w-5 h-5" />,
  },
];

export default function PrivacyPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>Privacy Policy - VRUX</title>
        <meta name="description" content="VRUX Privacy Policy - Learn how we collect, use, and protect your data." />
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
              <h2 className="text-lg font-semibold mb-4">Privacy Policy</h2>
              
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
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
                  Last updated: January 15, 2024
                </p>

                {/* Overview */}
                <section id="overview" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    At VRUX, we take your privacy seriously. This Privacy Policy explains how we collect, 
                    use, disclose, and safeguard your information when you use our AI component generation 
                    service. Please read this privacy policy carefully.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    By using VRUX, you agree to the collection and use of information in accordance with 
                    this policy. If you do not agree with the terms of this privacy policy, please do not 
                    access the service.
                  </p>
                </section>

                {/* Information We Collect */}
                <section id="information-we-collect" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                  
                  <h3 className="text-lg font-medium mb-3">Personal Information</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We collect information you provide directly to us, such as:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                    <li>Name and email address when you create an account</li>
                    <li>Payment information when you subscribe to our services</li>
                    <li>Profile information you choose to provide</li>
                    <li>Communications you send to us</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">Usage Information</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We automatically collect certain information when you use VRUX:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                    <li>Log data (IP address, browser type, operating system)</li>
                    <li>Usage patterns and preferences</li>
                    <li>Component generation history and prompts</li>
                    <li>Performance and error data</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">Cookies and Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We use cookies and similar tracking technologies to track activity on our service and 
                    hold certain information. You can instruct your browser to refuse all cookies or to 
                    indicate when a cookie is being sent.
                  </p>
                </section>

                {/* How We Use Your Information */}
                <section id="how-we-use" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We use the information we collect for various purposes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>To provide and maintain our service</li>
                    <li>To improve and personalize your experience</li>
                    <li>To process your transactions and manage your subscriptions</li>
                    <li>To communicate with you about updates, security alerts, and support</li>
                    <li>To monitor and analyze usage patterns and trends</li>
                    <li>To detect, prevent, and address technical issues</li>
                    <li>To comply with legal obligations</li>
                  </ul>
                </section>

                {/* Data Security */}
                <section id="data-security" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We implement appropriate technical and organizational security measures to protect your 
                    personal information against accidental or unlawful destruction, loss, alteration, or 
                    unauthorized disclosure or access.
                  </p>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} mb-6`}>
                    <h3 className="font-medium mb-3">Our Security Measures Include:</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Encryption of data in transit and at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Regular security assessments and audits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Access controls and authentication measures</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>Employee training on data protection</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Third Parties */}
                <section id="third-parties" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Third Parties</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    We may share your information with third parties in certain circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                    <li>Service providers who assist in our operations</li>
                    <li>Analytics providers to help us understand usage</li>
                    <li>Payment processors for handling transactions</li>
                    <li>Law enforcement when required by law</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We do not sell, trade, or otherwise transfer your personal information to third parties 
                    for their marketing purposes.
                  </p>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    You have certain rights regarding your personal information:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: 'Access', description: 'Request access to your personal data' },
                      { title: 'Correction', description: 'Request correction of inaccurate data' },
                      { title: 'Deletion', description: 'Request deletion of your data' },
                      { title: 'Portability', description: 'Request transfer of your data' },
                      { title: 'Objection', description: 'Object to certain processing' },
                      { title: 'Restriction', description: 'Request processing restrictions' },
                    ].map((right) => (
                      <div
                        key={right.title}
                        className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
                      >
                        <h3 className="font-medium mb-1">{right.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {right.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please 
                    contact us at:
                  </p>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <p className="font-medium mb-2">VRUX Privacy Team</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Email: privacy@vrux.dev<br />
                      Address: 123 Tech Street, San Francisco, CA 94105<br />
                      Phone: +1 (555) 123-4567
                    </p>
                  </div>
                </section>

                {/* Updates */}
                <section className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">Updates to This Policy</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    We may update our Privacy Policy from time to time. We will notify you of any changes 
                    by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. 
                    You are advised to review this Privacy Policy periodically for any changes.
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