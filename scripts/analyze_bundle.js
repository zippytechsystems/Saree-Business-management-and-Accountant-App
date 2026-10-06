import fs from 'node:fs';

const html = fs.readFileSync('dist/stats.html', 'utf8');
const search = 'const data = ';
const start = html.indexOf(search);
const end = html.indexOf(';\n\n    const run = (', start);
const jsonStr = html.slice(start + search.length, end);
const data = JSON.parse(jsonStr);

const nodeParts = data.nodeParts || {};

console.log('====================================================');
console.log('📊 ACCURATE ROLLUP VISUALIZER BUNDLE AUDIT');
console.log('====================================================\n');

for (const chunk of data.tree.children) {
  const modules = [];

  function walk(node, parentPath = '') {
    const curPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.uid && nodeParts[node.uid]) {
      const part = nodeParts[node.uid];
      modules.push({
        path: curPath,
        renderedLength: part.renderedLength || 0,
        gzipLength: part.gzipLength || 0,
      });
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child, curPath);
      }
    }
  }

  walk(chunk);
  modules.sort((a, b) => b.renderedLength - a.renderedLength);

  const totalRaw = modules.reduce((sum, m) => sum + m.renderedLength, 0);
  const totalGzip = modules.reduce((sum, m) => sum + m.gzipLength, 0);

  console.log(`📦 Chunk: ${chunk.name}`);
  console.log(`   Total Size: ${(totalRaw / 1024).toFixed(2)} KB (gzip: ${(totalGzip / 1024).toFixed(2)} KB)`);

  if (chunk.name.includes('vendor-react') || chunk.name.includes('vendor-icons')) {
    console.log('   Top Modules:');
    for (const m of modules.slice(0, 10)) {
      console.log(`     - ${m.path}: ${(m.renderedLength / 1024).toFixed(2)} KB (gzip: ${(m.gzipLength / 1024).toFixed(2)} KB)`);
    }
  }
  console.log('');
}
