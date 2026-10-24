// ============================================
// PRUEBAS FUNCIONALES - Flujo "Detalle de una minuta"
// ============================================

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DetalleMinutaScreen from '../../screens/DetalleMinutaScreen';
import { minutasAPI } from '../../api/api';

// ✅ Mock del API (ya existente)
jest.mock('../../api/api', () => ({
  minutasAPI: { getDetalleMinuta: jest.fn() },
  historialAPI: { registrar: jest.fn().mockResolvedValue({ exito: true }) },
}));

// ✅ NUEVO: Mock de useAuth para que DetalleMinutaScreen no explote
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'test-user-id', nombre: 'Test', rol: 'alumno', email: 'test@test.com' },
    isLoading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

const minutaResumen = { _id: 'm1', asunto: 'Resumen', fecha: '2026-03-15' };

const minutaCompleta = {
  _id: 'm1',
  asunto: 'Seguimiento de estadías',
  fecha: '2026-03-15',
  hora: '10:30',
  area_carrera: 'Desarrollo de Software',
  asistentes: [
    { nombre: 'Ana López', firma: 'AL' },
    { nombre: 'Beto Ruiz', firma: '' },
  ],
  acuerdos: [
    {
      agenda: 'Revisión de avances',
      acuerdo: 'Entregar reporte',
      responsable: 'Laura',
      fecha_compromiso: '2026-04-01',
    },
    { agenda: '', acuerdo: '', responsable: '', fecha_compromiso: '' },
  ],
};

const abrirDetalle = (minuta = minutaResumen) => {
  const navigation = { goBack: jest.fn() };
  const route = { params: { minuta } };
  return { navigation, ...render(<DetalleMinutaScreen route={route} navigation={navigation} />) };
};

describe('Detalle de minuta (funcional)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('mientras consulta al servidor muestra "Cargando detalle..."', () => {
    minutasAPI.getDetalleMinuta.mockReturnValue(new Promise(() => {}));

    const { getByText } = abrirDetalle();

    expect(getByText('Cargando detalle...')).toBeTruthy();
  });

  test('muestra la información general de la minuta', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: true, minuta: minutaCompleta });

    const { findByText, getByText } = abrirDetalle();

    expect(await findByText('Seguimiento de estadías')).toBeTruthy();
    expect(minutasAPI.getDetalleMinuta).toHaveBeenCalledWith('m1');
    expect(getByText('Desarrollo de Software')).toBeTruthy();
    expect(getByText('2026-03-15 · 10:30')).toBeTruthy();
  });

  test('lista los asistentes con su contador y la firma cuando existe', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: true, minuta: minutaCompleta });

    const { findByText, getByText } = abrirDetalle();

    expect(await findByText('Asistentes (2)')).toBeTruthy();
    expect(getByText('Ana López')).toBeTruthy();
    expect(getByText('(AL)')).toBeTruthy();
    expect(getByText('Beto Ruiz')).toBeTruthy();
  });

  test('lista los acuerdos numerados con sus datos', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: true, minuta: minutaCompleta });

    const { findByText, getByText } = abrirDetalle();

    expect(await findByText('Acuerdos (2)')).toBeTruthy();
    expect(getByText('Acuerdo #1')).toBeTruthy();
    expect(getByText('Acuerdo #2')).toBeTruthy();
    expect(getByText('Revisión de avances')).toBeTruthy();
    expect(getByText('Entregar reporte')).toBeTruthy();
    expect(getByText('Laura')).toBeTruthy();
    expect(getByText('2026-04-01')).toBeTruthy();
  });

  test('un acuerdo sin agenda ni texto muestra una raya (—)', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: true, minuta: minutaCompleta });

    const { findByText, getAllByText } = abrirDetalle();
    await findByText('Acuerdos (2)');

    // Agenda y Acuerdo vacíos del segundo acuerdo
    expect(getAllByText('—')).toHaveLength(2);
  });

  test('si no hay asistentes ni acuerdos muestra "Sin asistentes" y "Sin acuerdos"', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({
      exito: true,
      minuta: { ...minutaResumen, asistentes: [], acuerdos: [] },
    });

    const { findByText } = abrirDetalle();

    expect(await findByText('Sin asistentes')).toBeTruthy();
    expect(await findByText('Sin acuerdos')).toBeTruthy();
  });

  test('si el servidor falla, conserva los datos que recibió al abrir la pantalla', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: false });

    const { findByText } = abrirDetalle({ ...minutaResumen, asunto: 'Datos de la lista' });

    expect(await findByText('Datos de la lista')).toBeTruthy();
  });

  test('si la consulta lanza un error, igual sale del estado de carga', async () => {
    minutasAPI.getDetalleMinuta.mockRejectedValue(new Error('boom'));

    const { findByText } = abrirDetalle({ ...minutaResumen, asunto: 'Sigue visible' });

    expect(await findByText('Sigue visible')).toBeTruthy();
  });

  test('una minuta sin _id no consulta al servidor', async () => {
    const { findByText } = abrirDetalle({ asunto: 'Minuta local sin id' });

    expect(await findByText('Minuta local sin id')).toBeTruthy();
    expect(minutasAPI.getDetalleMinuta).not.toHaveBeenCalled();
  });

  test('sin minuta muestra "No hay minuta para mostrar"', async () => {
    const navigation = { goBack: jest.fn() };

    const { findByText } = render(
      <DetalleMinutaScreen route={{ params: {} }} navigation={navigation} />
    );

    expect(await findByText('No hay minuta para mostrar')).toBeTruthy();
  });

  test('el botón "Cerrar" regresa a la pantalla anterior', async () => {
    minutasAPI.getDetalleMinuta.mockResolvedValue({ exito: true, minuta: minutaCompleta });
    const { navigation, findByText, getByText } = abrirDetalle();
    await findByText('Seguimiento de estadías');

    fireEvent.press(getByText('Cerrar'));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
  });
});