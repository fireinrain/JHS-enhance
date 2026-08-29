const fs = require('fs');
const path = require('path');

const allConstants = [
  'isJavBus', 'isJavDb', 'isSearchPage', 'currentHref',
  'Status_RUNNING', 'Status_SUCCESS', 'Status_FAIL', 'Status_LOADING',
  'Status_FILTER', 'Status_FAVORITE', 'Status_HAS_DOWN', 'Status_HAS_WATCH',
  'NO', 'YES'
];

const pluginsDir = 'src/plugins';
const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));

let fixed = 0;

for (const file of files) {
  const filePath = path.join(pluginsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const needed = allConstants.filter(c => new RegExp('\\b' + c + '\\b').test(content));
  if (needed.length === 0) continue;
  
  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*constants[^'"]*['"]/);
  
  if (importMatch) {
    const existing = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const missing = needed.filter(c => !existing.includes(c));
    
    if (missing.length > 0) {
      const newImports = [...existing, ...missing].join(', ');
      const newImportLine = `import { ${newImports} } from '../core/constants.js';`;
      content = content.replace(importMatch[0], newImportLine);
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file} +${missing.join(', ')}`);
      fixed++;
    }
  } else {
    const newImportLine = `import { ${needed.join(', ')} } from '../core/constants.js';`;
    const baseImportMatch = content.match(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*base-plugin[^'"]*['"]/);
    if (baseImportMatch) {
      content = content.replace(baseImportMatch[0], baseImportMatch[0] + '\n' + newImportLine);
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file} +${needed.join(', ')} (new import)`);
      fixed++;
    }
  }
}

console.log(`\nTotal fixed: ${fixed} files`);