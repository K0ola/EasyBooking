

| ID | Type | Composant | Description du Test | Résultat Attendu | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UNIT-01** | Unitaire | Auth (Token) | `generateToken()` retourne une chaîne non vide | String définie & length > 0 | PASS |
| **UNIT-02** | Unitaire | Auth (Token) | Structure du JWT valide | 3 parties (header.payload.signature) | PASS |
| **UNIT-03** | Unitaire | Auth (Token) | Inclusion ID utilisateur | Payload contient `id` correct | PASS |
| **UNIT-04** | Unitaire | Auth (Token) | Inclusion Email utilisateur | Payload contient `email` correct | PASS |
| **UNIT-05** | Unitaire | Auth (Token) | Présence date expiration | Champ `exp` est un nombre défini | PASS |
| **UNIT-06** | Unitaire | Auth (Token) | Durée de validité du token | Expiration fixée à ~7 jours | PASS |
| **UNIT-07** | Unitaire | Auth (Verify) | Rejet token format invalide | `jwt.verify` lève une erreur | PASS |
| **UNIT-08** | Unitaire | Auth (Verify) | Rejet mauvaise signature | Erreur "invalid signature" | PASS |
| **UNIT-09** | Unitaire | Auth (Verify) | Rejet token expiré | Erreur levée si date passée | PASS |
| **UNIT-10** | Unitaire | Middleware | Rejet requête sans Header Auth | Status 401, JSON error | PASS |
| **UNIT-11** | Unitaire | Middleware | Rejet token invalide dans Header | Status 403, JSON error | PASS |
| **UNIT-12** | Unitaire | Middleware | Acceptation token valide | Appel de `next()`, status 200 | PASS |
| **UNIT-13** | Unitaire | Middleware | Attachement user à la requête | `req.user` contient id/email | PASS |
| **UNIT-14** | Unitaire | Middleware | Rejet token expiré (Middleware) | Status 403 | PASS |
| **UNIT-15** | Unitaire | Middleware | Gestion header sans 'Bearer' | Status 401 | PASS |
| | | | | | |
| **API-01** | Intégration | Auth (Register) | Structure réponse inscription | 201 Created + User object (sans pwd) | PASS |
| **API-02** | Intégration | Auth (Login) | Connexion et retour JWT | 200 OK + Token string | PASS |
| **API-03** | Intégration | Auth (Profile) | Sécurité route profil (Sans token) | 401 Unauthorized | PASS |
| **API-04** | Intégration | Auth (Profile) | Accès profil (Avec token) | 200 OK + Données user | PASS |
| **API-05** | Intégration | Salles | Liste des salles | 200 OK + Array of rooms | PASS |
| **API-06** | Intégration | Salles | Structure objet salle | Présence ID et Name | PASS |
| **API-07** | Intégration | Salles | Détail salle existante | 200 OK + Room object | PASS |
| **API-08** | Intégration | Salles | Détail salle inexistante | 404 Not Found | PASS |
| **API-09** | Intégration | Réservation | Sécurité POST (Sans token) | 401 Unauthorized | PASS |
| **API-10** | Intégration | Réservation | Validation champs requis | 400 Bad Request | PASS |
| **API-11** | Intégration | Réservation | Liste réservations perso | 200 OK + Array bookings | PASS |
| **API-12** | Intégration | Réservation | Sécurité DELETE | 401 Unauthorized | PASS |
| **API-13** | Intégration | Headers | Content-Type JSON | Header présent dans réponse | PASS |
| **API-14** | Intégration | Headers | Vérification Authorization | Rejet si token malformé | PASS |
| **API-15** | Intégration | Système | Health Check | 200 OK | PASS |
| **API-16** | Intégration | Validation | Données login invalides | 400 Bad Request | PASS |
| **API-17** | Intégration | Sécurité | Confidentialité Password | Pwd absent des réponses JSON | PASS |
| **API-18** | Intégration | Sécurité | Tokens invalides | Rejet systématique (401/403) | PASS |
| **API-19** | Intégration | Sécurité | Injection SQL basique | Bloquée (400/401) | PASS |
| **API-20** | Intégration | Validation | Format Email invalide | 400 Bad Request | PASS |
| **API-21** | Intégration | Validation | Password trop court | 400 Bad Request | PASS |
| **API-22** | Intégration | Validation | Nom complet vide | 400 Bad Request ou géré | PASS |
| | | | | | |
| **FUNC-01** | Fonctionnel | Scénario 1 | Inscription complète | Compte créé (201) | PASS |
| **FUNC-02** | Fonctionnel | Scénario 1 | Connexion post-inscription | Token reçu (200) | PASS |
| **FUNC-03** | Fonctionnel | Scénario 1 | Accès profil post-connexion | Données récupérées (200) | PASS |
| **FUNC-04** | Fonctionnel | Scénario 2 | Consultation disponibilité | Liste non vide | PASS |
| **FUNC-05** | Fonctionnel | Scénario 2 | Création réservation (Happy Path) | Réservation créée (201) | PASS |
| **FUNC-06** | Fonctionnel | Scénario 2 | Vérification historique | Réservation visible dans liste | PASS |
| **FUNC-07** | Fonctionnel | Scénario 2 | Annulation réservation | Suppression réussie (200) | PASS |
| **FUNC-08** | Fonctionnel | Scénario 3 | Conflit: 1er utilisateur | Succès (201) | PASS |
| **FUNC-09** | Fonctionnel | Scénario 3 | Conflit: 2ème utilisateur (Même heure) | **409 Conflict** (Correct) | PASS |
| **FUNC-10** | Fonctionnel | Scénario 3 | Conflit: Résolution (Autre heure) | Succès (201) | PASS |
| **FUNC-11** | Fonctionnel | Scénario 4 | Logique: Fin < Début | 400 Bad Request | PASS |
| **FUNC-12** | Fonctionnel | Scénario 4 | Logique: Salle ID invalide | 404 Not Found | PASS |
| | | | | | |
| **PERF-01** | Performance | Latence | Temps réponse Health Check | < 100ms | PASS |
| **PERF-02** | Performance | Latence | Temps réponse Liste Salles | < 500ms | PASS |
| **PERF-03** | Performance | Latence | Temps réponse Login | < 1000ms | PASS |
| **PERF-04** | Performance | Latence | Temps réponse Détail Salle | < 500ms | PASS |
| **PERF-05** | Performance | Charge | 10 requêtes séquentiels (Health) | Moyenne < 100ms | PASS |
| **PERF-06** | Performance | Charge | 5 requêtes séquentielles (Salles) | Moyenne < 500ms | PASS |
| **PERF-07** | Performance | Parallèle | 10 requêtes simultanées (Health) | Total < 500ms | PASS |
| **PERF-08** | Performance | Parallèle | 5 requêtes simultanées (Salles) | Total < 1500ms | PASS |
| **PERF-09** | Performance | Stabilité | Stabilité après 15+ requêtes | Serveur Up (200) | PASS |
| **PERF-10** | Performance | Stabilité | Variance temps de réponse | Variance < 150ms | PASS |
| **PERF-11** | Performance | Concurrence | 3 réservations simultanées | Gérées (201 ou 409) | PASS |

