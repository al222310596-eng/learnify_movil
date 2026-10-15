// ============================================
// PRUEBAS - Funciones utilitarias
// ============================================

describe('Funciones utilitarias', () => {
  test('Array básico', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });

  test('String contiene', () => {
    const mensaje = 'Learnify es una app educativa';
    expect(mensaje).toContain('Learnify');
  });

  test('Objeto tiene propiedad', () => {
    const obj = { nombre: 'Learnify', version: '1.0' };
    expect(obj).toHaveProperty('nombre');
    expect(obj.nombre).toBe('Learnify');
  });

  test('Operaciones matemáticas', () => {
    expect(10 * 2).toBe(20);
    expect(100 / 4).toBe(25);
  });
});