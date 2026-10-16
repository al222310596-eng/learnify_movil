// ============================================
// PRUEBAS UNITARIAS - HTML del PDF de la minuta (src/utils/pdf.js)
// Se prueba solo generarHtmlFormato(), que es una función pura.
// ============================================

import { generarHtmlFormato } from '../../utils/pdf';

// pdf.js importa módulos nativos que no existen en Jest: los simulamos.
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));
jest.mock('expo-print', () => ({ printAsync: jest.fn() }));
jest.mock('expo-asset', () => ({ Asset: { fromModule: jest.fn() } }));
jest.mock('../../api/api', () => ({ minutasAPI: { getDetalleMinuta: jest.fn() } }));

const contarFilas = (html) => (html.match(/<tr>/g) || []).length;

describe('generarHtmlFormato (unitarias)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('incluye el título MINUTA y el formato 2-R-COM-04', () => {
    const html = generarHtmlFormato({});

    expect(html).toContain('<h1>MINUTA</h1>');
    expect(html).toContain('Formato 2-R-COM-04');
  });

  test('muestra asunto, área/carrera y hora de la minuta', () => {
    const html = generarHtmlFormato({
      asunto: 'Seguimiento de estadías',
      area_carrera: 'Ing. en Desarrollo de Software',
      hora: '10:30',
    });

    expect(html).toContain('Seguimiento de estadías');
    expect(html).toContain('Ing. en Desarrollo de Software');
    expect(html).toContain('10:30');
  });

  test('formatea la fecha en formato día/mes/año (es-MX)', () => {
    const html = generarHtmlFormato({ fecha: '2026-03-15' });

    expect(html).toContain('15/03/2026');
  });

  test('si no hay hora, muestra la línea en blanco ___:___', () => {
    const html = generarHtmlFormato({});

    expect(html).toContain('___:___');
  });

  test('escapa el HTML peligroso para evitar inyección de código', () => {
    const html = generarHtmlFormato({
      asunto: '<script>alert("hack")</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;hack&quot;');
  });

  test('una minuta vacía genera 8 filas de asistentes y 6 de acuerdos', () => {
    const html = generarHtmlFormato({});

    // 2 encabezados de tabla + 8 filas de asistentes + 6 filas de acuerdos
    expect(contarFilas(html)).toBe(2 + 8 + 6);
  });

  test('si hay más de 6 acuerdos, agrega una fila por cada uno', () => {
    const acuerdos = Array.from({ length: 9 }, (_, i) => ({ acuerdo: `Acuerdo ${i + 1}` }));

    const html = generarHtmlFormato({ acuerdos });

    expect(contarFilas(html)).toBe(2 + 8 + 9);
    expect(html).toContain('Acuerdo 9');
  });

  test('reparte los asistentes en dos columnas', () => {
    const html = generarHtmlFormato({
      asistentes: [{ nombre: 'Ana' }, { nombre: 'Beto' }, { nombre: 'Carlos' }],
    });

    // Fila 1: Ana | Carlos   -   Fila 2: Beto
    expect(html.indexOf('Ana')).toBeLessThan(html.indexOf('Carlos'));
    expect(html.indexOf('Carlos')).toBeLessThan(html.indexOf('Beto'));
  });

  test('muestra los datos de cada acuerdo y formatea su fecha compromiso', () => {
    const html = generarHtmlFormato({
      acuerdos: [
        {
          agenda: 'Revisión de avances',
          acuerdo: 'Entregar reporte',
          responsable: 'Laura',
          fecha_compromiso: '2026-04-01',
        },
      ],
    });

    expect(html).toContain('Revisión de avances');
    expect(html).toContain('Entregar reporte');
    expect(html).toContain('Laura');
    expect(html).toContain('01/04/2026');
  });

  test('sin logos usa los recuadros de relleno LOGO ESCUELA y LOGO TECNM', () => {
    const html = generarHtmlFormato({});

    expect(html).toContain('LOGO<br>ESCUELA');
    expect(html).toContain('LOGO<br>TECNM');
    expect(html).not.toContain('data:image/png;base64');
  });

  test('con logos en base64 los inserta como imágenes', () => {
    const html = generarHtmlFormato({}, 'AAAA', 'BBBB');

    expect(html).toContain('data:image/png;base64,AAAA');
    expect(html).toContain('data:image/png;base64,BBBB');
    expect(html).not.toContain('LOGO<br>ESCUELA');
  });

  test('no se rompe si asistentes y acuerdos no son arreglos', () => {
    expect(() =>
      generarHtmlFormato({ asistentes: null, acuerdos: 'texto' })
    ).not.toThrow();
  });
});