---

## Vue d'ensemble

### Informations générales
- **Projet**: EasyBooking
- **Framework de test**: Jest 29.7.0
- **Environnement**: Node.js 18.x et 20.x
- **Exécution**: Séquentielle (runInBand) pour éviter les conflits
- **Timeout**: 30 secondes par test

### Statistiques des tests
- **Tests unitaires**: 15 tests
- **Tests d'intégration**: 22 tests
- **Tests fonctionnels**: 12 tests
- **Tests de performance**: 11 tests
- **Total**: 55 tests (après ajout des tests API supplémentaires)

---


## Types de tests

### 1. Tests Unitaires (15 tests)

#### Modules testés
- **Module Auth - generateToken()** (9 tests)
  - UNIT-1: Génération d'une chaîne non vide
  - UNIT-2: Création d'un JWT valide (3 parties)
  - UNIT-3: Présence de l'ID utilisateur dans le token
  - UNIT-4: Présence de l'email utilisateur dans le token
  - UNIT-5: Présence d'une date d'expiration
  - UNIT-6: Expiration après 7 jours
  - UNIT-7: Rejet des tokens invalides
  - UNIT-8: Rejet des tokens avec mauvaise signature
  - UNIT-9: Rejet des tokens expirés

- **Module Auth - authenticateToken()** (6 tests)
  - UNIT-10: Rejet des requêtes sans header Authorization
  - UNIT-11: Rejet des tokens invalides
  - UNIT-12: Acceptation des tokens valides
  - UNIT-13: Attachement des données utilisateur à req.user
  - UNIT-14: Rejet des tokens expirés
  - UNIT-15: Gestion des headers sans Bearer


#### Endpoints testés

**Authentification** (5 tests)
- INT-1: Inscription d'un nouvel utilisateur
- INT-2: Rejet d'un email déjà utilisé
- INT-3: Connexion avec credentials valides
- INT-4: Rejet de credentials invalides
- INT-5: Obtention du profil utilisateur authentifié

**Gestion des salles** (5 tests)
- INT-6: Création d'une nouvelle salle
- INT-7: Récupération de toutes les salles
- INT-8: Récupération d'une salle par ID
- INT-9: Mise à jour d'une salle
- INT-10: Suppression d'une salle

**Gestion des réservations** (5 tests)
- INT-11: Création d'une réservation
- INT-12: Récupération des réservations par utilisateur
- INT-13: Vérification de la disponibilité des salles
- INT-14: Annulation d'une réservation
- INT-15: Rejet des réservations sur créneaux occupés

---

### 3. Tests Fonctionnels (12 tests)

#### Objectif
Tester les scénarios utilisateur complets de bout en bout.

#### Scénarios testés

**Scénario 1: Inscription et connexion** (3 tests)
- FUNC-1: Inscription complète d'un utilisateur
- FUNC-2: Connexion avec les credentials créés
- FUNC-3: Accès au profil utilisateur

**Scénario 2: Recherche et réservation** (4 tests)
- FUNC-4: Recherche de salles disponibles
- FUNC-5: Consultation des détails d'une salle
- FUNC-6: Réservation d'une salle disponible
- FUNC-7: Confirmation de la réservation

**Scénario 3: Gestion des réservations** (3 tests)
- FUNC-8: Consultation des réservations actives
- FUNC-9: Modification d'une réservation
- FUNC-10: Annulation d'une réservation

**Scénario 4: Gestion administrative** (2 tests)
- FUNC-11: Ajout d'une nouvelle salle (admin)
- FUNC-12: Modification des informations d'une salle (admin)

---

### 4. Tests de Performance (10 tests)


#### Métriques testées

**Temps de réponse** (4 tests)
- PERF-1: Temps de réponse API < 200ms
- PERF-2: Temps de connexion utilisateur < 500ms
- PERF-3: Temps de recherche de salles < 300ms
- PERF-4: Temps de création de réservation < 400ms

**Charge système** (3 tests)
- PERF-5: Support de 50 utilisateurs simultanés
- PERF-6: Support de 100 requêtes/seconde
- PERF-7: Stabilité sur 1000 requêtes consécutives

**Performance base de données** (3 tests)
- PERF-8: Temps de requête DB < 100ms
- PERF-9: Optimisation des jointures
- PERF-10: Performance des index

