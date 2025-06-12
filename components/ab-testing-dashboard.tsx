import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Play,
  Pause,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
  metrics?: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    averageValue?: number;
  };
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  type: 'split' | 'multivariate' | 'bandit';
  variants: ABTestVariant[];
  goals: Array<{
    id: string;
    name: string;
    type: string;
    event: string;
  }>;
  schedule?: {
    startDate: Date;
    endDate?: Date;
  };
  createdAt: Date;
  results?: {
    winner?: string;
    confidence?: number;
    significantResults?: boolean;
  };
}

interface ABTestingDashboardProps {
  onCreateTest?: () => void;
  className?: string;
}

export const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({
  onCreateTest,
  className = ''
}) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');

  // Load tests
  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      // In real app, this would be an API call
      const mockTests: ABTest[] = [
        {
          id: '1',
          name: 'Homepage CTA Button Test',
          description: 'Testing different CTA button colors and text',
          status: 'running',
          type: 'split',
          variants: [
            {
              id: 'control',
              name: 'Control (Blue)',
              weight: 50,
              config: { color: 'blue', text: 'Get Started' },
              metrics: {
                impressions: 15420,
                conversions: 1234,
                conversionRate: 0.08,
                averageValue: 45.50
              }
            },
            {
              id: 'variant-a',
              name: 'Variant A (Green)',
              weight: 50,
              config: { color: 'green', text: 'Start Free Trial' },
              metrics: {
                impressions: 15380,
                conversions: 1542,
                conversionRate: 0.10,
                averageValue: 52.30
              }
            }
          ],
          goals: [
            { id: '1', name: 'Sign Up', type: 'conversion', event: 'signup' },
            { id: '2', name: 'Trial Start', type: 'conversion', event: 'trial_start' }
          ],
          schedule: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-02-01')
          },
          createdAt: new Date('2023-12-15'),
          results: {
            winner: 'variant-a',
            confidence: 95.8,
            significantResults: true
          }
        },
        {
          id: '2',
          name: 'AI Model Selection Test',
          description: 'Testing user preference for different AI models',
          status: 'running',
          type: 'bandit',
          variants: [
            {
              id: 'gpt4',
              name: 'GPT-4',
              weight: 33,
              config: { model: 'gpt-4o' },
              metrics: {
                impressions: 8234,
                conversions: 823,
                conversionRate: 0.10
              }
            },
            {
              id: 'claude',
              name: 'Claude 3.5',
              weight: 33,
              config: { model: 'claude-3-5-sonnet' },
              metrics: {
                impressions: 7856,
                conversions: 942,
                conversionRate: 0.12
              }
            },
            {
              id: 'gemini',
              name: 'Gemini Pro',
              weight: 34,
              config: { model: 'gemini-pro' },
              metrics: {
                impressions: 8910,
                conversions: 802,
                conversionRate: 0.09
              }
            }
          ],
          goals: [
            { id: '1', name: 'Component Generated', type: 'conversion', event: 'generate_success' },
            { id: '2', name: 'Component Used', type: 'engagement', event: 'component_used' }
          ],
          createdAt: new Date('2024-01-10')
        }
      ];

      setTests(mockTests);
      if (mockTests.length > 0) {
        setSelectedTest(mockTests[0]);
      }
    } catch (error) {
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const updateTestStatus = async (testId: string, status: ABTest['status']) => {
    try {
      // In real app, this would be an API call
      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status } : test
      ));
      toast.success(`Test ${status === 'running' ? 'started' : status}`);
    } catch (error) {
      toast.error('Failed to update test status');
    }
  };

  const getStatusIcon = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderTestList = () => (
    <div className="space-y-4">
      {tests.map(test => (
        <Card
          key={test.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            setSelectedTest(test);
            setView('detail');
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(test.status)}
                  <h3 className="text-lg font-semibold">{test.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    test.type === 'bandit' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}>
                    {test.type === 'bandit' ? 'Multi-Armed Bandit' : 'A/B Test'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {test.description}
                </p>
                
                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Variants</p>
                    <p className="font-medium">{test.variants.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Impressions</p>
                    <p className="font-medium">
                      {test.variants.reduce((sum, v) => sum + (v.metrics?.impressions || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg. Conversion</p>
                    <p className="font-medium">
                      {(test.variants.reduce((sum, v) => sum + (v.metrics?.conversionRate || 0), 0) / test.variants.length * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Variant Performance */}
                <div className="space-y-2">
                  {test.variants.map(variant => (
                    <div key={variant.id} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-32">{variant.name}</span>
                      <div className="flex-1">
                        <Progress 
                          value={variant.metrics?.conversionRate ? variant.metrics.conversionRate * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {variant.metrics?.conversionRate ? (variant.metrics.conversionRate * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Results */}
                {test.results?.significantResults && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Winner: <strong>{test.variants.find(v => v.id === test.results?.winner)?.name}</strong>
                      </span>
                      <span className={`text-sm ${getConfidenceColor(test.results.confidence)}`}>
                        ({test.results.confidence?.toFixed(1)}% confidence)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {test.status === 'running' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTestStatus(test.id, 'paused');
                    }}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : test.status === 'paused' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTestStatus(test.id, 'running');
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTestDetail = () => {
    if (!selectedTest) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('list')}
            >
              ← Back
            </Button>
            <h2 className="text-2xl font-bold">{selectedTest.name}</h2>
            {getStatusIcon(selectedTest.status)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold capitalize">{selectedTest.status}</p>
                </div>
                {getStatusIcon(selectedTest.status)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold">
                    {selectedTest.type === 'bandit' ? 'Multi-Armed Bandit' : 'A/B Test'}
                  </p>
                </div>
                <FlaskConical className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold">
                    {selectedTest.schedule ? 
                      `${Math.ceil((new Date().getTime() - selectedTest.schedule.startDate.getTime()) / (1000 * 60 * 60 * 24))} days` :
                      'Ongoing'
                    }
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className={`text-lg font-semibold ${getConfidenceColor(selectedTest.results?.confidence)}`}>
                    {selectedTest.results?.confidence ? `${selectedTest.results.confidence.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <Target className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variant Details */}
        <Card>
          <CardHeader>
            <CardTitle>Variant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTest.variants.map((variant, index) => {
                const isWinner = variant.id === selectedTest.results?.winner;
                const metrics = variant.metrics || {
                  impressions: 0,
                  conversions: 0,
                  conversionRate: 0
                };

                return (
                  <div
                    key={variant.id}
                    className={`p-4 rounded-lg border-2 ${
                      isWinner 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {variant.name}
                          {isWinner && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                              Winner
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Weight: {variant.weight}%
                        </p>
                      </div>
                      {index > 0 && metrics.conversionRate > 0 && (
                        <div className="text-right">
                          {(() => {
                            const baseline = selectedTest.variants[0].metrics?.conversionRate || 0;
                            const diff = ((metrics.conversionRate - baseline) / baseline) * 100;
                            return (
                              <div className={`flex items-center gap-1 ${
                                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {diff > 0 ? <ArrowUp className="w-4 h-4" /> : 
                                 diff < 0 ? <ArrowDown className="w-4 h-4" /> : 
                                 <Minus className="w-4 h-4" />}
                                <span className="font-medium">{Math.abs(diff).toFixed(1)}%</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Impressions</p>
                        <p className="font-medium">{metrics.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conversions</p>
                        <p className="font-medium">{metrics.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conversion Rate</p>
                        <p className="font-medium">{(metrics.conversionRate * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg. Value</p>
                        <p className="font-medium">
                          {metrics.averageValue ? `$${metrics.averageValue.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Conversion Rate Progress */}
                    <div className="mt-3">
                      <Progress value={metrics.conversionRate * 100} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Goals & Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedTest.goals.map(goal => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-xs text-gray-500">Event: {goal.event}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                    {goal.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      {view === 'list' && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlaskConical className="w-8 h-8 text-purple-600" />
              A/B Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Optimize your components with data-driven experiments
            </p>
          </div>
          <Button onClick={onCreateTest}>
            <Plus className="w-4 h-4 mr-2" />
            New Test
          </Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FlaskConical className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Loading experiments...</p>
          </div>
        </div>
      ) : view === 'list' ? (
        renderTestList()
      ) : (
        renderTestDetail()
      )}
    </div>
  );
};