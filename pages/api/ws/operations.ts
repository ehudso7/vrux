import type { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import performanceMonitor from '../../../lib/performance';
import alertingEngine from '../../../lib/alerting-rules';
// import telemetry from '../../../lib/telemetry';
import os from 'os';

// Store WebSocket server instance
let wss: WebSocketServer | null = null;

// Initialize WebSocket server
export function initWebSocketServer(server: any) {
  if (wss) return wss;

  wss = new WebSocketServer({
    server,
    path: '/api/ws/operations'
  });

  wss.on('connection', (ws, _req: IncomingMessage) => {
    console.log('New WebSocket connection for operations dashboard');

    // Send initial data
    sendInitialData(ws);

    // Set up periodic updates
    const metricsInterval = setInterval(() => {
      sendMetricsUpdate(ws);
    }, 2000); // Every 2 seconds

    const servicesInterval = setInterval(() => {
      sendServicesUpdate(ws);
    }, 10000); // Every 10 seconds

    // Listen for alerts
    const alertHandler = (alert: any) => {
      ws.send(JSON.stringify({
        type: 'alert',
        alert: {
          id: alert.rule.id,
          severity: alert.rule.severity,
          title: alert.rule.name,
          message: alert.message,
          timestamp: alert.triggeredAt,
          acknowledged: false
        }
      }));
    };

    alertingEngine.on('alert:triggered', alertHandler);

    // Clean up on disconnect
    ws.on('close', () => {
      clearInterval(metricsInterval);
      clearInterval(servicesInterval);
      alertingEngine.off('alert:triggered', alertHandler);
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

// Send initial dashboard data
async function sendInitialData(ws: any) {
  try {
    await sendMetricsUpdate(ws);
    await sendServicesUpdate(ws);
    await sendAlertsUpdate(ws);
  } catch (error) {
    console.error('Failed to send initial data:', error);
  }
}

// Send metrics update
async function sendMetricsUpdate(ws: any) {
  if (ws.readyState !== ws.OPEN) return;

  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const loadAverage = os.loadavg();

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    const perfMetrics = performanceMonitor.getMetrics();

    ws.send(JSON.stringify({
      type: 'metrics',
      metrics: {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          loadAverage: loadAverage
        },
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024, // Mock
          total: 100 * 1024 * 1024 * 1024, // Mock
          percentage: 50
        },
        network: {
          bytesIn: Math.random() * 1024 * 1024,
          bytesOut: Math.random() * 1024 * 1024,
          requestsPerSecond: perfMetrics.requests.requestsPerMinute / 60
        }
      }
    }));
  } catch (error) {
    console.error('Failed to send metrics update:', error);
  }
}

// Send services update
async function sendServicesUpdate(ws: any) {
  if (ws.readyState !== ws.OPEN) return;

  try {
    // Mock service health data
    const services = [
      {
        name: 'Database',
        status: 'healthy',
        latency: Math.random() * 50,
        uptime: 0.999,
        lastCheck: new Date()
      },
      {
        name: 'Cache',
        status: 'healthy',
        latency: Math.random() * 10,
        uptime: 0.998,
        lastCheck: new Date()
      },
      {
        name: 'AI Provider - OpenAI',
        status: Math.random() > 0.1 ? 'healthy' : 'degraded',
        latency: Math.random() * 200,
        uptime: 0.99,
        lastCheck: new Date()
      },
      {
        name: 'Monitoring Backend',
        status: 'healthy',
        latency: Math.random() * 100,
        uptime: 0.995,
        lastCheck: new Date()
      }
    ];

    ws.send(JSON.stringify({
      type: 'services',
      services
    }));
  } catch (error) {
    console.error('Failed to send services update:', error);
  }
}

// Send alerts update
async function sendAlertsUpdate(ws: any) {
  if (ws.readyState !== ws.OPEN) return;

  try {
    const activeAlerts = alertingEngine.getActiveAlerts();
    
    const alerts = activeAlerts.map(alert => ({
      id: alert.rule.id,
      severity: alert.rule.severity,
      title: alert.rule.name,
      message: alert.message,
      timestamp: alert.triggeredAt,
      acknowledged: alert.status === 'acknowledged'
    }));

    ws.send(JSON.stringify({
      type: 'alerts',
      alerts
    }));
  } catch (error) {
    console.error('Failed to send alerts update:', error);
  }
}

// API handler (not used for WebSocket, but required for Next.js)
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  res.status(404).json({ error: 'WebSocket endpoint only' });
}

// Export config to enable WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};