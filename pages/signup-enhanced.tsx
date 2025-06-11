import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Check, X, ArrowRight, Shield, Zap, Code } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../lib/auth-context';
import { signUpSchema, type SignUpInput } from '../lib/validation';
import confetti from 'canvas-confetti';

export default function SignUpEnhanced() {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange'
  });

  const password = watch('password');
  const name = watch('name');
  const email = watch('email');

  const onSubmit = async (data: SignUpInput) => {
    setApiError('');
    try {
      await signUp(data.email, data.password, data.name);
      // Success animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  // Enhanced password strength calculator
  const getPasswordStrength = (pwd: string = '') => {
    if (!pwd) return { strength: 0, label: '', color: '', percentage: 0 };
    
    let strength = 0;
    const checks = [
      { regex: /.{8,}/, points: 1, label: 'At least 8 characters' },
      { regex: /[A-Z]/, points: 1, label: 'Uppercase letter' },
      { regex: /[a-z]/, points: 1, label: 'Lowercase letter' },
      { regex: /[0-9]/, points: 1, label: 'Number' },
      { regex: /[^A-Za-z0-9]/, points: 1, label: 'Special character' }
    ];
    
    const passed = checks.filter(check => check.regex.test(pwd));
    strength = passed.length;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
    const gradients = [
      '',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-yellow-500 to-yellow-600',
      'from-green-500 to-green-600',
      'from-emerald-500 to-emerald-600'
    ];
    
    return { 
      strength, 
      label: labels[strength], 
      color: colors[strength],
      gradient: gradients[strength],
      percentage: (strength / 5) * 100,
      checks: checks.map(check => ({
        ...check,
        passed: check.regex.test(pwd)
      }))
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // Floating particles animation
  useEffect(() => {
    const particles = 50;
    const container = document.getElementById('particles-container');
    if (!container) return;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-purple-400/20 rounded-full animate-float';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particle.style.animationDuration = `${5 + Math.random() * 10}s`;
      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <>
      <Head>
        <title>Sign Up - VRUX | Start Building Amazing UIs</title>
        <meta name="description" content="Join VRUX and start generating beautiful, production-ready UI components with AI" />
      </Head>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-transparent to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20" />
          <div id="particles-container" className="absolute inset-0" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen">
          {/* Left side - Form */}
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
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
                      className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25"
                    >
                      <Sparkles className="w-7 h-7" />
                    </motion.div>
                    <span className="font-bold text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">VRUX</span>
                  </Link>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Create your account
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Join thousands of developers building with AI
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Account setup</span>
                    <span className="text-xs font-medium text-purple-600">
                      {isValid ? '100%' : `${Math.round(((name ? 1 : 0) + (email ? 1 : 0) + (password ? 1 : 0)) / 3 * 100)}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: isValid ? '100%' : `${((name ? 1 : 0) + (email ? 1 : 0) + (password ? 1 : 0)) / 3 * 100}%` 
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'name' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        {...register('name')}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-11 pr-4 py-3 border-2 ${
                          errors.name 
                            ? 'border-red-500 focus:border-red-500' 
                            : focusedField === 'name'
                            ? 'border-purple-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                        } rounded-xl focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
                        placeholder="John Doe"
                      />
                      <AnimatePresence>
                        {name && !errors.name && (
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
                    {errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.name.message}
                      </motion.p>
                    )}
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'email' ? 'text-purple-600' : 'text-gray-400'
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
                            ? 'border-purple-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                        } rounded-xl focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'password' ? 'text-purple-600' : 'text-gray-400'
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
                            ? 'border-purple-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                        } rounded-xl focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
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
                    
                    {/* Password strength indicator */}
                    {password && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Password strength</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.strength >= 4 ? 'text-green-600' : 
                            passwordStrength.strength >= 3 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                          <motion.div 
                            className={`h-full bg-gradient-to-r ${passwordStrength.gradient || 'from-gray-400 to-gray-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.percentage}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="space-y-1">
                          {passwordStrength.checks?.map((check, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-2 text-xs ${
                                check.passed ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              {check.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {check.label}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
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

                  {/* Confirm Password field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'confirmPassword' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-11 pr-11 py-3 border-2 ${
                          errors.confirmPassword 
                            ? 'border-red-500 focus:border-red-500' 
                            : focusedField === 'confirmPassword'
                            ? 'border-purple-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                        } rounded-xl focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-800/50 dark:text-white transition-all duration-200`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword.message}
                      </motion.p>
                    )}
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
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">Sign up failed</p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{apiError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full relative overflow-hidden py-3.5 rounded-xl font-medium transition-all duration-300 ${
                      isSubmitting || !isValid
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/25'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating your account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </span>
                    {!isSubmitting && isValid && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: 'linear',
                        }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        }}
                      />
                    )}
                  </motion.button>

                  {/* Terms and Privacy */}
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </form>

                {/* Sign in link */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1 group">
                      Sign in
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Features */}
          <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                <h2 className="text-4xl font-bold mb-6">Start building amazing UIs in minutes</h2>
                <p className="text-lg mb-8 text-white/90">
                  Join thousands of developers who are already using VRUX to generate beautiful, 
                  production-ready components with AI.
                </p>
                
                <div className="space-y-4">
                  {[
                    {
                      icon: <Zap className="w-5 h-5" />,
                      title: 'Lightning Fast',
                      description: 'Generate components in seconds, not hours'
                    },
                    {
                      icon: <Shield className="w-5 h-5" />,
                      title: 'Production Ready',
                      description: 'Clean, optimized code that\'s ready to ship'
                    },
                    {
                      icon: <Code className="w-5 h-5" />,
                      title: 'Framework Agnostic',
                      description: 'Works with React, Vue, Angular, and more'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-white/80">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <p className="italic text-white/90 mb-4">
                    "VRUX has completely transformed our development workflow. We're shipping 
                    features 10x faster than before."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full" />
                    <div>
                      <p className="font-medium">Sarah Chen</p>
                      <p className="text-sm text-white/70">CTO at TechStart</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Floating shapes */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute top-20 right-20 w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl"
            />
            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full"
            />
          </div>
        </div>
      </div>
    </>
  );
}