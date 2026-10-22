// ============================================
// PRUEBAS FUNCIONALES - Flujo "Mis Minutas"
// Buscar, ver detalle, exportar PDF, eliminar y crear una nueva.
// ============================================

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MisMinutasScreen from '../../screens/MisMinutasScreen';
import { useAuth } from '../../contexts/AuthContext';
import { minutasAPI } from '../../api/api';
import { exportarPDFyCompartir } from '../../utils/pdf';
import {
  obtenerMinutasLocal,
  guardarMinutasLocal,
  eliminarMinutaLocal,
} from '../../utils/storage';

jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../api/api', () => ({
  minutasAPI: { getMinutas: jest.fn(), eliminarMinuta: jest.fn() },
}));
jest.mock('../../utils/pdf', () => ({ exportarPDFyCompartir: jest.fn() }));
jest.mock('../../utils/storage', () => ({
  obtenerMinutasLocal: jest.fn(),
  guardarMinutasLocal: jest.fn(),
  eliminarMinutaLocal: jest.fn(),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
// La pantalla importa AsyncStorage directamente, así que también se simula
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const minutas = [
  { _id: 'm1', asunto: 'Reunión de academia', area_carrera: 'Software', fecha: '2026-03-15' },
  { _id: 'm2', asunto: 'Seguimiento de estadías', area_carrera: 'Redes', fecha: '2026-03-20' },
  { _id: 'local_9', asunto: 'Borrador local', area_carrera: '', fecha: '2026-03-21' },
];

const crearNavegacion = () => ({
  navigate: jest.fn(),
  addListener: jest.fn((evento, callback) => {
    callback(); // la pantalla "recibe el foco" al abrirse
    return jest.fn();
  }),
});

describe('Mis Minutas (funcional)', () => {
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = crearNavegacion();
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    minutasAPI.getMinutas.mockResolvedValue({ exito: true, minutas });
    minutasAPI.eliminarMinuta.mockResolvedValue({ exito: true });
    obtenerMinutasLocal.mockResolvedValue([]);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('al abrir la pantalla muestra la lista de minutas del usuario', async () => {
    const { findByText } = render(<MisMinutasScreen navigation={navigation} />);

    expect(await findByText('Reunión de academia')).toBeTruthy();
    expect(await findByText('Seguimiento de estadías')).toBeTruthy();
    expect(minutasAPI.getMinutas).toHaveBeenCalledWith('u1');
  });

  test('mientras carga muestra "Cargando minutas..."', async () => {
    minutasAPI.getMinutas.mockReturnValue(new Promise(() => {})); // nunca responde
    const { getByText } = render(<MisMinutasScreen navigation={navigation} />);

    expect(getByText('Cargando minutas...')).toBeTruthy();
  });

  test('buscar por asunto filtra la lista', async () => {
    const { findByText, getByPlaceholderText, queryByText } = render(
      <MisMinutasScreen navigation={navigation} />
    );
    await findByText('Reunión de academia');

    fireEvent.changeText(getByPlaceholderText('Buscar por asunto o área...'), 'estadías');

    expect(queryByText('Seguimiento de estadías')).toBeTruthy();
    expect(queryByText('Reunión de academia')).toBeNull();
  });

  test('buscar por área o carrera también filtra la lista', async () => {
    const { findByText, getByPlaceholderText, queryByText } = render(
      <MisMinutasScreen navigation={navigation} />
    );
    await findByText('Reunión de academia');

    fireEvent.changeText(getByPlaceholderText('Buscar por asunto o área...'), 'redes');

    expect(queryByText('Seguimiento de estadías')).toBeTruthy();
    expect(queryByText('Reunión de academia')).toBeNull();
  });

  test('la búsqueda no distingue mayúsculas de minúsculas', async () => {
    const { findByText, getByPlaceholderText, queryByText } = render(
      <MisMinutasScreen navigation={navigation} />
    );
    await findByText('Reunión de academia');

    fireEvent.changeText(getByPlaceholderText('Buscar por asunto o área...'), 'ACADEMIA');

    expect(queryByText('Reunión de academia')).toBeTruthy();
  });

  test('si nada coincide con la búsqueda, muestra "No hay minutas todavía"', async () => {
    const { findByText, getByPlaceholderText } = render(
      <MisMinutasScreen navigation={navigation} />
    );
    await findByText('Reunión de academia');

    fireEvent.changeText(getByPlaceholderText('Buscar por asunto o área...'), 'xyz-inexistente');

    expect(await findByText('No hay minutas todavía')).toBeTruthy();
  });

  test('"Ver" abre el detalle de la minuta elegida', async () => {
    const { findByText, getAllByText } = render(<MisMinutasScreen navigation={navigation} />);
    await findByText('Reunión de academia');

    fireEvent.press(getAllByText('Ver')[0]);

    expect(navigation.navigate).toHaveBeenCalledWith('DetalleMinuta', { minuta: minutas[0] });
  });

  test('"+ Nueva" abre la pantalla para crear una minuta', async () => {
    const { findByText, getByText } = render(<MisMinutasScreen navigation={navigation} />);
    await findByText('Reunión de academia');

    fireEvent.press(getByText('+ Nueva'));

    expect(navigation.navigate).toHaveBeenCalledWith('CrearMinuta');
  });

  test('"Crear primera minuta" aparece cuando no hay minutas', async () => {
    minutasAPI.getMinutas.mockResolvedValue({ exito: true, minutas: [] });
    const { findByText } = render(<MisMinutasScreen navigation={navigation} />);

    fireEvent.press(await findByText('Crear primera minuta'));

    expect(navigation.navigate).toHaveBeenCalledWith('CrearMinuta');
  });

  test('"PDF" exporta la minuta elegida', async () => {
    exportarPDFyCompartir.mockResolvedValue(true);
    const { findByText, getAllByText } = render(<MisMinutasScreen navigation={navigation} />);
    await findByText('Reunión de academia');

    fireEvent.press(getAllByText('PDF')[0]);

    await waitFor(() => expect(exportarPDFyCompartir).toHaveBeenCalledWith(minutas[0]));
  });

  test('si falla el PDF avisa "No se pudo generar el PDF"', async () => {
    exportarPDFyCompartir.mockRejectedValue(new Error('fallo'));
    const { findByText, getAllByText } = render(<MisMinutasScreen navigation={navigation} />);
    await findByText('Reunión de academia');

    fireEvent.press(getAllByText('PDF')[0]);

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo generar el PDF')
    );
  });

  describe('eliminar una minuta', () => {
    // Busca la papelera de la tarjeta n y la presiona
   
const presionarPapelera = (
  UNSAFE_getAllByType,
  TouchableOpacity,
  indiceTarjeta
) => {
  const botones = UNSAFE_getAllByType(TouchableOpacity);

  // Cada tarjeta tiene 4 botones: Ver, PDF, Compartir y Eliminar.
  // Antes de las tarjetas está el botón "+ Nueva".
  const primerBotonTarjetas = 1;
  fireEvent.press(
    botones[primerBotonTarjetas + indiceTarjeta * 4 + 3]
  );
};


    test('pide confirmación antes de eliminar', async () => {
      const { TouchableOpacity } = require('react-native');
      const { findByText, UNSAFE_getAllByType } = render(
        <MisMinutasScreen navigation={navigation} />
      );
      await findByText('Reunión de academia');

      presionarPapelera(UNSAFE_getAllByType, TouchableOpacity, 0);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Eliminar minuta',
        '¿Estás seguro? Esta acción no se puede deshacer.',
        expect.any(Array)
      );
      expect(minutasAPI.eliminarMinuta).not.toHaveBeenCalled();
    });

    test('al confirmar, elimina una minuta del servidor y la copia local', async () => {
      const { TouchableOpacity } = require('react-native');
      const { findByText, UNSAFE_getAllByType } = render(
        <MisMinutasScreen navigation={navigation} />
      );
      await findByText('Reunión de academia');
      presionarPapelera(UNSAFE_getAllByType, TouchableOpacity, 0);

      const botonesAlerta = Alert.alert.mock.calls[0][2];
      await botonesAlerta.find((b) => b.text === 'Eliminar').onPress();

      expect(minutasAPI.eliminarMinuta).toHaveBeenCalledWith('m1');
      expect(eliminarMinutaLocal).toHaveBeenCalledWith('m1');
    });

    test('al confirmar, una minuta local solo se borra del dispositivo', async () => {
      const { TouchableOpacity } = require('react-native');
      const { findByText, UNSAFE_getAllByType } = render(
        <MisMinutasScreen navigation={navigation} />
      );
      await findByText('Borrador local');
      presionarPapelera(UNSAFE_getAllByType, TouchableOpacity, 2);

      const botonesAlerta = Alert.alert.mock.calls[0][2];
      await botonesAlerta.find((b) => b.text === 'Eliminar').onPress();

      expect(minutasAPI.eliminarMinuta).not.toHaveBeenCalled();
      expect(eliminarMinutaLocal).toHaveBeenCalledWith('local_9');
    });

    test('al cancelar, no se elimina nada', async () => {
      const { TouchableOpacity } = require('react-native');
      const { findByText, UNSAFE_getAllByType } = render(
        <MisMinutasScreen navigation={navigation} />
      );
      await findByText('Reunión de academia');
      presionarPapelera(UNSAFE_getAllByType, TouchableOpacity, 0);

      const botonesAlerta = Alert.alert.mock.calls[0][2];
      const cancelar = botonesAlerta.find((b) => b.text === 'Cancelar');

      expect(cancelar.onPress).toBeUndefined(); // "Cancelar" solo cierra la alerta
      expect(minutasAPI.eliminarMinuta).not.toHaveBeenCalled();
      expect(eliminarMinutaLocal).not.toHaveBeenCalled();
    });
  });

  test('si el servidor no responde, muestra las minutas guardadas en el dispositivo', async () => {
    minutasAPI.getMinutas.mockResolvedValue({ exito: false, minutas: [] });
    obtenerMinutasLocal.mockResolvedValue([{ _id: 'local_1', asunto: 'Guardada en el celular' }]);

    const { findByText } = render(<MisMinutasScreen navigation={navigation} />);

    expect(await findByText('Guardada en el celular')).toBeTruthy();
  });

  test('sin sesión no consulta al servidor y usa las minutas locales', async () => {
    useAuth.mockReturnValue({ user: null });
    obtenerMinutasLocal.mockResolvedValue([{ _id: 'local_1', asunto: 'Solo local' }]);

    const { findByText } = render(<MisMinutasScreen navigation={navigation} />);

    expect(await findByText('Solo local')).toBeTruthy();
    expect(minutasAPI.getMinutas).not.toHaveBeenCalled();
  });

  test('las minutas del servidor se guardan en el dispositivo como respaldo', async () => {
    const { findByText } = render(<MisMinutasScreen navigation={navigation} />);
    await findByText('Reunión de academia');

    expect(guardarMinutasLocal).toHaveBeenCalledWith(minutas);
  });
});