export interface MetricEvent {
  metricName: string;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export class MetricsEngine {
  async recordMetric(event: MetricEvent) {
    // console.log(`[MetricsEngine] Recorded ${event.metricName}: ${event.value}`);
    // In production, publish to time-series DB (e.g. Prometheus, Datadog)
  }
}

export const metricsEngine = new MetricsEngine();
