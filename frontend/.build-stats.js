// Simple build statistics script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

function analyzeDirectory(dir, results = { js: [], css: [], images: [], other: [] }) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeDirectory(filePath, results);
    } else {
      const ext = path.extname(file).toLowerCase();
      const size = getFileSizeInKB(filePath);
      const fileInfo = { name: file, size: parseFloat(size), path: filePath };
      
      if (ext === '.js') {
        results.js.push(fileInfo);
      } else if (ext === '.css') {
        results.css.push(fileInfo);
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
        results.images.push(fileInfo);
      } else if (ext !== '.html') {
        results.other.push(fileInfo);
      }
    }
  });
  
  return results;
}

function printResults(results) {
  console.log('\n📊 Build Statistics\n');
  console.log('='.repeat(60));
  
  // JavaScript files
  console.log('\n📦 JavaScript Files:');
  const totalJS = results.js.reduce((sum, file) => sum + file.size, 0);
  results.js.sort((a, b) => b.size - a.size).forEach(file => {
    console.log(`  ${file.name.padEnd(40)} ${file.size.toFixed(2).padStart(10)} KB`);
  });
  console.log(`  ${'TOTAL'.padEnd(40)} ${totalJS.toFixed(2).padStart(10)} KB`);
  
  // CSS files
  console.log('\n🎨 CSS Files:');
  const totalCSS = results.css.reduce((sum, file) => sum + file.size, 0);
  results.css.sort((a, b) => b.size - a.size).forEach(file => {
    console.log(`  ${file.name.padEnd(40)} ${file.size.toFixed(2).padStart(10)} KB`);
  });
  console.log(`  ${'TOTAL'.padEnd(40)} ${totalCSS.toFixed(2).padStart(10)} KB`);
  
  // Images
  if (results.images.length > 0) {
    console.log('\n🖼️  Images:');
    const totalImages = results.images.reduce((sum, file) => sum + file.size, 0);
    results.images.sort((a, b) => b.size - a.size).forEach(file => {
      console.log(`  ${file.name.padEnd(40)} ${file.size.toFixed(2).padStart(10)} KB`);
    });
    console.log(`  ${'TOTAL'.padEnd(40)} ${totalImages.toFixed(2).padStart(10)} KB`);
  }
  
  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Total JavaScript: ${totalJS.toFixed(2)} KB`);
  console.log(`  Total CSS: ${totalCSS.toFixed(2)} KB`);
  if (results.images.length > 0) {
    const totalImages = results.images.reduce((sum, file) => sum + file.size, 0);
    console.log(`  Total Images: ${totalImages.toFixed(2)} KB`);
    console.log(`  Grand Total: ${(totalJS + totalCSS + totalImages).toFixed(2)} KB`);
  } else {
    console.log(`  Grand Total: ${(totalJS + totalCSS).toFixed(2)} KB`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run analysis
const distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ dist folder not found. Run "npm run build" first.');
  process.exit(1);
}

const results = analyzeDirectory(distPath);
printResults(results);
