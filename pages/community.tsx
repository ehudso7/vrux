import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, MessageSquare, Github, Twitter, Youtube,
  Users, Calendar, Video, Award, Heart,
  ExternalLink, ArrowRight, Star, Code2
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const communityStats = [
  { label: 'Active Developers', value: '15,000+', icon: <Users className="w-5 h-5" /> },
  { label: 'Components Generated', value: '1M+', icon: <Code2 className="w-5 h-5" /> },
  { label: 'GitHub Stars', value: '12.5k', icon: <Star className="w-5 h-5" /> },
  { label: 'Contributors', value: '200+', icon: <Heart className="w-5 h-5" /> },
];

const upcomingEvents = [
  {
    title: 'VRUX Community Meetup',
    date: 'January 25, 2024',
    time: '6:00 PM PST',
    type: 'Virtual',
    description: 'Join us for our monthly community meetup to discuss new features and share projects.',
  },
  {
    title: 'AI Component Workshop',
    date: 'February 5, 2024',
    time: '2:00 PM EST',
    type: 'Workshop',
    description: 'Learn advanced techniques for crafting perfect prompts and building complex components.',
  },
  {
    title: 'Hackathon: Build with VRUX',
    date: 'February 15-17, 2024',
    time: '48 Hours',
    type: 'Competition',
    description: 'Compete for prizes by building innovative applications using VRUX.',
  },
];

const featuredProjects = [
  {
    title: 'E-commerce Dashboard',
    author: 'Sarah Johnson',
    description: 'A complete e-commerce admin dashboard built entirely with VRUX components.',
    stars: 234,
    image: '/community/project1.png',
  },
  {
    title: 'Social Media Kit',
    author: 'Alex Chen',
    description: 'Collection of social media components for modern web applications.',
    stars: 189,
    image: '/community/project2.png',
  },
  {
    title: 'Finance Tracker',
    author: 'Maria Garcia',
    description: 'Personal finance tracking app with beautiful charts and analytics.',
    stars: 156,
    image: '/community/project3.png',
  },
];

const resources = [
  {
    title: 'Discord Server',
    description: 'Join 5,000+ developers in our active Discord community.',
    icon: <MessageSquare className="w-6 h-6" />,
    link: 'https://discord.gg/vrux',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'GitHub Discussions',
    description: 'Ask questions, share ideas, and collaborate on GitHub.',
    icon: <Github className="w-6 h-6" />,
    link: 'https://github.com/vrux/discussions',
    color: 'from-gray-700 to-gray-900',
  },
  {
    title: 'YouTube Channel',
    description: 'Watch tutorials, tips, and community showcases.',
    icon: <Youtube className="w-6 h-6" />,
    link: 'https://youtube.com/@vrux',
    color: 'from-red-500 to-pink-600',
  },
  {
    title: 'Twitter/X',
    description: 'Follow us for updates, tips, and community highlights.',
    icon: <Twitter className="w-6 h-6" />,
    link: 'https://twitter.com/vrux_dev',
    color: 'from-blue-400 to-blue-600',
  },
];

export default function CommunityPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>Community - VRUX | Join Our Developer Community</title>
        <meta name="description" content="Join the VRUX community. Connect with thousands of developers, share projects, and learn together." />
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
                onClick={() => window.open('https://discord.gg/vrux', '_blank')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                Join Community
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
                Welcome to the
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VRUX Community
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of developers building the future of UI development together.
                Share, learn, and grow with our vibrant community.
              </p>
              
              {/* Community Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {communityStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl ${
                      darkMode ? 'bg-gray-900' : 'bg-white'
                    } shadow-lg`}
                  >
                    <div className="text-purple-600 mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Resources */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Connect & Collaborate</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Choose your favorite platform to engage with the community
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource, index) => (
                <motion.a
                  key={resource.title}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative p-6 rounded-2xl ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${resource.color} rounded-xl flex items-center justify-center mb-4 text-white`}>
                    {resource.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {resource.description}
                  </p>
                  <div className="flex items-center text-purple-600 font-medium">
                    Join Now
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured Community Projects</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Amazing projects built by our community members
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group rounded-xl overflow-hidden ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  } shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Award className="w-12 h-12 text-purple-600/20" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        by {project.author}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{project.stars}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/showcase')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                View All Projects
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Upcoming Events</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Join us for workshops, meetups, and hackathons
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      event.type === 'Virtual' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : event.type === 'Workshop'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {event.type}
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Video className="w-4 h-4" />
                      {event.time}
                    </div>
                  </div>

                  <button className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Register
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Join Our Community?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Connect with developers, share your projects, and help shape the future of VRUX.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => window.open('https://discord.gg/vrux', '_blank')}
                  className="px-8 py-4 bg-[#5865F2] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  Join Discord Server
                </button>
                
                <button
                  onClick={() => window.open('https://github.com/vrux', '_blank')}
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-all flex items-center gap-3"
                >
                  <Github className="w-5 h-5" />
                  Contribute on GitHub
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}