#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\ASUS\\Desktop\\pfe nouri-saif\\pfe_Saif_Nouri';
const excludePatterns = ['node_modules', 'dist', 'build', '.git', '.vscode'];

// Comprehensive mojibake replacements
const replacements = {
  // Smart quotes and dashes
  '•': '•',
  '—': '–',
  '—': '—',
  ''': "'",
  ''': "'",
  '"': '"',
  'â€\u009d': '"',
  'â€ƒ': ' ',
  'â€š': ',',
  '™': '™',
  
  // French accents
  'é': 'é',
  'è': 'è',
  'ì': 'ì',
  'Ã­': 'í',
  'Ã': 'ì',
  'à': 'à',
  'â': 'â',
  'Ã£': 'ã',
  'Ã¤': 'ä',
  'Ã¥': 'å',
  'Ã¦': 'æ',
  'ç': 'ç',
  'è': 'è',
  'é': 'é',
  'Ãª': 'ê',
  'Ã«': 'ë',
  'ì': 'ì',
  'Ã­': 'í',
  'Ã®': 'î',
  'ï': 'ï',
  'Ã°': 'ð',
  'Ã±': 'ñ',
  'Ã²': 'ò',
  'Ã³': 'ó',
  'ô': 'ô',
  'Ãµ': 'õ',
  'Ã¶': 'ö',
  'Ã·': '÷',
  'Ã¸': 'ø',
  'ù': 'ù',
  'Ãº': 'ú',
  'û': 'û',
  'ü': 'ü',
  'Ã½': 'ý',
  'Ã¾': 'þ',
  'Ã¿': 'ÿ',
  'À': 'À',
  'Ã': 'Á',
  'Ã‚': 'Â',
  'Ãƒ': 'Ã',
  'Ã„': 'Ä',
  'Ã…': 'Å',
  'Ã†': 'Æ',
  'Ã‡': 'Ç',
  'É': 'É',
  'Ê': 'Ê',
  'Ë': 'Ë',
  'Ì': 'Ì',
  'Î': 'Î',
  'Ã': 'Ï',
  'Ã'': 'Ñ',
  'Ã'': 'Ò',
  'Ã"': 'Ó',
  'Ã"': 'Ô',
  'Ã•': 'Õ',
  'Ö': 'Ö',
  'Ã—': '×',
  'Ã˜': 'Ø',
  'Ã™': 'Ù',
  'Ãš': 'Ú',
  'Ã›': 'Û',
  'Ãœ': 'Ü',
  'Ã': 'Ý',
  'Ãž': 'Þ',
  'ß': 'ß',
  
  // Common replacements
  'véhicule': 'véhicule',
  'véhicules': 'véhicules',
  'Véhicule': 'Véhicule',
  'Véhicules': 'Véhicules',
  'référence': 'référence',
  'Référence': 'Référence',
  'recherche': 'recherche',
  'Récherche': 'Recherche',
  'récherche': 'recherche',
  'modèle': 'modèle',
  'Modèle': 'Modèle',
  'modèles': 'modèles',
  'disponibilité': 'disponibilité',
  'Disponibilité': 'Disponibilité',
  'pré': 'pré',
  'prié': 'prié',
  'orienté': 'orienté',
  'Orienté': 'Orienté',
  'réactif': 'réactif',
  'Réactif': 'Réactif',
  'client': 'client',
  'conseils': 'conseils',
  'conseil': 'conseil',
  'Conseil': 'Conseil',
  'technique': 'technique',
  'Technique': 'Technique',
  'VIN': 'VIN',
  'Vin': 'VIN',
  'vin': 'VIN',
  'comptétitif': 'compétitif',
  'Compétitif': 'Compétitif',
  'prix': 'prix',
  'Prix': 'Prix',
  
  // Special characters
  '°': '°',
  '»': '»',
  '«': '«',
  '©': '©',
  '®': '®',
  '±': '±',
  'Â´': '´',
  'Âµ': 'µ',
  'Â¹': '¹',
  'Â²': '²',
  'Â³': '³',
  ' ': ' ',
  'Ã\u0092': '',
  ''': "'",
  'd'autre': "d'autre",
  'd'autre': "d'autre"
};

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (shouldExclude(fullPath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (
      item.endsWith('.js') || 
      item.endsWith('.jsx') || 
      item.endsWith('.json') || 
      item.endsWith('.sql') ||
      item.endsWith('.ts') ||
      item.endsWith('.tsx')
    ) {
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

console.log('\n================================');
console.log('COMPREHENSIVE UTF-8 FIX');
console.log('================================');
console.log(`Project root: ${projectRoot}\n`);

const files = getAllFiles(projectRoot);
console.log(`Files to process: ${files.length}\n`);

let fixed = 0;
const fixedFiles = [];

for (const file of files) {
  if (fixFile(file)) {
    const relPath = path.relative(projectRoot, file);
    console.log(`✓ Fixed: ${relPath}`);
    fixedFiles.push(relPath);
    fixed++;
  }
}

console.log('\n================================');
console.log(`Total files fixed: ${fixed}`);
console.log('================================');

if (fixed > 0) {
  console.log('\nFiles corrected:');
  fixedFiles.forEach(f => console.log(`  • ${f}`));
}

console.log('\n✅ Project-wide UTF-8 encoding complete!\n');
