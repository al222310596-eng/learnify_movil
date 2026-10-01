// ============================================
// ARCHIVO: RegistrarHorasScreen.js
// Registrar horas y actividades en una estadía
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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { estadiasAPI } from '../api/api';

export default function RegistrarHorasScreen({ route, navigation }) {
  const { user } = useAuth();
  const estadiaId = route.params?.estadiaId;

  const [estadia, setEstadia] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [progreso, setProgreso] = useState({ total_horas: 0, horas_requeridas: 0, porcentaje: 0 });

  const [form, setForm] = useState({
    _id: null,
    fecha: new Date(),
    horas: '',
    actividad: '',
    descripcion: ''
  });

  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    // ✅ Solo cargar si hay usuario
    if (user && user._id) {
      cargarTodo();
    } else {
      setCargandoLista(false);
    }
  }, [user]);

  const cargarTodo = async () => {
    setCargandoLista(true);
    await Promise.all([cargarEstadia(), cargarProgreso(), cargarRegistros()]);
    setCargandoLista(false);
  };

  const cargarEstadia = async () => {
    try {
      const res = await estadiasAPI.getDetalleEstadia(estadiaId);
      if (res.exito) setEstadia(res.estadia);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarProgreso = async () => {
    try {
      const res = await estadiasAPI.getProgreso(estadiaId);
      if (res.exito) setProgreso(res);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarRegistros = async () => {
    try {
      const res = await estadiasAPI.getRegistros(estadiaId);
      if (res.exito) setRegistros(res.registros || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFormulario = () => {
    setForm({
      _id: null,
      fecha: new Date(),
      horas: '',
      actividad: '',
      descripcion: ''
    });
    setEditando(false);
  };

  const guardar = async () => {
    // ✅ Protección: si no hay usuario, salir
    if (!user || !user._id) {
      Alert.alert('Error', 'Sesión no válida. Vuelve a iniciar sesión.');
      return;
    }

    if (!form.horas || parseFloat(form.horas) <= 0 || parseFloat(form.horas) > 24) {
      Alert.alert('Horas inválidas', 'Las horas deben estar entre 0.5 y 24');
      return;
    }
    if (!form.actividad.trim()) {
      Alert.alert('Actividad requerida', 'Describe la actividad realizada');
      return;
    }

    setCargando(true);
    try {
      const datos = {
        alumno_id: user._id,        // ✅ CORREGIDO: antes decía usuario._id
        fecha: formatearFechaISO(form.fecha),
        horas: parseFloat(form.horas),
        actividad: form.actividad.trim(),
        descripcion: form.descripcion.trim()
      };

      const res = editando && form._id
        ? await estadiasAPI.actualizarRegistro(form._id, datos)
        : await estadiasAPI.crearRegistro(estadiaId, datos);

      if (res.exito) {
        Alert.alert('Éxito', editando ? 'Registro actualizado' : 'Registro guardado');
        limpiarFormulario();
        await cargarRegistros();
        await cargarProgreso();
      } else {
        Alert.alert('Error', res.mensaje || 'No se pudo guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const editarRegistro = (r) => {
    setForm({
      _id: r._id,
      fecha: new Date(r.fecha + 'T00:00:00'),
      horas: String(r.horas),
      actividad: r.actividad,
      descripcion: r.descripcion || ''
    });
    setEditando(true);
  };

  const eliminarRegistro = (id) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await estadiasAPI.eliminarRegistro(id);
            if (res.exito) {
              await cargarRegistros();
              await cargarProgreso();
            } else {
              Alert.alert('Error', res.mensaje);
            }
          }
        }
      ]
    );
  };

  const formatearFechaISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatearFechaMostrar = (fecha) => {
    if (!fecha) return 'Seleccionar';
    if (typeof fecha === 'string') {
      const d = new Date(fecha + 'T00:00:00');
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ✅ Protección: mostrar cargando si no hay usuario
  if (!user || !user._id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
            <Icon name="arrow-back" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Registrar Horas</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info estadía */}
        {estadia && (
          <View style={styles.infoCard}>
            <Text style={styles.empresa}>{estadia.empresa}</Text>
            <Text style={styles.proyecto}>{estadia.titulo || estadia.proyecto}</Text>
          </View>
        )}

        {/* Progreso */}
        <View style={styles.progresoCard}>
          <View style={styles.progresoFila}>
            <Text style={styles.progresoLabel}>Horas acumuladas</Text>
            <Text style={styles.progresoValor}>{progreso.total_horas} h</Text>
          </View>
          <View style={styles.progresoFila}>
            <Text style={styles.progresoLabel}>Meta</Text>
            <Text style={styles.progresoMeta}>{progreso.horas_requeridas} h</Text>
          </View>
          <View style={styles.barra}>
            <View
              style={[
                styles.barraInner,
                { width: `${Math.min(progreso.porcentaje, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.porcentaje}>{progreso.porcentaje}% completado</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formCard}>
          <Text style={styles.formTitulo}>
            {editando ? 'Editar registro' : 'Nuevo registro'}
          </Text>

          <Text style={styles.label}>Fecha *</Text>
          <TouchableOpacity style={styles.input} onPress={() => setMostrarFecha(true)}>
            <Text style={{ color: '#1e293b' }}>{formatearFechaMostrar(form.fecha)}</Text>
          </TouchableOpacity>
          {mostrarFecha && (
            <DateTimePicker
              value={form.fecha}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setMostrarFecha(Platform.OS === 'ios');
                if (date) actualizarCampo('fecha', date);
              }}
            />
          )}

          <Text style={styles.label}>Horas trabajadas *</Text>
          <TextInput
            style={styles.input}
            value={form.horas}
            onChangeText={(t) => actualizarCampo('horas', t)}
            keyboardType="decimal-pad"
            placeholder="Ej: 4.5"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Actividad realizada *</Text>
          <TextInput
            style={styles.input}
            value={form.actividad}
            onChangeText={(t) => actualizarCampo('actividad', t)}
            placeholder="Ej: Desarrollo de módulo de login"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.descripcion}
            onChangeText={(t) => actualizarCampo('descripcion', t)}
            placeholder="Describe brevemente lo que hiciste..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
          />

          <View style={styles.botonesForm}>
            {editando && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancelar]}
                onPress={limpiarFormulario}
                disabled={cargando}
              >
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnGuardar]}
              onPress={guardar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnGuardarTexto}>
                  {editando ? 'Actualizar' : 'Guardar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de registros */}
        <Text style={styles.listaTitulo}>Registros ({registros.length})</Text>

        {cargandoLista ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#667eea" />
        ) : registros.length === 0 ? (
          <View style={styles.vacio}>
            <Icon name="clipboard-outline" size={48} color="#cbd5e1" />
            <Text style={styles.vacioTexto}>No hay registros aún</Text>
          </View>
        ) : (
          registros.map((r) => (
            <View key={r._id} style={styles.registroCard}>
              <View style={{ flex: 1 }}>
                <View style={styles.registroHeader}>
                  <Icon name="calendar-outline" size={14} color="#64748b" />
                  <Text style={styles.registroFecha}>
                    {formatearFechaMostrar(r.fecha)}
                  </Text>
                  <View style={styles.horasBadge}>
                    <Text style={styles.horasTexto}>{r.horas} h</Text>
                  </View>
                </View>
                <Text style={styles.registroActividad}>{r.actividad}</Text>
                {r.descripcion ? (
                  <Text style={styles.registroDesc}>{r.descripcion}</Text>
                ) : null}
              </View>
              <View style={styles.acciones}>
                <TouchableOpacity onPress={() => editarRegistro(r)} style={styles.accionBtn}>
                  <Icon name="create-outline" size={20} color="#4338ca" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => eliminarRegistro(r._id)} style={styles.accionBtn}>
                  <Icon name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  btnVolver: { padding: 8 },
  titulo: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea'
  },
  empresa: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  proyecto: { fontSize: 13, color: '#64748b', marginTop: 4 },

  progresoCard: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  progresoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  progresoLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  progresoValor: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progresoMeta: { color: '#fff', fontSize: 15, fontWeight: '600' },
  barra: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden'
  },
  barraInner: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4
  },
  porcentaje: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right'
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  formTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
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
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    justifyContent: 'center'
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  botonesForm: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
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
  btnGuardarTexto: { color: '#fff', fontWeight: '700' },

  listaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 12
  },
  vacio: {
    alignItems: 'center',
    padding: 40
  },
  vacioTexto: { color: '#94a3b8', marginTop: 12 },

  registroCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  registroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  registroFecha: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  horasBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8
  },
  horasTexto: { fontSize: 12, color: '#4338ca', fontWeight: '700' },
  registroActividad: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  registroDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  acciones: {
    flexDirection: 'row',
    gap: 8
  },
  accionBtn: { padding: 6 }
});