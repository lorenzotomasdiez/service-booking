// Analytics endpoint test utility for development
import { dev } from '$app/environment';
import { apiClient } from '../api/client';

/**
 * Test function to verify analytics endpoint connectivity
 * Only runs in development mode
 */
export async function testAnalyticsEndpoint(): Promise<boolean> {
  if (!dev) {
    return true; // Skip in production
  }

  try {
    console.log('[AnalyticsTest] Testing frontend analytics endpoint...');

    // Test with a simple dummy event
    const testEvent = {
      events: [
        {
          type: 'click' as const,
          target: 'test-button',
          timestamp: new Date().toISOString(),
          metadata: {
            testMode: true,
            purpose: 'endpoint-connectivity-test'
          }
        }
      ],
      timestamp: new Date().toISOString(),
      sessionId: 'test-session-' + Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: 'development' as const
    };

    const response = await apiClient.post('/analytics/frontend-events', testEvent);

    console.log('[AnalyticsTest] ✅ Analytics endpoint test successful:', response);
    return true;

  } catch (error) {
    console.error('[AnalyticsTest] ❌ Analytics endpoint test failed:', error);
    return false;
  }
}

/**
 * Test analytics summary endpoint
 */
export async function testAnalyticsSummary(): Promise<boolean> {
  if (!dev) {
    return true;
  }

  try {
    console.log('[AnalyticsTest] Testing analytics summary endpoint...');

    const response = await apiClient.get('/analytics/frontend-summary');

    console.log('[AnalyticsTest] ✅ Analytics summary test successful:', response);
    return true;

  } catch (error) {
    console.error('[AnalyticsTest] ❌ Analytics summary test failed:', error);
    return false;
  }
}

/**
 * Run all analytics tests in development
 */
export async function runAnalyticsTests(): Promise<void> {
  if (!dev) {
    return;
  }

  console.group('[AnalyticsTest] Running analytics endpoint tests...');

  const summaryTest = await testAnalyticsSummary();
  const eventsTest = await testAnalyticsEndpoint();

  if (summaryTest && eventsTest) {
    console.log('[AnalyticsTest] ✅ All analytics tests passed!');
  } else {
    console.warn('[AnalyticsTest] ⚠️ Some analytics tests failed - check logs above');
  }

  console.groupEnd();
}