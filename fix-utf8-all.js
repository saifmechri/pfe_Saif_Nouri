#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\ASUS\\Desktop\\pfe nouri-saif\\pfe_Saif_Nouri';
const excludePatterns = ['node_modules', 'dist', 'build', '.git', '.vscode'];

// Replacements map for mojibake to correct UTF-8
const replacements = {
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
  'véhicules': 'véhicules',
  'véhicule': 'véhicule',
  'Véhicule': 'Véhicule',
  'Véhicules': 'Véhicules',
  'création': 'création',
  'récupère': 'récupère',
  'récupérer': 'récupérer',
  'modifié': 'modifié',
  'modifiée': 'modifiée',
  'ajouté': 'ajouté',
  'ajoutée': 'ajoutée',
  'succès': 'succès',
  'supprimé': 'supprimé',
  'supprimée': 'supprimée',
  'créer': 'créer',
  'Créer': 'Créer',
  'Création': 'Création',
  'définir': 'définir',
  'pièce': 'pièce',
  'pièces': 'pièces',
  'Pièce': 'Pièce',
  'Pièces': 'Pièces',
  'Révision': 'Révision',
  'révision': 'révision',
  'Réparation': 'Réparation',
  'réparation': 'réparation',
  'Kilométrage': 'Kilométrage',
  'kilométrage': 'kilométrage',
  'parallélisme': 'parallélisme',
  'équilibrage': 'équilibrage',
  'géométrie': 'géométrie',
  'défauts': 'défauts',
  'démarreur': 'démarreur',
  'tôlerie': 'tôlerie',
  'débosselage': 'débosselage',
  'crémaillère': 'crémaillère',
  'boîte': 'boîte',
  'échappement': 'échappement',
  'électricité': 'électricité',
  'électrique': 'électrique',
  'câblage': 'câblage',
  'général': 'général',
  'Général': 'Général',
  'géographique': 'géographique',
  'Détail': 'Détail',
  'détail': 'détail',
  'Détails': 'Détails',
  'détails': 'détails',
  'affiché': 'affiché',
  'affichée': 'affichée',
  'Réinitialiser': 'Réinitialiser',
  'Référence': 'Référence',
  'modèle': 'modèle',
  'Modèle': 'Modèle',
  'Catégorie': 'Catégorie',
  'Intérieur': 'Intérieur',
  'Terminé': 'Terminé',
  'terminé': 'terminé',
  'Téléphone': 'Téléphone',
  'Résultat': 'Résultat',
  'résultat': 'résultat',
  'Entité': 'Entité',
  'compatibilité': 'compatibilité',
  'être': 'être',
  'accès': 'accès',
  'Accès': 'Accès',
  'Réponse': 'Réponse',
  'proposé': 'proposé',
  'proposée': 'proposée',
  'utilisé': 'utilisé',
  'trouvé': 'trouvé',
  'enregistré': 'enregistré',
  'confirmé': 'confirmé',
  'annulé': 'annulé',
  'refusé': 'refusé'
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
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
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
      content = content.split(broken).join(correct);
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
console.log('UTF-8 Encoding Fix Script');
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
