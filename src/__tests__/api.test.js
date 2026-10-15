// ============================================
// PRUEBAS AUTOMATIZADAS - API de Learnify
// ============================================

describe('Configuración de la API', () => {
  test('Ejemplo básico: 2 + 2 = 4', () => {
    expect(2 + 2).toBe(4);
  });

  test('La URL base de la API está definida', () => {
    const { BASE_URL } = require('../api/api');
    expect(BASE_URL).toBeDefined();
  });

  test('La URL base es un string', () => {
    const { BASE_URL } = require('../api/api');
    expect(typeof BASE_URL).toBe('string');
  });

  test('La URL base contiene /api', () => {
    const { BASE_URL } = require('../api/api');
    expect(BASE_URL).toContain('/api');
  });
});