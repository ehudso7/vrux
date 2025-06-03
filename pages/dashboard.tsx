import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  CreditCard
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const usagePercentage = (user.apiCalls / user.maxApiCalls) * 100;

  return (
    <>
      <Head>
        <title>Dashboard - VRUX</title>
        <meta name="description" content="Your VRUX dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl">VRUX</span>
                </Link>
                
                <div className="hidden md:flex items-center gap-1">
                  <Link href="/dashboard" className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800">
                    Dashboard
                  </Link>
                  <Link href="/generate" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    Generate
                  </Link>
                  <Link href="/templates" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    Templates
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Settings className="w-5 h-5" />
                </Link>
                <button 
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here&apos;s an overview of your account and recent activity
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/generate">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl cursor-pointer"
              >
                <Plus className="w-8 h-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">New Component</h3>
                <p className="text-white/80 text-sm">Generate with AI</p>
              </motion.div>
            </Link>

            <Link href="/templates">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <FileCode className="w-8 h-8 mb-3 text-purple-600" />
                <h3 className="font-semibold text-lg mb-1">Templates</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Browse library</p>
              </motion.div>
            </Link>

            <Link href="/pricing">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CreditCard className="w-8 h-8 mb-3 text-purple-600" />
                <h3 className="font-semibold text-lg mb-1">Upgrade Plan</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Get more features</p>
              </motion.div>
            </Link>

            <Link href="/docs">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <Code2 className="w-8 h-8 mb-3 text-purple-600" />
                <h3 className="font-semibold text-lg mb-1">Documentation</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Learn more</p>
              </motion.div>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Usage Stats */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">API Usage</h3>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="mb-2">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-3xl font-bold">{user.apiCalls}</span>
                  <span className="text-sm text-gray-500">/ {user.maxApiCalls}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.maxApiCalls - user.apiCalls} generations remaining
              </p>
            </div>

            {/* Plan Info */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Current Plan</h3>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold capitalize">{user.plan}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.plan === 'free' ? 'Upgrade for more features' : 'Full access to all features'}
              </p>
            </div>

            {/* Member Since */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Member Since</h3>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days active
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <Link href="/generate" className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block">
                Generate your first component →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}