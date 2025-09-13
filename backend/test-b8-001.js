// B8-001 Backend Validation Script
// Quick validation of all B8-001 endpoints

const endpoints = [
  // Argentina Geographic Expansion APIs
  {
    method: 'GET',
    url: 'http://localhost:3000/api/providers/search?city=cordoba',
    description: 'Córdoba provider search'
  },
  {
    method: 'GET', 
    url: 'http://localhost:3000/api/providers/search?city=rosario',
    description: 'Rosario provider search'
  },
  {
    method: 'POST',
    url: 'http://localhost:3000/api/bookings/geo-match',
    body: {
      latitude: -31.4201,
      longitude: -64.1888,
      serviceType: 'barberia',
      preferredTime: new Date(Date.now() + 24*60*60*1000).toISOString()
    },
    description: 'Geographic booking matching'
  },

  // Psychology Vertical APIs
  {
    method: 'GET',
    url: 'http://localhost:3000/api/psychology/questionnaires',
    description: 'Mental health questionnaires'
  },
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/psychology/specializations',
    description: 'Psychology specializations'
  },

  // Advanced Booking Features
  {
    method: 'GET',
    url: 'http://localhost:3000/api/referrals/system',
    description: 'Referral system status'
  },
  {
    method: 'GET',
    url: 'http://localhost:3000/api/analytics/intelligent',
    description: 'Business intelligence analytics'
  },

  // Communication & Integration
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/communications/optimization',
    description: 'Multi-channel communication optimization'
  },

  // Backend Optimization
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/admin/monitoring',
    description: 'Comprehensive monitoring status'
  },
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/admin/api-documentation',
    description: 'API documentation'
  },

  // B8-001 Integration Master
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/b8/validate',
    description: 'B8-001 objectives validation'
  },
  {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/b8/market-readiness',
    description: 'Argentina market readiness'
  }
];

async function testEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(endpoint.url, options);
    const result = await response.json();
    
    console.log(`✅ ${endpoint.description}: ${response.status}`);
    
    if (response.status === 200 && result.success) {
      console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    return { success: response.status === 200, endpoint: endpoint.description };
  } catch (error) {
    console.log(`❌ ${endpoint.description}: ${error.message}`);
    return { success: false, endpoint: endpoint.description, error: error.message };
  }
}

async function validateB8Implementation() {
  console.log('🚀 B8-001 Backend Validation Starting...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  
  console.log('📊 B8-001 Validation Summary:');
  console.log(`   Total Endpoints: ${totalCount}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('🎉 B8-001 Backend Implementation: EXCELLENT');
  } else if (successRate >= 80) {
    console.log('✅ B8-001 Backend Implementation: GOOD');
  } else if (successRate >= 70) {
    console.log('⚠️  B8-001 Backend Implementation: NEEDS IMPROVEMENT');
  } else {
    console.log('❌ B8-001 Backend Implementation: CRITICAL ISSUES');
  }
  
  // Critical endpoints validation
  const criticalEndpoints = [
    'Córdoba provider search',
    'Rosario provider search', 
    'Geographic booking matching',
    'Psychology specializations',
    'Mental health questionnaires',
    'B8-001 objectives validation'
  ];
  
  const criticalSuccess = results.filter(r => 
    criticalEndpoints.includes(r.endpoint) && r.success
  ).length;
  
  console.log(`\n🎯 Critical Endpoints: ${criticalSuccess}/${criticalEndpoints.length} working`);
  
  if (criticalSuccess === criticalEndpoints.length) {
    console.log('✅ All critical B8-001 objectives operational!');
  } else {
    console.log('⚠️  Some critical B8-001 endpoints need attention');
  }
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch for validation...');
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

validateB8Implementation().catch(console.error);