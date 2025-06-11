import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Mail, MessageSquare, Phone, MapPin,
  Send, Github, Twitter, Linkedin, Clock, CheckCircle
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import toast from 'react-hot-toast';

const contactMethods = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email',
    description: 'Send us an email for detailed inquiries',
    contact: 'hello@vrux.dev',
    action: 'mailto:hello@vrux.dev',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available 9AM-6PM PST',
    action: '#',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Phone',
    description: 'Call us for urgent matters',
    contact: '+1 (555) 123-4567',
    action: 'tel:+15551234567',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Office',
    description: 'Visit us at our headquarters',
    contact: 'San Francisco, CA',
    action: '#',
    color: 'from-orange-500 to-orange-600',
  },
];

const socialLinks = [
  { name: 'GitHub', icon: <Github className="w-5 h-5" />, href: 'https://github.com/vrux' },
  { name: 'Twitter', icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com/vrux_dev' },
  { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com/company/vrux' },
];

export default function ContactPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('Message sent successfully! We\'ll get back to you soon.', {
      duration: 5000,
      icon: '✉️',
    });

    setSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after delay
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Head>
        <title>Contact - VRUX | Get in Touch</title>
        <meta name="description" content="Contact the VRUX team. We're here to help with any questions about our AI component generator." />
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

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Let&apos;s Talk
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Have a question or feedback? We&apos;d love to hear from you. Choose your preferred way to reach us.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.title}
                  href={method.action}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group p-6 rounded-2xl ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {method.description}
                  </p>
                  <p className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
                    {method.contact}
                  </p>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg outline-none transition-all ${
                          darkMode 
                            ? 'bg-gray-900 border border-gray-800 focus:border-purple-500' 
                            : 'bg-gray-50 border border-gray-200 focus:border-purple-500'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg outline-none transition-all ${
                          darkMode 
                            ? 'bg-gray-900 border border-gray-800 focus:border-purple-500' 
                            : 'bg-gray-50 border border-gray-200 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 rounded-lg outline-none transition-all ${
                        darkMode 
                          ? 'bg-gray-900 border border-gray-800 focus:border-purple-500' 
                          : 'bg-gray-50 border border-gray-200 focus:border-purple-500'
                      }`}
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales Question</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className={`w-full px-4 py-2 rounded-lg outline-none transition-all resize-none ${
                        darkMode 
                          ? 'bg-gray-900 border border-gray-800 focus:border-purple-500' 
                          : 'bg-gray-50 border border-gray-200 focus:border-purple-500'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || submitted}
                    className={`w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                      (isSubmitting || submitted) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitted ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Message Sent!
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Office Hours</h3>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium mb-2">Support Hours</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                          Saturday - Sunday: 10:00 AM - 4:00 PM PST
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Response time: Within 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">FAQs</h3>
                  <div className="space-y-4">
                    {[
                      {
                        q: 'How quickly can I expect a response?',
                        a: 'We typically respond within 24 hours during business days.',
                      },
                      {
                        q: 'Do you offer phone support?',
                        a: 'Phone support is available for Pro and Enterprise customers.',
                      },
                      {
                        q: 'Can I schedule a demo?',
                        a: 'Yes! Select "Sales Question" in the form to request a demo.',
                      },
                    ].map((faq, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
                      >
                        <p className="font-medium mb-1">{faq.q}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Connect on Social</h3>
                  <div className="flex items-center gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-lg ${
                          darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                        } transition-colors`}
                        aria-label={social.name}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Visit Our Office</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                We&apos;re located in the heart of San Francisco
              </p>
            </div>
            
            <div className={`rounded-2xl overflow-hidden shadow-xl h-96 ${
              darkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              {/* In production, this would be an actual map */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <p className="font-semibold">VRUX Headquarters</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    123 Tech Street<br />
                    San Francisco, CA 94105<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}