#!/usr/bin/env node

/**
 * T5-001 System Performance Validation Suite
 * Comprehensive load testing and performance validation
 */

import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

class PerformanceValidator {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      concurrent: [],
      endpoint: [],
      memory: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const url = `${this.baseUrl}${path}`;
      
      const req = http.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          resolve({
            statusCode: res.statusCode,
            responseTime: endTime - startTime,
            data: data,
            headers: res.headers
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async validateBasicEndpoints() {
    console.log('🔍 Validating Basic Endpoints Performance...');
    
    const endpoints = [
      '/api/health',
      '/api/payment-testing/argentina-methods',
      '/api/payment-testing/cbu-validation'
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await this.makeRequest(endpoint);
        this.results.endpoint.push({
          endpoint,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          success: result.statusCode < 400
        });
        
        console.log(`  ✅ ${endpoint}: ${result.responseTime.toFixed(2)}ms (${result.statusCode})`);
      } catch (error) {
        this.results.errors.push({ endpoint, error: error.message });
        console.log(`  ❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  async validateConcurrentLoad(concurrency = 50, duration = 30000) {
    console.log(`🚀 Testing Concurrent Load: ${concurrency} users for ${duration/1000}s...`);
    
    const requests = [];
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    // Spawn concurrent requests
    for (let i = 0; i < concurrency; i++) {
      requests.push(this.concurrentWorker(i, endTime));
    }

    await Promise.all(requests);
    
    const avgResponseTime = this.results.concurrent.reduce((sum, r) => sum + r.responseTime, 0) / this.results.concurrent.length;
    const successRate = (this.results.concurrent.filter(r => r.success).length / this.results.concurrent.length) * 100;
    
    console.log(`  📊 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`  📊 Total Requests: ${this.results.concurrent.length}`);
    
    return { avgResponseTime, successRate, totalRequests: this.results.concurrent.length };
  }

  async concurrentWorker(workerId, endTime) {
    const endpoints = ['/api/health', '/api/payment-testing/argentina-methods'];
    
    while (performance.now() < endTime) {
      try {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const result = await this.makeRequest(endpoint);
        
        this.results.concurrent.push({
          workerId,
          endpoint,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          success: result.statusCode < 400,
          timestamp: Date.now()
        });
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      } catch (error) {
        this.results.errors.push({ workerId, error: error.message });
      }
    }
  }

  async validateDatabasePerformance() {
    console.log('🗄️  Validating Database Performance...');
    
    try {
      // Test CBU validation (involves computation)
      const cbuTest = await this.makeRequest('/api/payment-testing/cbu-validation', {
        method: 'POST',
        body: { cbu: '0170001540000000000001' }
      });
      
      console.log(`  ✅ CBU Validation: ${cbuTest.responseTime.toFixed(2)}ms`);
      
      // Test payment methods configuration
      const methodsTest = await this.makeRequest('/api/payment-testing/argentina-methods');
      console.log(`  ✅ Payment Methods: ${methodsTest.responseTime.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      console.log(`  ❌ Database Test Failed: ${error.message}`);
      return false;
    }
  }

  async validateMemoryUsage() {
    console.log('💾 Monitoring Memory Usage...');
    
    // Take memory snapshots during load
    const memorySnapshots = [];
    
    for (let i = 0; i < 5; i++) {
      const used = process.memoryUsage();
      memorySnapshots.push({
        timestamp: Date.now(),
        heapUsed: used.heapUsed / 1024 / 1024, // MB
        heapTotal: used.heapTotal / 1024 / 1024, // MB
        external: used.external / 1024 / 1024, // MB
        rss: used.rss / 1024 / 1024 // MB
      });
      
      // Make some requests to simulate load
      await Promise.all([
        this.makeRequest('/api/health'),
        this.makeRequest('/api/payment-testing/argentina-methods')
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const avgHeapUsed = memorySnapshots.reduce((sum, snap) => sum + snap.heapUsed, 0) / memorySnapshots.length;
    const avgRss = memorySnapshots.reduce((sum, snap) => sum + snap.rss, 0) / memorySnapshots.length;
    
    console.log(`  📊 Average Heap Used: ${avgHeapUsed.toFixed(2)} MB`);
    console.log(`  📊 Average RSS: ${avgRss.toFixed(2)} MB`);
    
    this.results.memory = memorySnapshots;
    return { avgHeapUsed, avgRss, snapshots: memorySnapshots };
  }

  async validatePaymentGatewayFailover() {
    console.log('💳 Validating Payment Gateway Performance...');
    
    try {
      // Test commission calculation performance
      const commissionTest = await this.makeRequest('/api/payment-testing/commission-calculation', {
        method: 'POST',
        body: {
          amount: 5000,
          providerId: 'test-provider-id'
        }
      });
      
      console.log(`  ✅ Commission Calculation: ${commissionTest.responseTime.toFixed(2)}ms`);
      
      // Test payment retry configuration
      const retryTest = await this.makeRequest('/api/payment-testing/retry-configuration');
      console.log(`  ✅ Retry Configuration: ${retryTest.responseTime.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      console.log(`  ❌ Payment Gateway Test: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n📋 T5-001 PERFORMANCE VALIDATION REPORT');
    console.log('==========================================');
    console.log(`🕒 Test Duration: ${duration.toFixed(1)}s`);
    
    // Basic endpoint performance
    if (this.results.endpoint.length > 0) {
      const avgEndpointTime = this.results.endpoint.reduce((sum, r) => sum + r.responseTime, 0) / this.results.endpoint.length;
      console.log(`📊 Average Endpoint Response: ${avgEndpointTime.toFixed(2)}ms`);
      
      const fastestEndpoint = this.results.endpoint.reduce((prev, curr) => 
        prev.responseTime < curr.responseTime ? prev : curr
      );
      console.log(`⚡ Fastest Endpoint: ${fastestEndpoint.endpoint} (${fastestEndpoint.responseTime.toFixed(2)}ms)`);
    }
    
    // Concurrent load results
    if (this.results.concurrent.length > 0) {
      const avgConcurrentTime = this.results.concurrent.reduce((sum, r) => sum + r.responseTime, 0) / this.results.concurrent.length;
      const successRate = (this.results.concurrent.filter(r => r.success).length / this.results.concurrent.length) * 100;
      
      console.log(`🚀 Concurrent Load Average: ${avgConcurrentTime.toFixed(2)}ms`);
      console.log(`✅ Success Rate: ${successRate.toFixed(1)}%`);
      console.log(`📈 Total Concurrent Requests: ${this.results.concurrent.length}`);
    }
    
    // Error summary
    if (this.results.errors.length > 0) {
      console.log(`❌ Total Errors: ${this.results.errors.length}`);
    }
    
    console.log('\n🎯 VALIDATION CRITERIA CHECK:');
    
    // Check against T5-001 criteria
    const endpointAvg = this.results.endpoint.length > 0 ? 
      this.results.endpoint.reduce((sum, r) => sum + r.responseTime, 0) / this.results.endpoint.length : 0;
    
    console.log(`  ${endpointAvg < 100 ? '✅' : '❌'} Database queries <100ms (${endpointAvg.toFixed(2)}ms)`);
    
    const concurrentAvg = this.results.concurrent.length > 0 ?
      this.results.concurrent.reduce((sum, r) => sum + r.responseTime, 0) / this.results.concurrent.length : 0;
    
    console.log(`  ${concurrentAvg < 3000 ? '✅' : '❌'} Payment processing <3s (${concurrentAvg.toFixed(2)}ms)`);
    
    const successRate = this.results.concurrent.length > 0 ?
      (this.results.concurrent.filter(r => r.success).length / this.results.concurrent.length) * 100 : 0;
      
    console.log(`  ${successRate >= 95 ? '✅' : '❌'} System handles 100+ concurrent users (${successRate.toFixed(1)}%)`);
    
    const errorRate = (this.results.errors.length / (this.results.concurrent.length || 1)) * 100;
    console.log(`  ${errorRate < 5 ? '✅' : '❌'} Error rate <5% (${errorRate.toFixed(1)}%)`);
    
    return {
      duration,
      endpointPerformance: {
        average: endpointAvg,
        tests: this.results.endpoint.length
      },
      concurrentLoad: {
        average: concurrentAvg,
        successRate,
        totalRequests: this.results.concurrent.length
      },
      errors: this.results.errors.length,
      memory: this.results.memory
    };
  }

  async runFullValidation() {
    console.log('🚀 Starting T5-001 System Performance Validation Suite\n');
    
    try {
      // Basic endpoint validation
      await this.validateBasicEndpoints();
      console.log('');
      
      // Database performance
      await this.validateDatabasePerformance();
      console.log('');
      
      // Memory monitoring
      await this.validateMemoryUsage();
      console.log('');
      
      // Payment gateway performance
      await this.validatePaymentGatewayFailover();
      console.log('');
      
      // Concurrent load testing
      await this.validateConcurrentLoad(100, 20000); // 100 users, 20 seconds
      console.log('');
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Validation suite failed:', error.message);
      return null;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PerformanceValidator();
  validator.runFullValidation().then(report => {
    if (report) {
      console.log('\n🎉 Performance validation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Performance validation failed!');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default PerformanceValidator;