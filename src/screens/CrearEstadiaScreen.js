// ============================================
// ARCHIVO: CrearEstadiaScreen.js
// Crear/editar estadía con autocompletado de maestros
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { estadiasAPI } from '../api/api';

export default function CrearEstadiaScreen({ route, navigation }) {
  // ✅ CORREGIDO: usar `user`
  const { user } = useAuth();
  const estadiaId = route.params?.estadiaId;
  const modoEdicion = !!estadiaId;

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    carrera: '',
    grupo: '',
    empresa: '',
    lugar_estadia: '',
    asesor_academico: '',
    maestro_id: '',
    asesor_externo: '',
    proyecto: '',
    equipo: '',
    descripcion: '',
    periodo: '',
    fecha_inicio: null,
    fecha_fin: null,
    horas: ''
  });

  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(modoEdicion);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [maestroSeleccionado, setMaestroSeleccionado] = useState(null);
  const [timeoutBusqueda, setTimeoutBusqueda] = useState(null);
  const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
  const [mostrarFechaFin, setMostrarFechaFin] = useState(false);

  const periodos = ['Enero - Abril', 'Mayo - Agosto', 'Septiembre - Diciembre'];

  useEffect(() => {
    if (modoEdicion) {
      cargarEstadia();
    } else {
      if (user?.nombre) {
        const partes = user.nombre.trim().split(/\s+/);
        if (partes.length >= 2) {
          const mitad = Math.ceil(partes.length / 2);
          setForm(prev => ({
            ...prev,
            nombre: partes.slice(0, mitad).join(' '),
            apellidos: partes.slice(mitad).join(' ')
          }));
        } else {
          setForm(prev => ({ ...prev, nombre: user.nombre }));
        }
      }
    }
  }, []);

  const cargarEstadia = async () => {
    try {
      const res = await estadiasAPI.getDetalleEstadia(estadiaId);
      if (res.exito) {
        const e = res.estadia;
        setForm({
          nombre: e.nombre || '',
          apellidos: e.apellidos || '',
          carrera: e.carrera || '',
          grupo: e.grupo || '',
          empresa: e.empresa || '',
          lugar_estadia: e.ubicacion || '',
          asesor_academico: e.asesor_academico || '',
          maestro_id: e.maestro_id || '',
          asesor_externo: e.asesor_externo || '',
          proyecto: e.proyecto || '',
          equipo: e.equipo || '',
          descripcion: e.descripcion || '',
          periodo: e.periodo || '',
          fecha_inicio: e.fecha_inicio ? new Date(e.fecha_inicio + 'T00:00:00') : null,
          fecha_fin: e.fecha_fin ? new Date(e.fecha_fin + 'T00:00:00') : null,
          horas: String(e.horas || '')
        });

        if (e.maestro_id && e.maestro_nombre) {
          setMaestroSeleccionado({
            _id: e.maestro_id,
            nombre: e.maestro_nombre,
            email: e.maestro_email || ''
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar estadía:', error);
      Alert.alert('Error', 'No se pudo cargar la estadía');
    } finally {
      setCargandoDatos(false);
    }
  };

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const manejarBusquedaMaestro = (texto) => {
    setForm(prev => ({ ...prev, asesor_academico: texto }));

    if (!texto.trim()) {
      setMaestroSeleccionado(null);
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    if (maestroSeleccionado && maestroSeleccionado.nombre === texto) {
      return;
    }

    if (timeoutBusqueda) clearTimeout(timeoutBusqueda);

    const t = setTimeout(async () => {
      try {
        const res = await estadiasAPI.buscarMaestros(texto, 8);
        if (res.exito && res.maestros) {
          setSugerencias(res.maestros);
          setMostrarSugerencias(true);
        }
      } catch (error) {
        console.error('Error buscando maestros:', error);
      }
    }, 300);

    setTimeoutBusqueda(t);
  };

  const seleccionarMaestro = (maestro) => {
    setMaestroSeleccionado(maestro);
    setForm(prev => ({
      ...prev,
      asesor_academico: maestro.nombre,
      maestro_id: maestro._id
    }));
    setMostrarSugerencias(false);
    setSugerencias([]);
  };

  const quitarMaestro = () => {
    setMaestroSeleccionado(null);
    setForm(prev => ({ ...prev, asesor_academico: '', maestro_id: '' }));
  };

  const guardar = async () => {
    // ✅ Protección
    if (!user || !user._id) {
      Alert.alert('Error', 'Sesión no válida. Vuelve a iniciar sesión.');
      return;
    }

    const requeridos = ['nombre', 'apellidos', 'carrera', 'grupo', 'empresa',
                        'lugar_estadia', 'asesor_externo', 'proyecto', 'periodo'];

    for (const campo of requeridos) {
      if (!form[campo] || !form[campo].trim()) {
        Alert.alert('Campo requerido', 'Por favor completa todos los campos obligatorios');
        return;
      }
    }

    if (!form.maestro_id) {
      Alert.alert('Maestro requerido', 'Debes seleccionar un maestro de la lista');
      return;
    }

    if (form.fecha_inicio && form.fecha_fin && form.fecha_inicio > form.fecha_fin) {
      Alert.alert('Fechas inválidas', 'La fecha de fin no puede ser anterior a la de inicio');
      return;
    }

    setCargando(true);
    try {
      const datos = {
        usuario_id: user._id,  // ✅ user._id
        maestro_id: form.maestro_id,
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        carrera: form.carrera.trim(),
        grupo: form.grupo.trim(),
        empresa: form.empresa.trim(),
        lugar_estadia: form.lugar_estadia.trim(),
        asesor_academico: form.asesor_academico.trim(),
        asesor_externo: form.asesor_externo.trim(),
        proyecto: form.proyecto.trim(),
        equipo: form.equipo.trim(),
        descripcion: form.descripcion.trim(),
        periodo: form.periodo,
        fecha_inicio: form.fecha_inicio ? formatearFechaISO(form.fecha_inicio) : null,
        fecha_fin: form.fecha_fin ? formatearFechaISO(form.fecha_fin) : null,
        horas: parseInt(form.horas) || 0,
        estado: 'pendiente'
      };

      const res = modoEdicion
        ? await estadiasAPI.actualizarEstadia(estadiaId, datos)
        : await estadiasAPI.crearEstadia(datos);

      if (res.exito) {
        Alert.alert(
          'Éxito',
          modoEdicion ? 'Estadía actualizada correctamente' : 'Estadía registrada correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', res.mensaje || 'No se pudo guardar');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const formatearFechaISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatearFechaMostrar = (date) => {
    if (!date) return 'Seleccionar';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ✅ Protección al final (después de todos los hooks)
  if (!user || !user._id) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.textoCarga}>Cargando...</Text>
      </View>
    );
  }

  if (cargandoDatos) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.textoCarga}>Cargando estadía...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
            <Icon name="arrow-back" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.titulo}>
            {modoEdicion ? 'Editar Estadía' : 'Solicitar Estadía'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.seccionTitulo}>👤 Datos del Alumno</Text>

        <Text style={styles.label}>Nombre(s) *</Text>
        <TextInput
          style={styles.input}
          value={form.nombre}
          onChangeText={(t) => actualizarCampo('nombre', t)}
          placeholder="Ej: Juan Carlos"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Apellidos *</Text>
        <TextInput
          style={styles.input}
          value={form.apellidos}
          onChangeText={(t) => actualizarCampo('apellidos', t)}
          placeholder="Ej: Pérez López"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Carrera *</Text>
        <TextInput
          style={styles.input}
          value={form.carrera}
          onChangeText={(t) => actualizarCampo('carrera', t)}
          placeholder="Ej: Ingeniería en Sistemas"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Grupo *</Text>
        <TextInput
          style={styles.input}
          value={form.grupo}
          onChangeText={(t) => actualizarCampo('grupo', t)}
          placeholder="Ej: 9A"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.seccionTitulo}>🏢 Datos de la Empresa</Text>

        <Text style={styles.label}>Empresa *</Text>
        <TextInput
          style={styles.input}
          value={form.empresa}
          onChangeText={(t) => actualizarCampo('empresa', t)}
          placeholder="Ej: Tech Solutions S.A."
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Lugar de Estadía *</Text>
        <TextInput
          style={styles.input}
          value={form.lugar_estadia}
          onChangeText={(t) => actualizarCampo('lugar_estadia', t)}
          placeholder="Ej: Av. Reforma 123"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Asesor Académico *</Text>
        <TextInput
          style={styles.input}
          value={form.asesor_academico}
          onChangeText={manejarBusquedaMaestro}
          placeholder="Escribe el nombre del maestro..."
          placeholderTextColor="#94a3b8"
        />

        {mostrarSugerencias && sugerencias.length > 0 && (
          <View style={styles.sugerencias}>
            <FlatList
              data={sugerencias}
              keyExtractor={(item) => item._id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sugerenciaItem}
                  onPress={() => seleccionarMaestro(item)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTexto}>
                      {item.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sugerenciaNombre}>{item.nombre}</Text>
                    <Text style={styles.sugerenciaEmail}>{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {maestroSeleccionado && (
          <View style={styles.badgeMaestro}>
            <Icon name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.badgeTexto}>
              {maestroSeleccionado.nombre} ({maestroSeleccionado.email})
            </Text>
            <TouchableOpacity onPress={quitarMaestro} style={{ marginLeft: 'auto' }}>
              <Icon name="close-circle" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Asesor Externo *</Text>
        <TextInput
          style={styles.input}
          value={form.asesor_externo}
          onChangeText={(t) => actualizarCampo('asesor_externo', t)}
          placeholder="Ej: Lic. Pedro Ramírez"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.seccionTitulo}>💡 Proyecto</Text>

        <Text style={styles.label}>Proyecto *</Text>
        <TextInput
          style={styles.input}
          value={form.proyecto}
          onChangeText={(t) => actualizarCampo('proyecto', t)}
          placeholder="Ej: Sistema de Gestión"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Equipo de Trabajo</Text>
        <TextInput
          style={styles.input}
          value={form.equipo}
          onChangeText={(t) => actualizarCampo('equipo', t)}
          placeholder="Ej: Juan Pérez, María López..."
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.descripcion}
          onChangeText={(t) => actualizarCampo('descripcion', t)}
          placeholder="Describe las actividades..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.seccionTitulo}>📅 Periodo y Fechas</Text>

        <Text style={styles.label}>Periodo *</Text>
        <View style={styles.periodosContainer}>
          {periodos.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodoBtn, form.periodo === p && styles.periodoBtnSelected]}
              onPress={() => actualizarCampo('periodo', p)}
            >
              <Text style={[styles.periodoTexto, form.periodo === p && styles.periodoTextoSelected]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Fecha de inicio</Text>
        <TouchableOpacity style={styles.input} onPress={() => setMostrarFechaInicio(true)}>
          <Text style={{ color: form.fecha_inicio ? '#1e293b' : '#94a3b8' }}>
            {formatearFechaMostrar(form.fecha_inicio)}
          </Text>
        </TouchableOpacity>
        {mostrarFechaInicio && (
          <DateTimePicker
            value={form.fecha_inicio || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setMostrarFechaInicio(Platform.OS === 'ios');
              if (date) actualizarCampo('fecha_inicio', date);
            }}
          />
        )}

        <Text style={styles.label}>Fecha de término</Text>
        <TouchableOpacity style={styles.input} onPress={() => setMostrarFechaFin(true)}>
          <Text style={{ color: form.fecha_fin ? '#1e293b' : '#94a3b8' }}>
            {formatearFechaMostrar(form.fecha_fin)}
          </Text>
        </TouchableOpacity>
        {mostrarFechaFin && (
          <DateTimePicker
            value={form.fecha_fin || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setMostrarFechaFin(Platform.OS === 'ios');
              if (date) actualizarCampo('fecha_fin', date);
            }}
          />
        )}

        <Text style={styles.label}>Horas totales</Text>
        <TextInput
          style={styles.input}
          value={form.horas}
          onChangeText={(t) => actualizarCampo('horas', t)}
          keyboardType="numeric"
          placeholder="Ej: 600"
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.botones}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCancelar]}
            onPress={() => navigation.goBack()}
            disabled={cargando}
          >
            <Text style={styles.btnCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnGuardar]}
            onPress={guardar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnGuardarTexto}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCarga: { marginTop: 12, color: '#64748b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  btnVolver: { padding: 8 },
  titulo: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginTop: 20,
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b'
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  sugerencias: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    maxHeight: 220
  },
  sugerenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#667eea',
    alignItems: 'center', justifyContent: 'center'
  },
  avatarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sugerenciaNombre: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  sugerenciaEmail: { fontSize: 12, color: '#64748b' },
  badgeMaestro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    gap: 8
  },
  badgeTexto: { flex: 1, fontSize: 13, color: '#4338ca', fontWeight: '500' },
  periodosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  periodoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  periodoBtnSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea'
  },
  periodoTexto: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  periodoTextoSelected: { color: '#fff' },
  botones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  btnCancelar: { backgroundColor: '#e2e8f0' },
  btnCancelarTexto: { color: '#475569', fontWeight: '700' },
  btnGuardar: { backgroundColor: '#667eea' },
  btnGuardarTexto: { color: '#fff', fontWeight: '700' }
});