const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

let testToken = '';
let testUserId = '';

// Fonction helper pour afficher les résultats
function logTest(name, success, message = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${colors.reset}`);
  if (message) console.log(`   ${message}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(50)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(50)}${colors.reset}\n`);
}

// Test 1: Inscription d'un nouvel utilisateur
async function testRegister() {
  logSection('TEST 1: INSCRIPTION');
  
  const userData = {
    nom: 'TestUser',
    prenom: 'Test',
    email: `test${Date.now()}@example.com`,
    telephone: '21234567',
    password: 'Test@123',
    role: 'automobiliste'
  };

  try {
    const response = await axios.post(`${BASE_URL}/register`, userData);
    logTest('Inscription réussie', true, `User ID: ${response.data.user.id}`);
    testUserId = response.data.user.id;
    console.log('   Données reçues:', JSON.stringify(response.data.user, null, 2));
    return true;
  } catch (error) {
    logTest('Inscription échouée', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 2: Inscription avec email déjà existant (doit échouer)
async function testRegisterDuplicate() {
  logSection('TEST 2: INSCRIPTION AVEC EMAIL EXISTANT (doit échouer)');
  
  const userData = {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'test@example.com', // Email qui existe déjà
    telephone: '21234567',
    password: 'Test@123',
    role: 'automobiliste'
  };

  try {
    await axios.post(`${BASE_URL}/register`, userData);
    logTest('Test échoué - devrait rejeter l\'email existant', false);
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Validation correcte - email dupliqué rejeté', true, error.response.data.message);
      return true;
    }
    logTest('Erreur inattendue', false, error.message);
    return false;
  }
}

// Test 3: Connexion avec les bonnes credentials
async function testLogin() {
  logSection('TEST 3: CONNEXION');
  
  // Créer un utilisateur de test d'abord
  const userData = {
    nom: 'LoginTest',
    prenom: 'User',
    email: `logintest${Date.now()}@example.com`,
    telephone: '25555555',
    password: 'Login@123',
    role: 'garage'
  };

  try {
    // Inscription
    await axios.post(`${BASE_URL}/register`, userData);
    console.log('   Utilisateur de test créé');

    // Connexion
    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const response = await axios.post(`${BASE_URL}/login`, loginData);
    testToken = response.data.token;
    
    logTest('Connexion réussie', true);
    console.log('   Token JWT reçu:', testToken.substring(0, 30) + '...');
    console.log('   Utilisateur:', JSON.stringify(response.data.user, null, 2));
    return true;
  } catch (error) {
    logTest('Connexion échouée', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Connexion avec mauvais mot de passe (doit échouer)
async function testLoginWrongPassword() {
  logSection('TEST 4: CONNEXION AVEC MAUVAIS MOT DE PASSE (doit échouer)');
  
  const loginData = {
    email: 'test@example.com',
    password: 'WrongPassword123!'
  };

  try {
    await axios.post(`${BASE_URL}/login`, loginData);
    logTest('Test échoué - devrait rejeter le mauvais mot de passe', false);
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Validation correcte - mot de passe incorrect rejeté', true, error.response.data.message);
      return true;
    }
    logTest('Erreur inattendue', false, error.message);
    return false;
  }
}

// Test 5: Accès à une route protégée AVEC token
async function testProtectedRouteWithToken() {
  logSection('TEST 5: ROUTE PROTÉGÉE AVEC TOKEN VALIDE');
  
  if (!testToken) {
    console.log('   ⚠️  Pas de token disponible, connexion d\'abord...');
    await testLogin();
  }

  try {
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${testToken}`
      }
    });
    
    logTest('Accès autorisé à la route protégée', true);
    console.log('   Profil reçu:', JSON.stringify(response.data.user, null, 2));
    return true;
  } catch (error) {
    logTest('Accès refusé', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Accès à une route protégée SANS token (doit échouer)
async function testProtectedRouteWithoutToken() {
  logSection('TEST 6: ROUTE PROTÉGÉE SANS TOKEN (doit échouer)');
  
  try {
    await axios.get(`${BASE_URL}/profile`);
    logTest('Test échoué - devrait refuser l\'accès sans token', false);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Validation correcte - accès refusé sans token', true, error.response.data.message);
      return true;
    }
    logTest('Erreur inattendue', false, error.message);
    return false;
  }
}

// Test 7: Accès avec token invalide (doit échouer)
async function testProtectedRouteWithInvalidToken() {
  logSection('TEST 7: ROUTE PROTÉGÉE AVEC TOKEN INVALIDE (doit échouer)');
  
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';

  try {
    await axios.get(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${invalidToken}`
      }
    });
    logTest('Test échoué - devrait rejeter le token invalide', false);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Validation correcte - token invalide rejeté', true, error.response.data.message);
      return true;
    }
    logTest('Erreur inattendue', false, error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log(`${colors.yellow}
╔════════════════════════════════════════════════╗
║   TESTS D'AUTHENTIFICATION ET JWT             ║
║   API: ${BASE_URL}                    ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  const results = [];

  results.push(await testRegister());
  await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre tests

  results.push(await testRegisterDuplicate());
  await new Promise(resolve => setTimeout(resolve, 500));

  results.push(await testLogin());
  await new Promise(resolve => setTimeout(resolve, 500));

  results.push(await testLoginWrongPassword());
  await new Promise(resolve => setTimeout(resolve, 500));

  results.push(await testProtectedRouteWithToken());
  await new Promise(resolve => setTimeout(resolve, 500));

  results.push(await testProtectedRouteWithoutToken());
  await new Promise(resolve => setTimeout(resolve, 500));

  results.push(await testProtectedRouteWithInvalidToken());

  // Résumé final
  logSection('RÉSUMÉ DES TESTS');
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(0);

  console.log(`Tests réussis: ${colors.green}${passed}/${total} (${percentage}%)${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}\n🎉 Tous les tests ont réussi !${colors.reset}`);
  } else {
    console.log(`${colors.red}\n⚠️  Certains tests ont échoué${colors.reset}`);
  }
}

// Lancer les tests
runAllTests().catch(error => {
  console.error(`${colors.red}❌ Erreur lors de l'exécution des tests:${colors.reset}`, error.message);
  console.log('\n⚠️  Assurez-vous que le serveur backend est démarré sur le port 3000');
});
