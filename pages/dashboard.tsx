import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Code2, 
  Zap, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Clock,
  TrendingUp,
  FileCode,
  CreditCard,
  Activity,
  Cpu,
  Trophy,
  Target,
  Award,
  ChevronRight,
  Flame,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Palette,
  Layout,
  Component,
  Layers,
  Globe,
  Users,
  Calendar,
  Download,
  Upload,
  BookOpen,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import confetti from 'canvas-confetti';

// Mock data for charts
const generateActivityData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: Math.floor(Math.random() * 50) + 10
  }));
};

const generateComponentStats = () => {
  return [
    { type: 'Forms', count: 42, color: 'from-blue-500 to-blue-600' },
    { type: 'Cards', count: 38, color: 'from-purple-500 to-purple-600' },
    { type: 'Navigation', count: 24, color: 'from-pink-500 to-pink-600' },
    { type: 'Modals', count: 16, color: 'from-indigo-500 to-indigo-600' }
  ];
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [activityData] = useState(generateActivityData());
  const [componentStats] = useState(generateComponentStats());
  const [streak, setStreak] = useState(7);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  useEffect(() => {
    // Show welcome animation for first-time visitors
    const hasVisited = localStorage.getItem('dashboard-visited');
    if (!hasVisited && user) {
      localStorage.setItem('dashboard-visited', 'true');
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#8b5cf6']
        });
      }, 500);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const usagePercentage = (user.apiCalls / user.maxApiCalls) * 100;
  const maxActivityValue = Math.max(...activityData.map(d => d.value));

  return (
    <>
      <Head>
        <title>Dashboard - VRUX | Your AI Component Hub</title>
        <meta name="description" content="Manage your AI-powered component generation with VRUX" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        {/* Enhanced Navigation */}
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 group">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25"
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">VRUX</span>
                </Link>
                
                <div className="hidden md:flex items-center gap-1">
                  <Link href="/dashboard" className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300">
                    Dashboard
                  </Link>
                  <Link href="/generate" className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Generate
                  </Link>
                  <Link href="/templates" className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Templates
                  </Link>
                  <Link href="/docs" className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Docs
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl"
                >
                  <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{streak} day streak!</span>
                </motion.div>
                
                <Link href="/settings" className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Settings className="w-5 h-5" />
                </Link>
                <button 
                  onClick={signOut}
                  className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section with Animation */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 relative"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
                    <p className="text-white/90 mb-4">
                      You're on fire! Keep building amazing components with AI.
                    </p>
                    <div className="flex items-center gap-4">
                      <Link href="/generate">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-medium hover:shadow-xl transition-all flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Create New Component
                        </motion.button>
                      </Link>
                      <button
                        onClick={() => setShowWelcome(false)}
                        className="text-white/70 hover:text-white text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-2xl"
                  />
                  <motion.div
                    animate={{
                      y: [0, 20, 0],
                      rotate: [360, 180, 0],
                    }}
                    transition={{
                      duration: 25,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    className="absolute bottom-8 right-32 w-24 h-24 bg-white/10 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/generate">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">New Component</h3>
                  <p className="text-white/80 text-sm">Generate with AI magic</p>
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'linear',
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  }}
                />
              </motion.div>
            </Link>

            <Link href="/templates">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Templates</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">200+ ready to use</p>
                <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Browse library
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            </Link>

            <Link href="/pricing">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Upgrade Plan</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Unlock full power</p>
                <div className="mt-3 flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                  View plans
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            </Link>

            <Link href="/docs">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Learn & Explore</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Guides & tutorials</p>
                <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                  Start learning
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Stats Grid with Enhanced Design */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Usage Stats */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">API Usage</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This billing period</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {user.apiCalls}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">/ {user.maxApiCalls}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {user.maxApiCalls - user.apiCalls} remaining
                </span>
                <span className={`font-medium ${usagePercentage > 80 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.round(100 - usagePercentage)}% left
                </span>
              </div>
            </motion.div>

            {/* Plan Info */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monthly subscription</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold capitalize bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {user.plan}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {user.plan === 'free' ? '100 generations/month' : 'Unlimited generations'}
                  </span>
                </div>
                {user.plan === 'free' && (
                  <Link href="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700">
                    Upgrade for more
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Achievement Stats */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Achievements</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Keep it up!</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Star, label: 'Quality', value: '98%' },
                  { icon: Cpu, label: 'Speed', value: '2.3s' },
                  { icon: Users, label: 'Shares', value: '42' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Activity and Component Stats */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Activity Chart */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-lg">Weekly Activity</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Components generated</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    23%
                  </span>
                  <span className="text-gray-500">vs last week</span>
                </div>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-2">
                {activityData.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.value / maxActivityValue) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg relative group cursor-pointer">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.value}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Component Types Stats */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-lg">Component Types</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your favorites</p>
                </div>
                <Link href="/generate" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {componentStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.type}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{stat.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${stat.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.count / 50) * 100}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Creations */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Recent Creations</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your latest components</p>
              </div>
              <Link href="/generate" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View history
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="text-center py-16">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Component className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No components yet</p>
              <Link href="/generate">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Component
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}