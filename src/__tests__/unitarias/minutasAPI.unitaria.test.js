// ============================================
// PRUEBAS UNITARIAS - minutasAPI (src/api/api.js)
// Se simula axios, así NO se necesita el backend.
// ============================================

import axios from 'axios';
import { minutasAPI } from '../../api/api';

// axios.create() se llama una sola vez cuando api.js se importa.
// Guardamos esa instancia falsa para controlar sus respuestas.
jest.mock('axios', () => {
  const instanciaFalsa = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return { __esModule: true, default: { create: jest.fn(() => instanciaFalsa) } };
});

const http = axios.create.mock.results[0].value;

describe('minutasAPI (unitarias)', () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset());
    // Silenciamos los console.* para que el reporte quede limpio
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  // ---------- getMinutas ----------
  describe('getMinutas', () => {
    test.each([[undefined], [null], [''], ['undefined'], ['null']])(
      'rechaza el usuarioId inválido (%p) sin llamar al servidor',
      async (idInvalido) => {
        const resultado = await minutasAPI.getMinutas(idInvalido);

        expect(resultado).toEqual({
          exito: false,
          minutas: [],
          mensaje: 'usuarioId inválido',
        });
        expect(http.get).not.toHaveBeenCalled();
      }
    );

    test('consulta GET /minutas/:usuarioId y devuelve la respuesta del servidor', async () => {
      const respuesta = { exito: true, minutas: [{ _id: '1', asunto: 'Reunión' }] };
      http.get.mockResolvedValueOnce({ data: respuesta });

      const resultado = await minutasAPI.getMinutas('abc123');

      expect(http.get).toHaveBeenCalledWith('/minutas/abc123');
      expect(resultado).toEqual(respuesta);
    });

    test('devuelve el mensaje del servidor cuando la petición falla', async () => {
      http.get.mockRejectedValueOnce({
        response: { status: 500, data: { mensaje: 'Fallo en la base de datos' } },
      });

      const resultado = await minutasAPI.getMinutas('abc123');

      expect(resultado).toEqual({
        exito: false,
        minutas: [],
        mensaje: 'Fallo en la base de datos',
      });
    });

    test('devuelve un mensaje genérico cuando no hay conexión', async () => {
      http.get.mockRejectedValueOnce(new Error('Network Error'));

      const resultado = await minutasAPI.getMinutas('abc123');

      expect(resultado.exito).toBe(false);
      expect(resultado.minutas).toEqual([]);
      expect(resultado.mensaje).toBe('Error al obtener minutas');
    });
  });

  // ---------- getDetalleMinuta ----------
  describe('getDetalleMinuta', () => {
    test('consulta GET /minutas/detalle/:id y devuelve la minuta', async () => {
      const respuesta = { exito: true, minuta: { _id: '9', asunto: 'Detalle' } };
      http.get.mockResolvedValueOnce({ data: respuesta });

      const resultado = await minutasAPI.getDetalleMinuta('9');

      expect(http.get).toHaveBeenCalledWith('/minutas/detalle/9');
      expect(resultado).toEqual(respuesta);
    });

    test('devuelve { exito: false } si el servidor falla', async () => {
      http.get.mockRejectedValueOnce(new Error('Network Error'));

      const resultado = await minutasAPI.getDetalleMinuta('9');

      expect(resultado).toEqual({ exito: false });
    });
  });

  // ---------- crearMinuta ----------
  describe('crearMinuta', () => {
    const datos = {
      fecha: '2026-03-15',
      hora: '10:30',
      asunto: 'Seguimiento de estadías',
      usuario_id: 'u1',
    };

    test('envía POST /minutas/crear con los datos de la minuta', async () => {
      http.post.mockResolvedValueOnce({ data: { exito: true, minuta_id: 'm1' } });

      const resultado = await minutasAPI.crearMinuta(datos);

      expect(http.post).toHaveBeenCalledWith('/minutas/crear', datos);
      expect(resultado).toEqual({ exito: true, minuta_id: 'm1' });
    });

    test('devuelve el mensaje del servidor si la validación falla', async () => {
      http.post.mockRejectedValueOnce({
        response: { data: { mensaje: 'El asunto es obligatorio' } },
      });

      const resultado = await minutasAPI.crearMinuta({});

      expect(resultado).toEqual({ exito: false, mensaje: 'El asunto es obligatorio' });
    });

    test('devuelve "Error al crear minuta" cuando no hay conexión', async () => {
      http.post.mockRejectedValueOnce(new Error('Network Error'));

      const resultado = await minutasAPI.crearMinuta(datos);

      expect(resultado).toEqual({ exito: false, mensaje: 'Error al crear minuta' });
    });
  });

  // ---------- eliminarMinuta ----------
  describe('eliminarMinuta', () => {
    test('una minuta local (id "local_...") se elimina sin llamar al servidor', async () => {
      const resultado = await minutasAPI.eliminarMinuta('local_1712345678');

      expect(resultado).toEqual({ exito: true, mensaje: 'Eliminada localmente' });
      expect(http.delete).not.toHaveBeenCalled();
    });

    test('una minuta del servidor se elimina con DELETE /minutas/eliminar/:id', async () => {
      http.delete.mockResolvedValueOnce({ data: { exito: true } });

      const resultado = await minutasAPI.eliminarMinuta('64fa01');

      expect(http.delete).toHaveBeenCalledWith('/minutas/eliminar/64fa01');
      expect(resultado).toEqual({ exito: true });
    });

    test('devuelve el mensaje de error si el servidor falla', async () => {
      http.delete.mockRejectedValueOnce({
        response: { data: { mensaje: 'No tienes permiso' } },
      });

      const resultado = await minutasAPI.eliminarMinuta('64fa01');

      expect(resultado).toEqual({ exito: false, mensaje: 'No tienes permiso' });
    });
  });
});