import { NextApiRequest, NextApiResponse } from 'next';

const SAMPLE_COMPONENTS = {
  dashboard: `import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const stats = [
    { name: 'Total Revenue', value: '$45,231', change: '+12.5%', icon: DollarSign, color: 'bg-green-500' },
    { name: 'Active Users', value: '2,345', change: '+18.2%', icon: Users, color: 'bg-blue-500' },
    { name: 'Growth Rate', value: '24.5%', change: '+4.3%', icon: TrendingUp, color: 'bg-purple-500' },
    { name: 'Active Now', value: '423', change: '+2.1%', icon: Activity, color: 'bg-orange-500' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={\`px-4 py-2 rounded-lg capitalize transition-colors \${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }\`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={\`\${stat.color} p-3 rounded-lg\`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-500 text-sm font-semibold">{stat.change}</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm">{stat.name}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Revenue Chart</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart placeholder - integrate with Recharts
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Activity</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Activity chart placeholder
          </div>
        </div>
      </div>
    </div>
  );
}`,
  default: `import { useState } from 'react';
import { motion } from 'framer-motion';

export default function GeneratedComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Generated Component
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This component was generated based on your prompt.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCount(count - 1)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {count}
          </span>
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}`
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return appropriate component based on prompt
  let code = SAMPLE_COMPONENTS.default;
  
  if (prompt.toLowerCase().includes('dashboard') || 
      prompt.toLowerCase().includes('analytics') ||
      prompt.toLowerCase().includes('chart')) {
    code = SAMPLE_COMPONENTS.dashboard;
  }

  return res.status(200).json({
    code,
    provider: 'Development Mode',
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    },
    remainingRequests: 100
  });
}
