import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Code,
  Trash2,
  Save,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function Settings() {
  const router = useRouter();
  const { user, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      updates: true,
      marketing: false
    },
    theme: 'system',
    editorTheme: 'vs-dark',
    autoSave: true,
    livePreview: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || ''
    }));
  }, [user, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would call an API endpoint
      toast.success('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, this would call an API endpoint
      await signOut();
      toast.success('Account deleted successfully');
      router.push('/');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: Code },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  return (
    <>
      <Head>
        <title>Settings - VRUX</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/dashboard">
              <a className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </a>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6"
              >
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate}>
                    <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Member Since
                        </label>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Update Password
                      </button>
                    </form>

                    <div>
                      <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
                        Danger Zone
                      </h3>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Receive notifications about your account activity
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notifications.email}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: e.target.checked }
                          }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Product Updates</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Get notified about new features and improvements
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notifications.updates}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, updates: e.target.checked }
                          }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Marketing Emails</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Receive tips, tutorials, and promotional content
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notifications.marketing}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, marketing: e.target.checked }
                          }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={formData.theme}
                          onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="system">System</option>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Editor Theme
                        </label>
                        <select
                          value={formData.editorTheme}
                          onChange={(e) => setFormData(prev => ({ ...prev, editorTheme: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="vs-dark">VS Dark</option>
                          <option value="vs-light">VS Light</option>
                          <option value="github-dark">GitHub Dark</option>
                          <option value="github-light">GitHub Light</option>
                          <option value="monokai">Monokai</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Editor Preferences</h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Auto Save</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Automatically save your work as you type
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.autoSave}
                          onChange={(e) => setFormData(prev => ({ ...prev, autoSave: e.target.checked }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Live Preview</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Show real-time preview of your components
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.livePreview}
                          onChange={(e) => setFormData(prev => ({ ...prev, livePreview: e.target.checked }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Billing & Plan</h2>
                    
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Current Plan: {user.plan || 'Free'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {user.plan === 'Pro' 
                          ? 'Unlimited generations per month'
                          : '100 generations per month'
                        }
                      </p>
                      {user.plan !== 'Pro' && (
                        <Link href="/pricing">
                          <a className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            Upgrade to Pro
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        </Link>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Billing History</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No billing history available
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}