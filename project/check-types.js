// TypeScript validation check script
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const srcDir = './src';
const errors = [];

function getAllTsFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

console.log('Checking TypeScript files for errors...\n');

try {
  // Run TypeScript compiler check
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n✓ TypeScript compilation check passed!');
} catch (error) {
  console.error('\n✗ TypeScript compilation errors found');
  process.exit(1);
}

const tsFiles = getAllTsFiles(srcDir);
console.log(`\nTotal TypeScript files checked: ${tsFiles.length}`);
console.log('\n✓ All TypeScript checks passed!');
