import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out VRUX',
    features: [
      { text: '100 generations per month', included: true },
      { text: 'Basic components', included: true },
      { text: 'Community support', included: true },
      { text: 'Export to React/Tailwind', included: true },
      { text: 'Basic templates', included: true },
      { text: 'Priority support', included: false },
      { text: 'Advanced components', included: false },
      { text: 'Custom branding', included: false },
      { text: 'API access', included: false },
      { text: 'Team collaboration', included: false }
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For professional developers',
    features: [
      { text: 'Unlimited generations', included: true },
      { text: 'All component types', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Export to React/Tailwind', included: true },
      { text: 'Premium templates', included: true },
      { text: 'Advanced AI models', included: true },
      { text: 'Custom components', included: true },
      { text: 'Remove branding', included: true },
      { text: 'API access', included: false },
      { text: 'Team collaboration', included: false }
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Team',
    price: 99,
    period: 'month',
    description: 'For teams and agencies',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'API access', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Custom AI training', included: true },
      { text: 'SSO authentication', included: true },
      { text: 'Audit logs', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom contracts', included: true }
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('Free');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Fetch current subscription status
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch('/api/subscriptions/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentPlan(data.subscription.plan);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (planName === 'Free') {
      router.push('/dashboard');
      return;
    }

    if (planName === 'Team') {
      // Open contact form or redirect to sales
      toast('Please contact our sales team for Team pricing', {
        icon: '📧',
        duration: 4000,
      });
      window.location.href = 'mailto:sales@vrux.dev?subject=VRUX Team Plan Inquiry';
      return;
    }

    // Handle Pro plan checkout
    setLoadingPlan(planName);
    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect to checkout or dashboard
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.');
      console.error('Checkout error:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing - VRUX</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {/* Navigation */}
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VRUX
                </span>
              </Link>

              <div className="flex items-center gap-4">
                {user ? (
                  <Link href="/dashboard" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/signin" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            >
              Simple, transparent pricing
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-400"
            >
              Choose the perfect plan for your needs. Always flexible to scale.
            </motion.p>

            {/* Billing toggle */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mt-8"
            >
              <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors"
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                Yearly
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Save 20%
                </span>
              </span>
            </motion.div>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                      ${billingPeriod === 'yearly' && plan.price > 0 
                        ? Math.round(plan.price * 0.8 * 12) 
                        : plan.price
                      }
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{billingPeriod === 'yearly' ? 'year' : plan.period}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    disabled={loadingPlan === plan.name || currentPlan === plan.name || isLoadingStatus}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      currentPlan === plan.name
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } ${loadingPlan === plan.name || isLoadingStatus ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : currentPlan === plan.name ? (
                      <>
                        <Check className="w-4 h-4" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              Frequently asked questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We offer a 14-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely! You can upgrade or downgrade your plan at any time from your dashboard.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, Pro and Team plans come with a 14-day free trial. No credit card required.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Ready to build amazing UIs?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of developers using VRUX to create beautiful components faster.
            </p>
            <Link href="/signin" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all text-lg">
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}