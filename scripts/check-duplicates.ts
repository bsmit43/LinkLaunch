import { DIRECTORIES } from '../src/lib/data/directories.ts';

const ids = DIRECTORIES.map(d => d.id);
const urls = DIRECTORIES.map(d => d.url);

console.log('Total directories:', DIRECTORIES.length);
console.log('Unique IDs:', new Set(ids).size);
console.log('Unique URLs:', new Set(urls).size);

// Find duplicate URLs
const urlCounts = new Map<string, number>();
urls.forEach(url => {
  urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
});

const duplicateUrls = [...urlCounts.entries()].filter(([_, count]) => count > 1);
console.log('\nDuplicate URLs:');
duplicateUrls.forEach(([url, count]) => {
  console.log(`  ${url}: ${count} times`);
});
