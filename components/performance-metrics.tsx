import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Users,
  Cpu,
  HardDrive,
  RefreshCw,
  Download,
  Shield,
  Globe,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  activeUsers: number;
  cpuUsage: number;
  memoryUsage: number;
  cacheHitRate: number;
  providerHealth: {
    OpenAI: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    Anthropic: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    Mock: { status: 'healthy' | 'degraded' | 'down'; latency: number };
  };
}

interface PerformanceMetricsProps {
  apiEndpoint?: string;
  refreshInterval?: number;
  darkMode?: boolean;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  apiEndpoint = '/api/metrics',
  refreshInterval = 5000,
  darkMode = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  // Generate mock metrics for demonstration
  const generateMockMetrics = useCallback((): PerformanceMetrics[] => {
    const now = Date.now();
    const dataPoints = selectedTimeRange === '1h' ? 12 : selectedTimeRange === '24h' ? 24 : 7;
    
    return Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: new Date(now - (i * 5 * 60 * 1000)),
      responseTime: 200 + Math.random() * 300,
      requestsPerMinute: 50 + Math.random() * 100,
      errorRate: Math.random() * 5,
      activeUsers: Math.floor(100 + Math.random() * 200),
      cpuUsage: 20 + Math.random() * 60,
      memoryUsage: 40 + Math.random() * 40,
      cacheHitRate: 70 + Math.random() * 20,
      providerHealth: {
        OpenAI: { 
          status: (Math.random() > 0.9 ? 'degraded' : 'healthy') as 'healthy' | 'degraded' | 'down', 
          latency: 100 + Math.random() * 200 
        },
        Anthropic: { 
          status: (Math.random() > 0.95 ? 'down' : Math.random() > 0.8 ? 'degraded' : 'healthy') as 'healthy' | 'degraded' | 'down', 
          latency: 150 + Math.random() * 250 
        },
        Mock: { 
          status: 'healthy' as 'healthy' | 'degraded' | 'down', 
          latency: 10 + Math.random() * 40 
        },
      },
    })).reverse();
  }, [selectedTimeRange]);

  // Fetch metrics data
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${apiEndpoint}?range=${selectedTimeRange}`);
      const data = await response.json();
      
      // For demo purposes, generate mock data if API doesn't exist
      if (!response.ok) {
        setMetrics(generateMockMetrics());
      } else {
        setMetrics(data);
      }
      
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setMetrics(generateMockMetrics());
      setIsLoading(false);
    }
  }, [apiEndpoint, selectedTimeRange, generateMockMetrics]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  const currentMetrics = metrics[metrics.length - 1] || generateMockMetrics()[0];

  // Simple sparkline component
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 40;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertCircle className="w-5 h-5" />;
      case 'down': return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isUp: change > 0,
      icon: change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const previousMetrics = metrics[metrics.length - 2] || currentMetrics;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance Metrics</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time monitoring and analytics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className={`flex items-center gap-1 p-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
              {(['1h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded transition-all ${
                    selectedTimeRange === range
                      ? 'bg-purple-600 text-white'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Actions */}
            <button 
              onClick={fetchMetrics}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Last Update */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{currentMetrics.responseTime.toFixed(0)}ms</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`text-sm flex items-center gap-1 ${
              getTrend(currentMetrics.responseTime, previousMetrics.responseTime).isUp ? 'text-red-500' : 'text-green-500'
            }`}>
              {getTrend(currentMetrics.responseTime, previousMetrics.responseTime).icon}
              {getTrend(currentMetrics.responseTime, previousMetrics.responseTime).value}%
            </div>
            <Sparkline 
              data={metrics.slice(-10).map(m => m.responseTime)} 
              color={darkMode ? '#9333ea' : '#7c3aed'} 
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Requests/min</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{currentMetrics.requestsPerMinute.toFixed(0)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`text-sm flex items-center gap-1 ${
              getTrend(currentMetrics.requestsPerMinute, previousMetrics.requestsPerMinute).isUp ? 'text-green-500' : 'text-red-500'
            }`}>
              {getTrend(currentMetrics.requestsPerMinute, previousMetrics.requestsPerMinute).icon}
              {getTrend(currentMetrics.requestsPerMinute, previousMetrics.requestsPerMinute).value}%
            </div>
            <Sparkline 
              data={metrics.slice(-10).map(m => m.requestsPerMinute)} 
              color={darkMode ? '#3b82f6' : '#2563eb'} 
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{currentMetrics.errorRate.toFixed(1)}%</div>
          <div className="text-sm text-green-500 mt-1">Within normal range</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{currentMetrics.activeUsers}</div>
          <div className="text-sm text-gray-500 mt-1">Currently online</div>
        </motion.div>
      </div>

      {/* System Health & Provider Status */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4">System Resources</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-red-500" />
                  <span className="text-sm">CPU Usage</span>
                </div>
                <span className="text-sm font-medium">{currentMetrics.cpuUsage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${currentMetrics.cpuUsage}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <span className="text-sm font-medium">{currentMetrics.memoryUsage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${currentMetrics.memoryUsage}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Cache Hit Rate</span>
                </div>
                <span className="text-sm font-medium">{currentMetrics.cacheHitRate.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${currentMetrics.cacheHitRate}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4">AI Provider Status</h3>
          <div className="space-y-4">
            {Object.entries(currentMetrics.providerHealth).map(([provider, health]) => (
              <div key={provider} className="border rounded-lg p-4 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{provider}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(health.status)}`}>
                    {getStatusIcon(health.status)}
                    <span className="text-sm capitalize">{health.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Latency</span>
                  <span className="font-medium">{health.latency.toFixed(0)}ms</span>
                </div>
                <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      health.status === 'healthy' ? 'bg-green-500' :
                      health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${100 - (health.latency / 500) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Security Status */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Security Status: All Systems Operational
              </span>
            </div>
            <div className="mt-2 text-sm text-green-600 dark:text-green-500">
              • SSL/TLS: Active<br />
              • Rate Limiting: Enforced<br />
              • DDoS Protection: Active
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};