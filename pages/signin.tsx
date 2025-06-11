import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check, ArrowRight, Zap, Shield, Rocket, KeyRound, Fingerprint, Cpu } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../lib/auth-context';
import { signInSchema, type SignInInput } from '../lib/validation';
import confetti from 'canvas-confetti';

export default function SignIn() {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange'
  });

  const email = watch('email');
  const password = watch('password');

  const onSubmit = async (data: SignInInput) => {
    setApiError('');
    try {
      await signIn(data.email, data.password);
      // Success animation
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6']
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleDemoLogin = () => {
    // Animate the form filling
    setValue('email', 'demo@vrux.dev');
    setTimeout(() => {
      setValue('password', 'demo123');
    }, 300);
  };

  // Floating orbs animation
  useEffect(() => {
    const orbs = 20;
    const container = document.getElementById('orbs-container');
    if (!container) return;

    for (let i = 0; i < orbs; i++) {
      const orb = document.createElement('div');
      orb.className = 'absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-float';
      orb.style.left = `${Math.random() * 100}%`;
      orb.style.top = `${Math.random() * 100}%`;
      orb.style.animationDelay = `${Math.random() * 5}s`;
      orb.style.animationDuration = `${10 + Math.random() * 20}s`;
      container.appendChild(orb);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <>
      <Head>
        <title>Sign In - VRUX | Welcome Back</title>
        <meta name="description" content="Sign in to your VRUX account and continue building amazing UI components with AI" />
      </Head>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/20">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100/50 via-transparent to-fuchsia-100/50 dark:from-violet-900/20 dark:to-fuchsia-900/20" />
          <div id="orbs-container" className="absolute inset-0" />
          
          {/* Animated gradient orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute -top-48 -left-48 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute -bottom-48 -right-48 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen">
          {/* Left side - Features showcase */}
          <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Floating tech icons */}
            <motion.div
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute top-32 left-24 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <Cpu className="w-10 h-10 text-white/80" />
            </motion.div>
            
            <motion.div
              animate={{
                y: [0, 30, 0],
                rotate: [0, -360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute bottom-32 right-24 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Rocket className="w-12 h-12 text-white/80" />
            </motion.div>

            <div className="relative z-10 max-w-md">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                <h2 className="text-5xl font-bold mb-6 leading-tight">
                  Welcome back to the future of UI development
                </h2>
                <p className="text-xl mb-8 text-white/90 leading-relaxed">
                  Your AI-powered workspace is ready. Let's continue building extraordinary interfaces together.
                </p>
                
                {/* Feature highlights */}
                <div className="space-y-6">
                  {[
                    {
                      icon: <Zap className="w-6 h-6" />,
                      title: 'Instant Generation',
                      description: 'Create complex components in seconds with natural language',
                      stat: '10x faster'
                    },
                    {
                      icon: <Shield className="w-6 h-6" />,
                      title: 'Enterprise Security',
                      description: 'Your code and data are protected with bank-level encryption',
                      stat: '256-bit AES'
                    },
                    {
                      icon: <Fingerprint className="w-6 h-6" />,
                      title: 'Personalized AI',
                      description: 'AI that learns your style and preferences over time',
                      stat: '99% accuracy'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{feature.title}</h3>
                          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                            {feature.stat}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 grid grid-cols-3 gap-4"
                >
                  {[
                    { label: 'Active Users', value: '50K+' },
                    { label: 'Components Created', value: '2M+' },
                    { label: 'Time Saved', value: '500K hrs' }
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-xs text-white/70">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-800/50">
                {/* Logo and heading */}
                <div className="text-center mb-8">
                  <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-violet-500/25"
                    >
                      <Sparkles className="w-7 h-7" />
                    </motion.div>
                    <span className="font-bold text-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">VRUX</span>
                  </Link>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Welcome back
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sign in to continue your creative journey
                  </p>
                </div>

                {/* Quick access buttons */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDemoLogin}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:shadow-md transition-all group"
                  >
                    <KeyRound className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Demo Account</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:shadow-md transition-all group"
                  >
                    <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">SSO Login</span>
                  </motion.button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 dark:bg-gray-900/80 text-gray-500">or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'email' ? 'text-violet-600' : 'text-gray-400'
                      }`} />
                      <input
                        type="email"
                        {...register('email')}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-11 pr-4 py-3 border-2 ${
                          errors.email 
                            ? 'border-red-500 focus:border-red-500' 
                            : focusedField === 'email'
                            ? 'border-violet-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'
                        } rounded-xl focus:ring-4 focus:ring-violet-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
                        placeholder="you@example.com"
                      />
                      <AnimatePresence>
                        {email && !errors.email && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <Check className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'password' ? 'text-violet-600' : 'text-gray-400'
                      }`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-11 pr-11 py-3 border-2 ${
                          errors.password 
                            ? 'border-red-500 focus:border-red-500' 
                            : focusedField === 'password'
                            ? 'border-violet-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-violet-500'
                        } rounded-xl focus:ring-4 focus:ring-violet-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </div>

                  {/* Remember me checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                        Remember me for 30 days
                      </span>
                    </label>
                  </div>

                  {/* API Error */}
                  <AnimatePresence>
                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">Authentication failed</p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{apiError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !email || !password}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full relative overflow-hidden py-3.5 rounded-xl font-medium transition-all duration-300 ${
                      isSubmitting || !email || !password
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-xl hover:shadow-violet-500/25'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Signing you in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    {!isSubmitting && email && password && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: 'linear',
                        }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        }}
                      />
                    )}
                  </motion.button>
                </form>

                {/* Sign up link */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New to VRUX?{' '}
                    <Link href="/signup" className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1 group">
                      Create an account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </p>
                </div>
              </div>

              {/* Security badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <Shield className="w-4 h-4" />
                <span>Protected by enterprise-grade security</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}