import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  Database, Cpu, HardDrive, RefreshCw
} from 'lucide-react';

// Real-time data interfaces
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    requestsPerSecond: number;
  };
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: Date;
}

interface ActiveAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface TraceData {
  traceId: string;
  service: string;
  operation: string;
  duration: number;
  status: 'success' | 'error';
  timestamp: Date;
}

// Chart component for real-time metrics
const MetricsChart: React.FC<{ 
  data: number[]; 
  label: string; 
  color: string;
  height?: number;
}> = ({ data, label, color, height = 100 }) => {
  const maxValue = Math.max(...data, 1);
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={`0,100 ${points} 100,100`}
          fill={`${color}20`}
        />
      </svg>
      <div className="absolute top-0 right-0 text-xs text-gray-500">
        {label}: {data[data.length - 1]?.toFixed(2)}
      </div>
    </div>
  );
};

// Service health indicator component
const ServiceHealthCard: React.FC<{ service: ServiceHealth }> = ({ service }) => {
  const statusConfig = {
    healthy: { color: 'bg-green-500', icon: CheckCircle, text: 'Healthy' },
    degraded: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Degraded' },
    down: { color: 'bg-red-500', icon: XCircle, text: 'Down' }
  };

  const config = statusConfig[service.status];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={`w-5 h-5 ${config.color.replace('bg-', 'text-')}`} />
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-xs text-gray-500">
                Uptime: {(service.uptime * 100).toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{service.latency}ms</p>
            <p className="text-xs text-gray-500">latency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Alert item component
const AlertItem: React.FC<{ 
  alert: ActiveAlert; 
  onAcknowledge: (id: string) => void;
}> = ({ alert, onAcknowledge }) => {
  const severityConfig = {
    info: { color: 'bg-blue-100 text-blue-800', icon: '💡' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
    error: { color: 'bg-red-100 text-red-800', icon: '❌' },
    critical: { color: 'bg-red-200 text-red-900', icon: '🚨' }
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`p-3 rounded-lg ${config.color} ${alert.acknowledged ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm mt-1">{alert.message}</p>
            <p className="text-xs mt-2 opacity-75">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {!alert.acknowledged && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcknowledge(alert.id)}
            className="ml-4"
          >
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
};

// Main Operations Dashboard
export const OperationsDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, cores: 0, loadAverage: [0, 0, 0] },
    memory: { used: 0, total: 0, percentage: 0 },
    disk: { used: 0, total: 0, percentage: 0 },
    network: { bytesIn: 0, bytesOut: 0, requestsPerSecond: 0 }
  });

  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [traces, setTraces] = useState<TraceData[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(20).fill(0));
  const [memoryHistory, setMemoryHistory] = useState<number[]>(new Array(20).fill(0));
  const [requestHistory, setRequestHistory] = useState<number[]>(new Array(20).fill(0));
  const [autoRefresh, setAutoRefresh] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Update metric histories
  const updateHistories = useCallback((metrics: SystemMetrics) => {
    setCpuHistory(prev => [...prev.slice(1), metrics.cpu.usage]);
    setMemoryHistory(prev => [...prev.slice(1), metrics.memory.percentage]);
    setRequestHistory(prev => [...prev.slice(1), metrics.network.requestsPerSecond]);
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'metrics':
        setSystemMetrics(data.metrics);
        updateHistories(data.metrics);
        break;
      case 'services':
        setServices(data.services);
        break;
      case 'alert':
        setAlerts(prev => [data.alert, ...prev].slice(0, 10));
        break;
      case 'trace':
        setTraces(prev => [data.trace, ...prev].slice(0, 20));
        break;
    }
  }, [updateHistories]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/operations`);
      
      ws.onopen = () => {
        console.log('Connected to operations WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 5 seconds
        if (autoRefresh) {
          setTimeout(connectWebSocket, 5000);
        }
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [autoRefresh, handleRealtimeUpdate]);

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, servicesRes, alertsRes] = await Promise.all([
        fetch('/api/operations/metrics'),
        fetch('/api/operations/services'),
        fetch('/api/operations/alerts')
      ]);

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setSystemMetrics(metrics);
      }

      if (servicesRes.ok) {
        const services = await servicesRes.json();
        setServices(services);
      }

      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setAlerts(alerts);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/operations/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, []);

  const serviceHealthSummary = {
    healthy: services.filter(s => s.status === 'healthy').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    down: services.filter(s => s.status === 'down').length
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time system monitoring and observability
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800 dark:text-red-200">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.cpu.usage.toFixed(1)}%</div>
            <Progress value={systemMetrics.cpu.usage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              Load: {systemMetrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.memory.percentage.toFixed(1)}%</div>
            <Progress value={systemMetrics.memory.percentage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {(systemMetrics.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB / 
              {(systemMetrics.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.disk.percentage.toFixed(1)}%</div>
            <Progress value={systemMetrics.disk.percentage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {(systemMetrics.disk.used / 1024 / 1024 / 1024).toFixed(2)} GB / 
              {(systemMetrics.disk.total / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics.network.requestsPerSecond.toFixed(0)} req/s
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <div>↓ {(systemMetrics.network.bytesIn / 1024).toFixed(2)} KB/s</div>
              <div>↑ {(systemMetrics.network.bytesOut / 1024).toFixed(2)} KB/s</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CPU Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={cpuHistory} label="CPU" color="#3b82f6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Memory Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={memoryHistory} label="Memory" color="#10b981" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Request Rate History</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={requestHistory} label="Requests" color="#f59e0b" />
          </CardContent>
        </Card>
      </div>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>
            {serviceHealthSummary.healthy} healthy, 
            {serviceHealthSummary.degraded > 0 && ` ${serviceHealthSummary.degraded} degraded,`}
            {serviceHealthSummary.down > 0 && ` ${serviceHealthSummary.down} down`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map(service => (
              <ServiceHealthCard key={service.name} service={service} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              {alerts.filter(a => !a.acknowledged).length} unacknowledged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active alerts</p>
              ) : (
                alerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Traces */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Traces</CardTitle>
            <CardDescription>Latest distributed trace operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {traces.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent traces</p>
              ) : (
                traces.map(trace => (
                  <div
                    key={trace.traceId}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        trace.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{trace.operation}</p>
                        <p className="text-xs text-gray-500">{trace.service}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{trace.duration}ms</p>
                      <p className="text-xs text-gray-500">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};