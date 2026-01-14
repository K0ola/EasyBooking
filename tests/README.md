# 🧪 Guide des Tests EasyBooking

Ce guide explique comment exécuter les différents types de tests pour l'application EasyBooking.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Exécution des tests](#exécution-des-tests)
- [Types de tests](#types-de-tests)
- [Couverture de code](#couverture-de-code)
- [CI/CD](#cicd)

## 🔧 Prérequis

- Node.js v18+ installé
- npm v9+ installé
- Serveur EasyBooking lancé sur `http://localhost:3000`
- Variables d'environnement configurées (voir `.env.example`)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Installer les dépendances du serveur
cd server && npm install && cd ..
```

## 🚀 Exécution des tests

### Lancer tous les tests

```bash
npm test
```

### Lancer tous les tests de manière séquentielle

```bash
npm run test:all
```

Cette commande exécute successivement :
1. Tests unitaires
2. Tests d'intégration
3. Tests fonctionnels
4. Tests de performance

### Lancer un type de test spécifique

```bash
# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests fonctionnels uniquement
npm run test:fonctionnel

# Tests de performance uniquement
npm run test:performance
```

### Mode Watch (développement)

```bash
npm run test:watch
```

### Tests avec verbosité

```bash
npm run test:verbose
```

### Tests avec couverture de code

```bash
npm run test:coverage
```

Un rapport HTML sera généré dans `coverage/lcov-report/index.html`

## 📊 Types de tests

### 1️⃣ Tests Unitaires (`unit.test.js`)

**Objectif** : Tester les fonctions individuelles de manière isolée

**Nombre de tests** : 15 tests

**Couverture** :
- Module `generateToken()` - 9 tests
- Middleware `authenticateToken()` - 6 tests

**Exécution** :
```bash
npm run test:unit
```

**Exemples de tests** :
- Génération de tokens JWT valides
- Validation de tokens
- Gestion des tokens expirés
- Rejet des tokens invalides

---

### 2️⃣ Tests Fonctionnels (`fonctionnel.test.js`)

**Objectif** : Tester les scénarios utilisateur end-to-end

**Nombre de tests** : 17 tests répartis en 4 scénarios

**Couverture** :
- Scénario 1 : Inscription et connexion (3 tests)
- Scénario 2 : Consultation et réservation de salle (6 tests)
- Scénario 3 : Tentatives de réservation en conflit (3 tests)
- Scénario 4 : Gestion des erreurs et validations (6 tests)

**Exécution** :
```bash
npm run test:fonctionnel
```

**Prérequis** : Serveur doit être lancé sur `http://localhost:3000`

**Exemples de scénarios** :
- Parcours complet d'un utilisateur : inscription → connexion → consultation → réservation → annulation
- Détection de conflits de réservation
- Gestion des cas d'erreur (token invalide, données manquantes)

---

### 3️⃣ Tests d'Intégration (`integration.test.js`)

**Objectif** : Tester l'API et les interactions entre composants

**Nombre de tests** : 22 tests

**Couverture** :
- Routes d'authentification (4 tests)
- Routes salles (4 tests)
- Routes réservations (4 tests)
- Headers HTTP (2 tests)
- Codes de statut HTTP (2 tests)
- Sécurité (3 tests)
- Validation des données (3 tests)

**Exécution** :
```bash
npm run test:integration
```

**Prérequis** : Serveur doit être lancé sur `http://localhost:3000`

**Exemples de tests** :
- Validation des structures de réponse API
- Vérification des codes de statut HTTP
- Tests de sécurité (SQL injection, XSS)
- Validation des en-têtes HTTP

---

### 4️⃣ Tests de Performance (`performance.test.js`)

**Objectif** : Valider les performances et la stabilité du système

**Nombre de tests** : 11 tests

**Couverture** :
- Temps de réponse des endpoints (4 tests)
- Tests de charge séquentielle (2 tests)
- Tests de charge parallèle (2 tests)
- Tests de stabilité (2 tests)
- Tests de concurrence (1 test)

**Exécution** :
```bash
npm run test:performance
```

**Prérequis** : Serveur doit être lancé sur `http://localhost:3000`

**Métriques mesurées** :
- Temps de réponse moyen
- Temps de réponse maximum
- Variance des temps de réponse
- Stabilité sous charge

**Seuils de performance** :
- Health check : < 100ms
- Liste des salles : < 500ms
- Connexion utilisateur : < 1000ms
- Détails d'une salle : < 500ms

---

## 📈 Couverture de code

### Générer un rapport de couverture

```bash
npm run test:coverage
```

### Visualiser le rapport

Ouvrir le fichier : `coverage/lcov-report/index.html`

### Seuils de couverture configurés

- Branches : 50%
- Fonctions : 50%
- Lignes : 50%
- Statements : 50%

## 🔄 CI/CD

### Exécuter les tests en mode CI

```bash
npm run test:ci
```

Cette commande :
- Exécute tous les tests
- Génère un rapport de couverture
- Utilise 2 workers maximum
- Mode CI activé (pas d'interactivité)

### Intégration avec Docker

```bash
# Construire l'image Docker
npm run docker:build

# Lancer les tests dans Docker
npm run docker:compose:test

# Arrêter les containers
npm run docker:compose:down
```

## 🛠️ Dépannage

### Le serveur n'est pas accessible

Vérifier que le serveur est bien lancé :

```bash
npm run health
```

Si le serveur ne répond pas :

```bash
# Lancer le serveur en mode développement
npm run dev

# OU en mode production
npm run start
```

### Les tests échouent aléatoirement

Les tests d'API et de performance peuvent échouer si :
- Le serveur est surchargé
- La base de données n'est pas accessible
- Des tests précédents n'ont pas nettoyé les données

**Solution** : Relancer les tests avec `--runInBand` (déjà configuré par défaut)

### Problèmes de timeout

Si les tests échouent avec des erreurs de timeout :

1. Augmenter le timeout dans `jest.config.js` :
```javascript
testTimeout: 60000 // 60 secondes
```

2. Ou augmenter le timeout pour un test spécifique :
```javascript
test('mon test', async () => {
  // test code
}, 60000); // 60 secondes
```

## 📝 Conventions de nommage

- **Tests unitaires** : `UNIT-XX` (ex: UNIT-1, UNIT-2)
- **Tests d'API** : `API-XX` (ex: API-1, API-2)
- **Tests fonctionnels** : `X.Y` (ex: 1.1, 2.3)
- **Tests de performance** : `PERF-XX` (ex: PERF-1, PERF-2)

## 🎯 Bonnes pratiques

1. **Toujours lancer les tests unitaires en premier** : Ils sont rapides et détectent les problèmes de base
2. **Lancer le serveur avant les tests d'intégration/fonctionnels/performance**
3. **Utiliser `test:all` pour une validation complète** avant un commit important
4. **Vérifier la couverture de code** régulièrement avec `npm run test:coverage`
5. **Ne pas modifier les tests en production** : Les tests sont là pour garantir la qualité

## 📚 Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Guide des matchers Jest](https://jestjs.io/docs/expect)
- [Best practices de testing](https://testingjavascript.com/)

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Créer un nouveau fichier de test dans `tests/`
2. Suivre les conventions de nommage
3. Ajouter un script dans `package.json` si nécessaire
4. Mettre à jour ce README

## 📞 Support

En cas de problème, contacter l'équipe de développement ou ouvrir une issue sur le repository.

---

**Dernière mise à jour** : Janvier 2026
