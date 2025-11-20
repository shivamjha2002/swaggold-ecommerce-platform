/**
 * API Integration Test Script
 * 
 * This script tests the connection between the frontend API client and the backend.
 * Run this with: npx tsx test-api-integration.ts
 * 
 * Prerequisites:
 * - Backend server must be running on the configured API URL
 * - Environment variables must be properly configured
 */

import axios from 'axios';

// Load environment variables
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

interface TestResult {
    endpoint: string;
    method: string;
    status: 'PASS' | 'FAIL';
    statusCode?: number;
    message: string;
    duration?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
    requiresAuth: boolean = false
): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const config: any = {
            method,
            url,
            timeout: 5000,
        };

        if (data) {
            config.data = data;
        }

        if (requiresAuth) {
            // For auth-required endpoints, we expect 401 without token
            config.headers = {};
        }

        const response = await axios(config);
        const duration = Date.now() - startTime;

        return {
            endpoint,
            method,
            status: 'PASS',
            statusCode: response.status,
            message: `Success: ${response.status} ${response.statusText}`,
            duration,
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;

        if (requiresAuth && error.response?.status === 401) {
            // Expected behavior for protected endpoints without auth
            return {
                endpoint,
                method,
                status: 'PASS',
                statusCode: 401,
                message: 'Correctly requires authentication',
                duration,
            };
        }

        if (error.code === 'ECONNREFUSED') {
            return {
                endpoint,
                method,
                status: 'FAIL',
                message: 'Connection refused - Backend server not running',
                duration,
            };
        }

        return {
            endpoint,
            method,
            status: 'FAIL',
            statusCode: error.response?.status,
            message: error.message || 'Unknown error',
            duration,
        };
    }
}

async function runTests() {
    console.log('🧪 API Integration Test Suite\n');
    console.log(`📍 Testing API at: ${API_BASE_URL}\n`);
    console.log('─'.repeat(80));

    // Test 1: Health check endpoint
    console.log('\n1️⃣  Testing health check endpoint...');
    const healthResult = await testEndpoint('/health');
    results.push(healthResult);
    console.log(`   ${healthResult.status === 'PASS' ? '✅' : '❌'} ${healthResult.message} (${healthResult.duration}ms)`);

    // Test 2: Gold price endpoint (public)
    console.log('\n2️⃣  Testing gold price endpoint (public)...');
    const priceResult = await testEndpoint('/prices/gold/live');
    results.push(priceResult);
    console.log(`   ${priceResult.status === 'PASS' ? '✅' : '❌'} ${priceResult.message} (${priceResult.duration}ms)`);

    // Test 3: Products endpoint (should require auth)
    console.log('\n3️⃣  Testing products endpoint (protected)...');
    const productsResult = await testEndpoint('/products', 'GET', undefined, true);
    results.push(productsResult);
    console.log(`   ${productsResult.status === 'PASS' ? '✅' : '❌'} ${productsResult.message} (${productsResult.duration}ms)`);

    // Test 4: Login endpoint (public)
    console.log('\n4️⃣  Testing login endpoint (public)...');
    const loginResult = await testEndpoint('/auth/login', 'POST', {
        username: 'test',
        password: 'test',
    });
    results.push(loginResult);
    console.log(`   ${loginResult.status === 'PASS' ? '✅' : '❌'} ${loginResult.message} (${loginResult.duration}ms)`);

    // Test 5: Cart endpoint (should require auth)
    console.log('\n5️⃣  Testing cart endpoint (protected)...');
    const cartResult = await testEndpoint('/cart', 'GET', undefined, true);
    results.push(cartResult);
    console.log(`   ${cartResult.status === 'PASS' ? '✅' : '❌'} ${cartResult.message} (${cartResult.duration}ms)`);

    // Print summary
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Test Summary\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Failed Tests:');
        results
            .filter(r => r.status === 'FAIL')
            .forEach(r => {
                console.log(`   - ${r.method} ${r.endpoint}: ${r.message}`);
            });
    }

    console.log('\n' + '─'.repeat(80));

    if (failed === 0) {
        console.log('\n🎉 All tests passed! API integration is working correctly.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the backend server and configuration.\n');
        console.log('💡 Tips:');
        console.log('   - Ensure backend server is running: cd backend && python run.py');
        console.log('   - Check VITE_API_URL in .env file');
        console.log('   - Verify backend is accessible at the configured URL\n');
    }

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed with error:', error.message);
    process.exit(1);
});
