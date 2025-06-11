import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TelemetryData {
  summary?: {
    totalEvents: number;
    errorRate: number;
    activeSessions: number;
    requestsPerMinute: number;
    avgResponseTime: number;
    memoryUsage: number;
    uptime: string;
  };
  telemetry?: Record<string, any>;
  performance?: Record<string, any>;
  monitoring?: Record<string, any>;
  insights?: Record<string, string>;
  health?: {
    status: string;
    scores: Record<string, number>;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  description, 
  trend,
  status = 'good' 
}) => {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${statusColors[status]}`}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
          {trend && (
            <span className={`text-sm ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
              {trendIcons[trend]}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const HealthIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    healthy: { color: 'bg-green-500', icon: CheckCircle, text: 'Healthy' },
    degraded: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Degraded' },
    warning: { color: 'bg-orange-500', icon: AlertTriangle, text: 'Warning' },
    critical: { color: 'bg-red-500', icon: XCircle, text: 'Critical' }
  };

  const config = statusConfig[status] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
      <Icon className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};

const InsightCard: React.FC<{ category: string; insight: string }> = ({ category, insight }) => {
  const categoryIcons = {
    performance: '⚡',
    errors: '⚠️',
    memory: '💾',
    ai: '🤖'
  };

  return (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start space-x-2">
        <span className="text-lg">{categoryIcons[category] || '📊'}</span>
        <div>
          <p className="text-sm font-medium capitalize">{category}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{insight}</p>
        </div>
      </div>
    </div>
  );
};

export const TelemetryDashboard: React.FC = () => {
  const [data, setData] = useState<TelemetryData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(5000); // 5 seconds

  const fetchTelemetryData = useCallback(async () => {
    try {
      const response = await fetch('/api/telemetry?type=analytics');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch telemetry: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch telemetry data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetryData();

    if (autoRefresh) {
      const interval = setInterval(fetchTelemetryData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTelemetryData, autoRefresh, refreshInterval]);

  if (loading && !data.summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <Button 
          onClick={fetchTelemetryData} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  const summary = data.summary || {
    totalEvents: 0,
    errorRate: 0,
    activeSessions: 0,
    requestsPerMinute: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    uptime: 'N/A'
  };
  const health = data.health || { status: 'unknown', scores: {} };
  const insights = data.insights || {};
  const performance = data.performance || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Telemetry</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <HealthIndicator status={health.status} />
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={fetchTelemetryData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Requests/min"
          value={summary.requestsPerMinute || 0}
          unit="req/min"
          status={summary.requestsPerMinute > 100 ? 'warning' : 'good'}
        />
        <MetricCard
          title="Avg Response Time"
          value={summary.avgResponseTime || 0}
          unit="ms"
          status={summary.avgResponseTime > 2000 ? 'critical' : summary.avgResponseTime > 1000 ? 'warning' : 'good'}
        />
        <MetricCard
          title="Error Rate"
          value={summary.errorRate || 0}
          unit="%"
          status={summary.errorRate > 5 ? 'critical' : summary.errorRate > 2 ? 'warning' : 'good'}
        />
        <MetricCard
          title="Memory Usage"
          value={summary.memoryUsage || 0}
          unit="%"
          status={summary.memoryUsage > 80 ? 'critical' : summary.memoryUsage > 60 ? 'warning' : 'good'}
        />
      </div>

      {/* Health Scores */}
      {health.scores && (
        <Card>
          <CardHeader>
            <CardTitle>System Health Scores</CardTitle>
            <CardDescription>Overall system performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(health.scores).map(([metric, score]) => (
              <div key={metric} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{metric}</span>
                  <span className="font-medium">{(score as number).toFixed(0)}%</span>
                </div>
                <Progress value={score as number} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {Object.keys(insights).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>System Insights</CardTitle>
            <CardDescription>AI-powered recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(insights).map(([category, insight]) => (
                <InsightCard 
                  key={category} 
                  category={category} 
                  insight={insight as string} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeSessions || 0}</div>
            <p className="text-sm text-gray-500 mt-2">Uptime: {summary.uptime || 'N/A'}</p>
          </CardContent>
        </Card>

        {/* AI Operations */}
        {performance.operations?.aiGeneration && (
          <Card>
            <CardHeader>
              <CardTitle>AI Generation Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Requests</span>
                <span className="font-medium">{performance.operations.aiGeneration.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Duration</span>
                <span className="font-medium">
                  {(performance.operations.aiGeneration.avgDuration || 0).toFixed(2)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="font-medium">
                  {(performance.operations.aiGeneration.errorRate || 0).toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};