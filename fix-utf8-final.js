#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\ASUS\\Desktop\\pfe nouri-saif\\pfe_Saif_Nouri';
const excludePatterns = ['node_modules', 'dist', 'build', '.git', '.vscode'];

const replacements = {
  '•': '•',
  '—': '–',
  '—': '—',
  ''': "'",
  ''': "'",
  '"': '"',
  '™': '™',
  'é': 'é',
  'è': 'è',
  'ô': 'ô',
  'â': 'â',
  'ì': 'ì',
  'ï': 'ï',
  'ù': 'ù',
  'û': 'û',
  'ç': 'ç',
  'à': 'à',
  'À': 'À',
  'É': 'É',
  'Ê': 'Ê',
  'Ë': 'Ë',
  'Ì': 'Ì',
  'Î': 'Î',
  'Ö': 'Ö',
  'ü': 'ü',
  'ß': 'ß',
  'véhicule': 'véhicule',
  'véhicules': 'véhicules',
  'Véhicule': 'Véhicule',
  'Véhicules': 'Véhicules',
  'référence': 'référence',
  'Référence': 'Référence',
  'récherche': 'recherche',
  'Récherche': 'Recherche',
  'modèle': 'modèle',
  'Modèle': 'Modèle',
  'modèles': 'modèles',
  'disponibilité': 'disponibilité',
  'Disponibilité': 'Disponibilité',
  'orienté': 'orienté',
  'Orienté': 'Orienté',
  'réactif': 'réactif',
  'Réactif': 'Réactif',
  'comptétitif': 'compétitif',
  'Compétitif': 'Compétitif',
  'pré': 'pré',
  'conseil': 'conseil',
  'Conseil': 'Conseil',
  'technique': 'technique',
  'Technique': 'Technique',
  'prié': 'prié',
  'prix': 'prix',
  'Prix': 'Prix',
  '°': '°',
  '»': '»',
  '«': '«',
  '©': '©',
  '®': '®',
  '±': '±',
  ' ': ' ',
  ''': "'",
  'd'': "d'"
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
      item.endsWith('.sql')
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
    
    for (const [broken, correct] of Object.entries(replacements)) {
      if (content.includes(broken)) {
        content = content.split(broken).join(correct);
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

console.log('\n================================');
console.log('COMPREHENSIVE UTF-8 FIX');
console.log('================================');
console.log(`Processing: ${projectRoot}\n`);

const files = getAllFiles(projectRoot);
console.log(`Files to scan: ${files.length}\n`);

let fixed = 0;

for (const file of files) {
  if (fixFile(file)) {
    console.log(`✓ ${path.relative(projectRoot, file)}`);
    fixed++;
  }
}

console.log('\n================================');
console.log(`COMPLETE: ${fixed} files fixed`);
console.log('================================\n');
