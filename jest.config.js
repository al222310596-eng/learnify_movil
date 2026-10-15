// jest.config.js
module.exports = {
  preset: 'jest-expo',

  moduleNameMapper: {
    // ✅ Mapeo a la ubicación real (raíz, sin anidación)
    '^expo-modules-core(|/.*)$': '<rootDir>/node_modules/expo-modules-core$1',
    // ✅ Mock para el módulo que ya vimos que no existe
    '^expo/src/async-require/messageSocket$': '<rootDir>/__mocks__/empty-mock.js',
  },

  // ✅ Añadir .ts y .tsx para que Jest resuelva archivos TypeScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],

  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**'
  ],

  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};