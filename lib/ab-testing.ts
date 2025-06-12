import { EventEmitter } from 'events';
import crypto from 'crypto';
import logger from './logger';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across all variants
  config: Record<string, any>;
  metrics?: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    averageValue?: number;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  type: 'split' | 'multivariate' | 'bandit';
  variants: ABTestVariant[];
  targetAudience?: {
    segments?: string[];
    percentage?: number; // Percentage of traffic to include
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater' | 'less';
      value: any;
    }>;
  };
  goals: Array<{
    id: string;
    name: string;
    type: 'conversion' | 'engagement' | 'revenue';
    event: string;
    value?: number;
  }>;
  schedule?: {
    startDate: Date;
    endDate?: Date;
    timezone?: string;
  };
  settings: {
    minimumSampleSize?: number;
    confidenceLevel?: number; // 90, 95, 99
    multiArmedBandit?: {
      algorithm: 'epsilon-greedy' | 'thompson-sampling' | 'ucb';
      explorationRate?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  results?: {
    winner?: string;
    confidence?: number;
    significantResults?: boolean;
    performanceByVariant: Record<string, any>;
  };
}

export interface ABTestEvent {
  testId: string;
  variantId: string;
  userId: string;
  event: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class ABTestingService extends EventEmitter {
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private eventQueue: ABTestEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startEventFlush();
  }

  /**
   * Create a new A/B test
   */
  createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): ABTest {
    const id = this.generateTestId(test.name);
    
    // Validate variant weights
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    const newTest: ABTest = {
      ...test,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tests.set(id, newTest);
    
    logger.info('A/B test created', {
      testId: id,
      name: test.name,
      variantCount: test.variants.length
    });

    return newTest;
  }

  /**
   * Get variant assignment for a user
   */
  getVariant(testId: string, userId: string, attributes?: Record<string, any>): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    // Check if test is running
    if (test.status !== 'running') return null;

    // Check schedule
    if (test.schedule) {
      const now = new Date();
      if (now < test.schedule.startDate || 
          (test.schedule.endDate && now > test.schedule.endDate)) {
        return null;
      }
    }

    // Check target audience
    if (!this.isInTargetAudience(test, userId, attributes)) {
      return null;
    }

    // Check existing assignment
    let userTests = this.userAssignments.get(userId);
    if (!userTests) {
      userTests = new Map();
      this.userAssignments.set(userId, userTests);
    }

    let variantId = userTests.get(testId);
    if (variantId) {
      const variant = test.variants.find(v => v.id === variantId);
      if (variant) {
        this.trackImpression(testId, variantId, userId);
        return variant;
      }
    }

    // Assign variant based on test type
    const variant = this.assignVariant(test, userId);
    if (variant) {
      userTests.set(testId, variant.id);
      this.trackImpression(testId, variant.id, userId);
    }

    return variant;
  }

  /**
   * Track conversion or event
   */
  trackEvent(
    testId: string,
    userId: string,
    event: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const userTests = this.userAssignments.get(userId);
    if (!userTests) return;

    const variantId = userTests.get(testId);
    if (!variantId) return;

    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return;

    // Check if event matches any goals
    const matchingGoal = test.goals.find(g => g.event === event);
    if (!matchingGoal) return;

    const testEvent: ABTestEvent = {
      testId,
      variantId,
      userId,
      event,
      value: value || matchingGoal.value,
      metadata,
      timestamp: new Date()
    };

    this.eventQueue.push(testEvent);
    this.emit('event', testEvent);

    // Update metrics immediately for real-time reporting
    this.updateMetrics(testId, variantId, event, value);
  }

  /**
   * Get test results and statistics
   */
  getResults(testId: string): any {
    const test = this.tests.get(testId);
    if (!test) return null;

    const results = {
      test: {
        id: test.id,
        name: test.name,
        status: test.status,
        duration: this.getTestDuration(test)
      },
      variants: test.variants.map(variant => ({
        ...variant,
        metrics: this.getVariantMetrics(testId, variant.id),
        statistics: this.calculateStatistics(test, variant.id)
      })),
      winner: null as any,
      confidence: 0,
      significant: false
    };

    // Calculate statistical significance
    if (test.variants.length === 2) {
      const stats = this.calculateABSignificance(
        results.variants[0].metrics,
        results.variants[1].metrics,
        test.settings.confidenceLevel || 95
      );

      results.significant = stats.significant;
      results.confidence = stats.confidence;
      
      if (stats.significant) {
        results.winner = stats.winner === 0 ? results.variants[0] : results.variants[1];
      }
    }

    return results;
  }

  /**
   * Update test status
   */
  updateTestStatus(testId: string, status: ABTest['status']): void {
    const test = this.tests.get(testId);
    if (!test) return;

    test.status = status;
    test.updatedAt = new Date();

    if (status === 'completed') {
      // Calculate and store final results
      test.results = this.calculateFinalResults(test);
    }

    logger.info('A/B test status updated', {
      testId,
      status,
      previousStatus: test.status
    });
  }

  /**
   * Get all active tests for a user
   */
  getActiveTestsForUser(userId: string, attributes?: Record<string, any>): ABTest[] {
    return Array.from(this.tests.values()).filter(test => {
      if (test.status !== 'running') return false;
      return this.isInTargetAudience(test, userId, attributes);
    });
  }

  /**
   * Check if user is in target audience
   */
  private isInTargetAudience(
    test: ABTest,
    userId: string,
    attributes?: Record<string, any>
  ): boolean {
    if (!test.targetAudience) return true;

    // Check percentage
    if (test.targetAudience.percentage) {
      const hash = this.hashUserId(userId);
      const bucket = (hash % 100) + 1;
      if (bucket > test.targetAudience.percentage) {
        return false;
      }
    }

    // Check conditions
    if (test.targetAudience.conditions && attributes) {
      for (const condition of test.targetAudience.conditions) {
        const value = attributes[condition.field];
        if (!this.evaluateCondition(value, condition.operator, condition.value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'contains':
        return String(value).includes(String(target));
      case 'greater':
        return Number(value) > Number(target);
      case 'less':
        return Number(value) < Number(target);
      default:
        return false;
    }
  }

  /**
   * Assign variant to user
   */
  private assignVariant(test: ABTest, userId: string): ABTestVariant | null {
    if (test.type === 'bandit' && test.settings.multiArmedBandit) {
      return this.assignBanditVariant(test, userId);
    }

    // Standard random assignment based on weights
    const hash = this.hashUserId(userId + test.id);
    const bucket = (hash % 100) + 1;
    
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (bucket <= cumulative) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback
  }

  /**
   * Multi-armed bandit variant assignment
   */
  private assignBanditVariant(test: ABTest, userId: string): ABTestVariant | null {
    const config = test.settings.multiArmedBandit!;
    
    switch (config.algorithm) {
      case 'epsilon-greedy':
        const epsilon = config.explorationRate || 0.1;
        if (Math.random() < epsilon) {
          // Explore: random variant
          return test.variants[Math.floor(Math.random() * test.variants.length)];
        } else {
          // Exploit: best performing variant
          return this.getBestPerformingVariant(test);
        }

      case 'thompson-sampling':
        // Simplified Thompson sampling
        return this.thompsonSampling(test);

      case 'ucb':
        // Upper Confidence Bound
        return this.upperConfidenceBound(test);

      default:
        return this.assignVariant({ ...test, type: 'split' }, userId);
    }
  }

  /**
   * Get best performing variant
   */
  private getBestPerformingVariant(test: ABTest): ABTestVariant {
    let best = test.variants[0];
    let bestRate = 0;

    for (const variant of test.variants) {
      const metrics = variant.metrics || { 
        impressions: 0, 
        conversions: 0, 
        conversionRate: 0 
      };
      
      if (metrics.conversionRate > bestRate) {
        best = variant;
        bestRate = metrics.conversionRate;
      }
    }

    return best;
  }

  /**
   * Thompson sampling implementation
   */
  private thompsonSampling(test: ABTest): ABTestVariant {
    // Simplified: use Beta distribution based on conversions
    const samples = test.variants.map(variant => {
      const metrics = variant.metrics || { 
        impressions: 0, 
        conversions: 0, 
        conversionRate: 0 
      };
      
      // Beta(successes + 1, failures + 1)
      const alpha = metrics.conversions + 1;
      const beta = (metrics.impressions - metrics.conversions) + 1;
      
      // Sample from Beta distribution (simplified)
      return {
        variant,
        sample: this.sampleBeta(alpha, beta)
      };
    });

    // Select variant with highest sample
    samples.sort((a, b) => b.sample - a.sample);
    return samples[0].variant;
  }

  /**
   * Upper Confidence Bound implementation
   */
  private upperConfidenceBound(test: ABTest): ABTestVariant {
    const totalImpressions = test.variants.reduce(
      (sum, v) => sum + (v.metrics?.impressions || 0), 
      0
    );

    if (totalImpressions === 0) {
      // No data yet, return random variant
      return test.variants[Math.floor(Math.random() * test.variants.length)];
    }

    let bestVariant = test.variants[0];
    let bestUCB = -1;

    for (const variant of test.variants) {
      const metrics = variant.metrics || { 
        impressions: 0, 
        conversions: 0, 
        conversionRate: 0 
      };

      if (metrics.impressions === 0) {
        // Unexplored variant has highest priority
        return variant;
      }

      // UCB = average + sqrt(2 * ln(total) / n)
      const average = metrics.conversionRate;
      const exploration = Math.sqrt(2 * Math.log(totalImpressions) / metrics.impressions);
      const ucb = average + exploration;

      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestVariant = variant;
      }
    }

    return bestVariant;
  }

  /**
   * Calculate A/B test significance
   */
  private calculateABSignificance(
    metricsA: any,
    metricsB: any,
    confidenceLevel: number
  ): { significant: boolean; confidence: number; winner: number } {
    // Simplified significance calculation
    const nA = metricsA.impressions || 0;
    const nB = metricsB.impressions || 0;
    const cA = metricsA.conversions || 0;
    const cB = metricsB.conversions || 0;

    if (nA < 30 || nB < 30) {
      return { significant: false, confidence: 0, winner: -1 };
    }

    const pA = cA / nA;
    const pB = cB / nB;
    const pPooled = (cA + cB) / (nA + nB);
    
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/nA + 1/nB));
    const z = Math.abs(pA - pB) / se;
    
    // Z-scores for confidence levels
    const zScores: Record<number, number> = {
      90: 1.645,
      95: 1.96,
      99: 2.576
    };

    const threshold = zScores[confidenceLevel] || 1.96;
    const significant = z > threshold;
    const confidence = this.zToConfidence(z) * 100;
    const winner = pA > pB ? 0 : 1;

    return { significant, confidence, winner };
  }

  /**
   * Convert Z-score to confidence percentage
   */
  private zToConfidence(z: number): number {
    // Simplified normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * Simple Beta distribution sampling
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Simplified: use mean of Beta distribution
    return alpha / (alpha + beta);
  }

  /**
   * Hash user ID to number
   */
  private hashUserId(userId: string): number {
    const hash = crypto.createHash('md5').update(userId).digest();
    return hash.readUInt32BE(0);
  }

  /**
   * Generate test ID
   */
  private generateTestId(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `${slug}-${random}`;
  }

  /**
   * Track impression
   */
  private trackImpression(testId: string, variantId: string, userId: string): void {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    if (!variant.metrics) {
      variant.metrics = {
        impressions: 0,
        conversions: 0,
        conversionRate: 0
      };
    }

    variant.metrics.impressions++;
  }

  /**
   * Update metrics
   */
  private updateMetrics(testId: string, variantId: string, event: string, value?: number): void {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    if (!variant.metrics) {
      variant.metrics = {
        impressions: 0,
        conversions: 0,
        conversionRate: 0
      };
    }

    variant.metrics.conversions++;
    variant.metrics.conversionRate = variant.metrics.conversions / variant.metrics.impressions;
    
    if (value) {
      variant.metrics.averageValue = 
        ((variant.metrics.averageValue || 0) * (variant.metrics.conversions - 1) + value) / 
        variant.metrics.conversions;
    }
  }

  /**
   * Get variant metrics
   */
  private getVariantMetrics(testId: string, variantId: string): any {
    const test = this.tests.get(testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.metrics || {
      impressions: 0,
      conversions: 0,
      conversionRate: 0
    };
  }

  /**
   * Calculate variant statistics
   */
  private calculateStatistics(test: ABTest, variantId: string): any {
    const variant = test.variants.find(v => v.id === variantId);
    if (!variant || !variant.metrics) return null;

    const metrics = variant.metrics;
    const p = metrics.conversionRate;
    const n = metrics.impressions;
    
    // Wilson score confidence interval
    const z = 1.96; // 95% confidence
    const denominator = 1 + z * z / n;
    const centre = (p + z * z / (2 * n)) / denominator;
    const deviation = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;

    return {
      lowerBound: Math.max(0, centre - deviation),
      upperBound: Math.min(1, centre + deviation),
      standardError: Math.sqrt(p * (1 - p) / n)
    };
  }

  /**
   * Calculate final results
   */
  private calculateFinalResults(test: ABTest): any {
    const results = this.getResults(test.id);
    return {
      winner: results.winner?.id,
      confidence: results.confidence,
      significantResults: results.significant,
      performanceByVariant: results.variants.reduce((acc: any, v: any) => {
        acc[v.id] = {
          metrics: v.metrics,
          statistics: v.statistics
        };
        return acc;
      }, {})
    };
  }

  /**
   * Get test duration
   */
  private getTestDuration(test: ABTest): number {
    if (!test.schedule?.startDate) return 0;
    
    const start = test.schedule.startDate.getTime();
    const end = test.schedule.endDate?.getTime() || Date.now();
    
    return end - start;
  }

  /**
   * Start event flush interval
   */
  private startEventFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 60000); // Flush every minute
  }

  /**
   * Flush queued events
   */
  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // In production, send to analytics service
    logger.info('Flushing A/B test events', {
      count: events.length,
      tests: [...new Set(events.map(e => e.testId))]
    });
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushEvents();
  }
}

// Export singleton instance
export const abTesting = new ABTestingService();