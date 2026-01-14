module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // Augmenté pour les tests de performance
  verbose: true,

  // Pattern de correspondance des fichiers de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests.js'
  ],

  // Couverture de code
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/tests/**',
    '!**/node_modules/**'
  ],

  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Répertoires de couverture
  coverageDirectory: 'coverage',

  // Reporters pour les résultats
  coverageReporters: ['text', 'lcov', 'html'],

  // Ignorer certains répertoires
  testPathIgnorePatterns: [
    '/node_modules/',
    '/server/node_modules/'
  ],

  // Configuration pour les tests séquentiels (important pour les tests API)
  maxWorkers: 1,

  // Affichage des résultats
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '.',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Fichier de setup exécuté avant tous les tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Options supplémentaires
  bail: false, // Continue les tests même après une erreur
  clearMocks: true, // Nettoie automatiquement les mocks entre chaque test
  restoreMocks: true // Restaure les mocks originaux après chaque test
};
