import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Target, Users, Lightbulb, Rocket,
  Heart, Shield, ArrowRight
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const values = [
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: 'Innovation First',
    description: 'We push the boundaries of what\'s possible with AI and design, constantly evolving our technology.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Developer Focused',
    description: 'Every decision we make starts with how it impacts developers and their productivity.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Trust & Security',
    description: 'We prioritize the security and privacy of our users\' data with enterprise-grade protection.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Community Driven',
    description: 'Our community shapes our product. We listen, learn, and build together.',
  },
];

const team = [
  {
    name: 'Sarah Chen',
    role: 'Co-founder & CEO',
    bio: 'Former Google AI researcher with a passion for democratizing development.',
    image: '/team/sarah.jpg',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Co-founder & CTO',
    bio: 'Full-stack architect who believes in the power of AI-augmented development.',
    image: '/team/michael.jpg',
  },
  {
    name: 'Emma Johnson',
    role: 'Head of Design',
    bio: 'Design systems expert focused on creating beautiful, accessible components.',
    image: '/team/emma.jpg',
  },
  {
    name: 'David Kim',
    role: 'Head of Engineering',
    bio: 'Distributed systems engineer building the infrastructure for scale.',
    image: '/team/david.jpg',
  },
];

const milestones = [
  {
    date: 'January 2023',
    title: 'VRUX Founded',
    description: 'Started with a vision to revolutionize UI development.',
  },
  {
    date: 'June 2023',
    title: 'First Beta Launch',
    description: 'Released to 100 beta testers with overwhelming positive feedback.',
  },
  {
    date: 'September 2023',
    title: 'Public Launch',
    description: 'Opened VRUX to the world with 10,000 signups in the first week.',
  },
  {
    date: 'December 2023',
    title: '1M Components Generated',
    description: 'Reached our first million components milestone.',
  },
  {
    date: 'March 2024',
    title: 'Series A Funding',
    description: 'Raised $15M to accelerate product development and growth.',
  },
];

export default function AboutPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>About - VRUX | Our Mission and Story</title>
        <meta name="description" content="Learn about VRUX\'s mission to revolutionize UI development with AI. Meet our team and discover our journey." />
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
              
              <button
                onClick={() => router.push('/signin')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                Get Started
              </button>
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
                Building the Future of
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  UI Development
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                We believe that every developer should have access to AI-powered tools that make building beautiful, 
                accessible interfaces faster and more enjoyable than ever before.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  VRUX was born from a simple observation: developers spend too much time building UI components 
                  from scratch. We saw an opportunity to leverage AI to dramatically accelerate this process while 
                  maintaining the quality and customization developers need.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Our mission is to empower every developer with AI tools that enhance creativity, not replace it. 
                  We&apos;re building a future where developers can focus on solving problems and creating value, 
                  while AI handles the repetitive aspects of UI development.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <Rocket className="w-32 h-32 text-purple-600/20" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`text-center p-6 rounded-2xl ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                The passionate people building VRUX
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-purple-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Key milestones in the VRUX story
              </p>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.date}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex items-start gap-6 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 text-${index % 2 === 0 ? 'right' : 'left'}`}>
                    <div className={`inline-block p-4 rounded-xl ${
                      darkMode ? 'bg-gray-900' : 'bg-gray-50'
                    }`}>
                      <p className="text-sm text-purple-600 font-medium mb-1">{milestone.date}</p>
                      <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-purple-600 rounded-full mt-6 flex-shrink-0" />
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Join Us on Our Mission
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Whether you&apos;re a developer, designer, or just excited about the future of UI development, 
                we&apos;d love to have you along for the journey.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/careers')}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium shadow-2xl shadow-black/25 hover:shadow-black/30 transition-all flex items-center gap-3"
                >
                  View Open Positions
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/community')}
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  Join Our Community
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}