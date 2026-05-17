#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\ASUS\\Desktop\\pfe nouri-saif\\pfe_Saif_Nouri';
const excludePatterns = ['node_modules', 'dist', 'build', '.git', '.vscode'];

// Extended list of mojibake replacements using Unicode escapes
const replacements = {
  '•': '•',
  '—': '–',
  '—': '—',
  '‘': '\u2018',
  '’': '\u2019',
  '“': '\u201C',
  'â€\u009d': '\u201D',
  ' ': ' ',
  'é': 'é',
  'à': 'à',
  'è': 'è',
  'â': 'â',
  'ê': 'ê',
  'ì': 'ì',
  'ï': 'ï',
  'ô': 'ô',
  'ù': 'ù',
  'û': 'û',
  'ç': 'ç',
  'ß': 'ß',
  'Ä': 'Ä',
  'Ë': 'Ë',
  'Ö': 'Ö',
  'ü': 'ü',
  '°': '°',
  '»': '»',
  '«': '«',
  '™': '™',
  '©': '©',
  '®': '®',
  '±': '±',
  '´': '´',
  'µ': 'µ',
  '¹': '¹',
  '²': '²',
  '³': '³',
  'd’autre': "d'autre",
  ' ': ' '
};

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function getJsFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (shouldExclude(fullPath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getJsFiles(fullPath));
    } else if (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply all replacements
    for (const [broken, correct] of Object.entries(replacements)) {
      if (content.includes(broken)) {
        content = content.split(broken).join(correct);
      }
    }
    
    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    console.error(`✗ Error with ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

console.log('================================');
console.log('Advanced UTF-8 Encoding Fix');
console.log('================================');
console.log(`Project root: ${projectRoot}\n`);

const files = getJsFiles(projectRoot);
console.log(`Files to process: ${files.length}\n`);

let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    console.log(`✓ Fixed: ${path.relative(projectRoot, file)}`);
    fixed++;
  }
}

console.log('\n================================');
console.log(`Files fixed: ${fixed}`);
console.log('================================');
