// ============================================
// PRUEBAS FUNCIONALES - Flujo "Crear una minuta"
// Se prueba lo que hace el usuario: escribe, pulsa botones y ve mensajes.
// El backend (minutasAPI), el disco y el PDF se simulan.
// ============================================

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CrearMinutaScreen from '../../screens/CrearMinutaScreen';
import { useAuth } from '../../contexts/AuthContext';
import { minutasAPI } from '../../api/api';
import { agregarMinutaLocal } from '../../utils/storage';
import { exportarPDFyCompartir } from '../../utils/pdf';

jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../api/api', () => ({ minutasAPI: { crearMinuta: jest.fn() } }));
jest.mock('../../utils/storage', () => ({ agregarMinutaLocal: jest.fn() }));
jest.mock('../../utils/pdf', () => ({ exportarPDFyCompartir: jest.fn() }));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

describe('Crear minuta (funcional)', () => {
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = { navigate: jest.fn() };
    useAuth.mockReturnValue({ user: { _id: 'u1', nombre: 'Anderson' } });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('no deja guardar si el asunto está vacío', () => {
    const { getByText } = render(<CrearMinutaScreen navigation={navigation} />);

    fireEvent.press(getByText('Guardar'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'El asunto es obligatorio');
    expect(minutasAPI.crearMinuta).not.toHaveBeenCalled();
  });

  test('no deja guardar si el asunto son solo espacios', () => {
    const { getByText, getByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), '    ');
    fireEvent.press(getByText('Guardar'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'El asunto es obligatorio');
  });

  test('pide iniciar sesión de nuevo si no hay usuario', () => {
    useAuth.mockReturnValue({ user: null });
    const { getByText, getByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), 'Reunión');
    fireEvent.press(getByText('Guardar'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sesión expirada',
      'Vuelve a iniciar sesión para guardar la minuta.'
    );
    expect(minutasAPI.crearMinuta).not.toHaveBeenCalled();
  });

  test('guarda la minuta en el servidor y regresa a Mis Minutas', async () => {
    minutasAPI.crearMinuta.mockResolvedValueOnce({ exito: true });
    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), '  Seguimiento de estadías  ');
    fireEvent.changeText(
      getByPlaceholderText('Ej. Ing. en Desarrollo de Software'),
      'Desarrollo de Software'
    );
    fireEvent.changeText(getAllByPlaceholderText('Nombre')[0], 'Ana López');
    fireEvent.changeText(getByPlaceholderText('Agenda'), 'Revisión de avances');
    fireEvent.changeText(getByPlaceholderText('Acuerdo'), 'Entregar reporte');
    fireEvent.changeText(getByPlaceholderText('Responsable'), 'Laura');
    fireEvent.press(getByText('Guardar'));

    await waitFor(() => expect(minutasAPI.crearMinuta).toHaveBeenCalledTimes(1));
    const datos = minutasAPI.crearMinuta.mock.calls[0][0];
    expect(datos).toMatchObject({
      usuario_id: 'u1',
      asunto: 'Seguimiento de estadías', // sin espacios sobrantes
      area_carrera: 'Desarrollo de Software',
      asistentes: [{ nombre: 'Ana López', firma: '' }], // el 2.º asistente vacío se descarta
      acuerdos: [
        {
          agenda: 'Revisión de avances',
          acuerdo: 'Entregar reporte',
          responsable: 'Laura',
          fecha_compromiso: '',
        },
      ],
    });
    expect(datos.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(datos.hora).toMatch(/^\d{2}:\d{2}$/);
    expect(Alert.alert).toHaveBeenCalledWith('Éxito', 'Minuta guardada correctamente');
    expect(navigation.navigate).toHaveBeenCalledWith('MisMinutas');
    expect(agregarMinutaLocal).not.toHaveBeenCalled();
  });

  test('si el servidor no responde, guarda la minuta en el dispositivo', async () => {
    minutasAPI.crearMinuta.mockResolvedValueOnce({ exito: false, mensaje: 'Error al crear minuta' });
    const { getByText, getByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), 'Minuta sin internet');
    fireEvent.press(getByText('Guardar'));

    await waitFor(() => expect(agregarMinutaLocal).toHaveBeenCalledTimes(1));
    expect(agregarMinutaLocal.mock.calls[0][0]).toMatchObject({
      asunto: 'Minuta sin internet',
      usuario_id: 'u1',
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Guardado local',
      'No se pudo conectar con el servidor. La minuta se guardó en el dispositivo.'
    );
    expect(navigation.navigate).toHaveBeenCalledWith('MisMinutas');
  });

  test('"Agregar" añade un asistente nuevo y un acuerdo nuevo', () => {
    const { getAllByText, getByText, queryByText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );
    expect(queryByText('Asistente #3')).toBeNull();

    // Hay dos botones "Agregar": el primero es de asistentes, el segundo de acuerdos
    fireEvent.press(getAllByText('Agregar')[0]);
    expect(getByText('Asistente #3')).toBeTruthy();

    fireEvent.press(getAllByText('Agregar')[1]);
    expect(getByText('Acuerdo #2')).toBeTruthy();
  });

  test('"PDF" no genera el documento si falta el asunto', () => {
    const { getByText } = render(<CrearMinutaScreen navigation={navigation} />);

    fireEvent.press(getByText('PDF'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Completa el asunto antes de imprimir');
    expect(exportarPDFyCompartir).not.toHaveBeenCalled();
  });

  test('"PDF" genera el documento con los datos escritos', async () => {
    exportarPDFyCompartir.mockResolvedValueOnce(true);
    const { getByText, getByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), 'Minuta para imprimir');
    fireEvent.press(getByText('PDF'));

    await waitFor(() => expect(exportarPDFyCompartir).toHaveBeenCalledTimes(1));
    expect(exportarPDFyCompartir.mock.calls[0][0]).toMatchObject({
      asunto: 'Minuta para imprimir',
      usuario_nombre: 'Anderson',
    });
  });

  test('"PDF" avisa al usuario si no se pudo generar', async () => {
    exportarPDFyCompartir.mockRejectedValueOnce(new Error('fallo'));
    const { getByText, getByPlaceholderText } = render(
      <CrearMinutaScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Tema principal'), 'Minuta');
    fireEvent.press(getByText('PDF'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo generar el PDF')
    );
  });
});