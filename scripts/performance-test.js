/**
 * Performance testing script
 * Tests page load times and generates a performance report
 * 
 * Usage: node scripts/performance-test.js [url]
 * Example: node scripts/performance-test.js http://localhost:4173
 */

const http = require('http');
const https = require('https');

const DEFAULT_URL = 'http://localhost:4173';
const TEST_ITERATIONS = 5;

// Parse URL from command line or use default
const targetUrl = process.argv[2] || DEFAULT_URL;

console.log('🚀 Performance Testing Tool');
console.log('==========================\n');
console.log(`Target URL: ${targetUrl}`);
console.log(`Iterations: ${TEST_ITERATIONS}\n`);

/**
 * Measure page load time
 */
function measureLoadTime(url) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const endTime = Date.now();
                const duration = endTime - startTime;

                resolve({
                    duration,
                    statusCode: res.statusCode,
                    contentLength: data.length,
                    headers: res.headers,
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Run performance tests
 */
async function runTests() {
    const results = [];

    console.log('Running tests...\n');

    for (let i = 0; i < TEST_ITERATIONS; i++) {
        try {
            process.stdout.write(`Test ${i + 1}/${TEST_ITERATIONS}... `);

            const result = await measureLoadTime(targetUrl);
            results.push(result);

            console.log(`✓ ${result.duration}ms`);

            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log(`✗ Error: ${error.message}`);
        }
    }

    return results;
}

/**
 * Calculate statistics
 */
function calculateStats(results) {
    if (results.length === 0) {
        return null;
    }

    const durations = results.map(r => r.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // Calculate median
    const sorted = [...durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Calculate standard deviation
    const variance = durations.reduce((sum, duration) => {
        return sum + Math.pow(duration - avg, 2);
    }, 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    return {
        count: results.length,
        average: avg,
        median,
        min,
        max,
        stdDev,
        contentLength: results[0].contentLength,
        statusCode: results[0].statusCode,
    };
}

/**
 * Print report
 */
function printReport(stats) {
    if (!stats) {
        console.log('\n❌ No results to report\n');
        return;
    }

    console.log('\n📊 Performance Report');
    console.log('====================\n');

    console.log('Load Time Statistics:');
    console.log(`  Average:    ${stats.average.toFixed(2)}ms`);
    console.log(`  Median:     ${stats.median.toFixed(2)}ms`);
    console.log(`  Min:        ${stats.min.toFixed(2)}ms`);
    console.log(`  Max:        ${stats.max.toFixed(2)}ms`);
    console.log(`  Std Dev:    ${stats.stdDev.toFixed(2)}ms`);
    console.log(`  Iterations: ${stats.count}`);

    console.log('\nResponse Details:');
    console.log(`  Status Code:    ${stats.statusCode}`);
    console.log(`  Content Length: ${(stats.contentLength / 1024).toFixed(2)} KB`);

    console.log('\nPerformance Assessment:');

    // Assess performance
    if (stats.average < 100) {
        console.log('  ✅ Excellent - Very fast load times');
    } else if (stats.average < 300) {
        console.log('  ✅ Good - Fast load times');
    } else if (stats.average < 1000) {
        console.log('  ⚠️  Fair - Acceptable load times');
    } else if (stats.average < 3000) {
        console.log('  ⚠️  Slow - Consider optimization');
    } else {
        console.log('  ❌ Very Slow - Optimization needed');
    }

    // Check consistency
    if (stats.stdDev < stats.average * 0.1) {
        console.log('  ✅ Consistent - Low variance in load times');
    } else if (stats.stdDev < stats.average * 0.3) {
        console.log('  ⚠️  Moderate variance in load times');
    } else {
        console.log('  ❌ High variance - Inconsistent performance');
    }

    console.log('\nRecommendations:');

    if (stats.average > 1000) {
        console.log('  • Enable compression (gzip/brotli)');
        console.log('  • Optimize bundle size');
        console.log('  • Use CDN for static assets');
    }

    if (stats.stdDev > stats.average * 0.3) {
        console.log('  • Check server resources');
        console.log('  • Implement caching');
        console.log('  • Review database queries');
    }

    if (stats.contentLength > 500 * 1024) {
        console.log('  • HTML file is large - consider code splitting');
        console.log('  • Remove unused dependencies');
    }

    console.log('');
}

/**
 * Main execution
 */
async function main() {
    try {
        const results = await runTests();
        const stats = calculateStats(results);
        printReport(stats);

        // Exit with appropriate code
        if (stats && stats.average < 1000) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Error running tests:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { measureLoadTime, calculateStats };
