// ============================================
// ARCHIVO: EstadiasScreen.js
// Gestión de Estadías (con roles diferenciados)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { estadiasAPI } from '../api/api';

export default function EstadiasScreen({ navigation }) {
  const { user, isLoading } = useAuth();

  const [estadias, setEstadias] = useState([]);
  const [estadiasFiltradas, setEstadiasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const esMaestro = user?.rol === 'maestro';
  const esAlumno = user?.rol === 'alumno';

  const estados = [
    { key: 'todos', label: 'Todos', icon: 'apps-outline' },
    { key: 'pendiente', label: 'Pendiente', icon: 'time-outline' },
    { key: 'en-curso', label: 'En curso', icon: 'play-circle-outline' },
    { key: 'completada', label: 'Completada', icon: 'checkmark-circle-outline' },
    { key: 'cancelada', label: 'Cancelada', icon: 'close-circle-outline' },
  ];

  // ============================================
  // CARGAR ESTADÍAS
  // ============================================
  const cargarEstadias = async () => {
    if (!user || !user._id) {
      setCargando(false);
      setRefrescando(false);
      return;
    }

    try {
      const res = await estadiasAPI.getEstadias(user._id);
      if (res.exito) {
        setEstadias(res.estadias || []);
        setEstadiasFiltradas(res.estadias || []);
      } else {
        Alert.alert('Error', res.mensaje || 'No se pudieron cargar las estadías');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user._id) {
        setCargando(true);
        cargarEstadias();
      }
    }, [user])
  );

  // ============================================
  // FILTRAR
  // ============================================
  useEffect(() => {
    let filtradas = [...estadias];

    // ✅ Solo aplicar filtro de estado para MAESTROS
    if (esMaestro && filtroEstado !== 'todos') {
      filtradas = filtradas.filter(e => e.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      filtradas = filtradas.filter(e =>
        (e.empresa || '').toLowerCase().includes(q) ||
        (e.titulo || '').toLowerCase().includes(q) ||
        (e.proyecto || '').toLowerCase().includes(q)
      );
    }

    setEstadiasFiltradas(filtradas);
  }, [busqueda, filtroEstado, estadias, esMaestro]);

  // ============================================
  // ELIMINAR
  // ============================================
  const confirmarEliminar = (estadia) => {
    Alert.alert(
      'Eliminar estadía',
      `¿Eliminar "${estadia.empresa}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await estadiasAPI.eliminarEstadia(estadia._id);
            if (res.exito) {
              Alert.alert('Éxito', 'Estadía eliminada');
              cargarEstadias();
            } else {
              Alert.alert('Error', res.mensaje || 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  // ============================================
  // CAMBIAR ESTADO (solo maestro)
  // ============================================
  const cambiarEstado = async (estadiaId, nuevoEstado) => {
    try {
      const res = await estadiasAPI.actualizarEstadia(estadiaId, { estado: nuevoEstado });
      if (res.exito) {
        cargarEstadias();
      } else {
        Alert.alert('Error', res.mensaje || 'No se pudo actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      const d = new Date(fecha + 'T00:00:00');
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const infoEstado = (estado) => {
    switch (estado) {
      case 'en-curso':
        return { label: 'En curso', color: '#059669', bg: '#d1fae5', icon: 'play-circle' };
      case 'completada':
        return { label: 'Completada', color: '#475569', bg: '#e2e8f0', icon: 'checkmark-circle' };
      case 'cancelada':
        return { label: 'Cancelada', color: '#dc2626', bg: '#fee2e2', icon: 'close-circle' };
      default:
        return { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'time' };
    }
  };

  // ============================================
  // RENDER TARJETA DE ESTADÍA
  // ============================================
  const renderEstadia = ({ item }) => {
    const estado = infoEstado(item.estado);

    return (
      <View style={styles.card}>
        {esMaestro && item.alumno_creador_nombre && (
          <View style={styles.cardAlumno}>
            <Icon name="person-circle-outline" size={16} color="#4338ca" />
            <Text style={styles.cardAlumnoTexto}>
              Alumno: <Text style={{ fontWeight: '700' }}>{item.alumno_creador_nombre}</Text>
            </Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Icon name="business-outline" size={18} color="#667eea" />
          <Text style={styles.cardTitulo} numberOfLines={1}>
            {item.titulo || (item.nombre && item.apellidos ? `${item.nombre} ${item.apellidos}` : 'Sin título')}
          </Text>
        </View>

        <View style={styles.cardFila}>
          <Icon name="briefcase-outline" size={14} color="#64748b" />
          <Text style={styles.cardEmpresa}>{item.empresa}</Text>
        </View>

        <View style={styles.cardFila}>
          <Icon name="calendar-outline" size={14} color="#10b981" />
          <Text style={styles.cardFecha}>
            {formatearFecha(item.fecha_inicio)} → {formatearFecha(item.fecha_fin)}
          </Text>
        </View>

        <View style={styles.cardFila}>
          <Icon name="time-outline" size={14} color="#667eea" />
          <Text style={styles.cardFecha}>{item.horas || 0} h</Text>
          {item.ubicacion ? (
            <>
              <Icon name="location-outline" size={14} color="#64748b" style={{ marginLeft: 12 }} />
              <Text style={styles.cardFecha} numberOfLines={1}>
                {item.ubicacion}
              </Text>
            </>
          ) : null}
        </View>

        {item.proyecto ? (
          <View style={styles.cardFila}>
            <Icon name="bulb-outline" size={14} color="#667eea" />
            <Text style={styles.cardFecha} numberOfLines={1}>
              Proyecto: {item.proyecto}
            </Text>
          </View>
        ) : null}

        {item.maestro_nombre ? (
          <View style={styles.cardFila}>
            <Icon name="school-outline" size={14} color="#64748b" />
            <Text style={styles.cardFecha} numberOfLines={1}>
              Asesor: {item.maestro_nombre}
            </Text>
          </View>
        ) : null}

        <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
          <Icon name={estado.icon} size={14} color={estado.color} />
          <Text style={[styles.estadoTexto, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>

        {esMaestro && (
          <View style={styles.selectorEstado}>
            <Text style={styles.selectorLabel}>Cambiar estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectorBotones}>
                {estados.slice(1).map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[
                      styles.selectorBtn,
                      item.estado === e.key && styles.selectorBtnActivo
                    ]}
                    onPress={() => cambiarEstado(item._id, e.key)}
                  >
                    <Text
                      style={[
                        styles.selectorBtnTexto,
                        item.estado === e.key && styles.selectorBtnTextoActivo
                      ]}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ✅ BOTONES SEGÚN ROL */}
        <View style={styles.acciones}>
          {/* Botón Editar: SOLO ALUMNO */}
          {esAlumno && (
            <TouchableOpacity
              style={styles.btnAccion}
              onPress={() => navigation.navigate('CrearEstadia', { estadiaId: item._id })}
            >
              <Icon name="create-outline" size={16} color="#4338ca" />
              <Text style={styles.btnAccionTexto}>Editar</Text>
            </TouchableOpacity>
          )}

          {/* Botón Registrar horas: SOLO ALUMNO */}
          {esAlumno && (
            <TouchableOpacity
              style={[styles.btnAccion, styles.btnRegistrarHoras]}
              onPress={() => navigation.navigate('RegistrarHoras', { estadiaId: item._id })}
            >
              <Icon name="time-outline" size={16} color="#fff" />
              <Text style={styles.btnRegistrarHorasTexto}>Registrar horas</Text>
            </TouchableOpacity>
          )}

          {/* Botón Eliminar: ambos roles */}
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnEliminar]}
            onPress={() => confirmarEliminar(item)}
          >
            <Icon name="trash-outline" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading || !user || !user._id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.textoCarga}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={styles.headerTitle}>
            <Icon name="business-outline" size={22} color="#667eea" />{' '}
            {esMaestro ? 'Estadías de Alumnos' : 'Mis Estadías'}
          </Text>
          <Text style={styles.headerSub}>
            {estadiasFiltradas.length} {estadiasFiltradas.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>

        {esAlumno && (
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => navigation.navigate('CrearEstadia')}
          >
            <Icon name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de búsqueda (ambos roles) */}
      <View style={styles.busquedaContainer}>
        <Icon name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.busquedaInput}
          placeholder="Buscar por empresa, proyecto..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Icon name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ Filtros por estado: SOLO MAESTRO */}
      {esMaestro && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtrosContainer}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {estados.map((e) => (
            <TouchableOpacity
              key={e.key}
              style={[
                styles.filtroBtn,
                filtroEstado === e.key && styles.filtroBtnActivo
              ]}
              onPress={() => setFiltroEstado(e.key)}
            >
              <Icon
                name={e.icon}
                size={14}
                color={filtroEstado === e.key ? '#fff' : '#64748b'}
              />
              <Text
                style={[
                  styles.filtroTexto,
                  filtroEstado === e.key && styles.filtroTextoActivo
                ]}
              >
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Lista */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.textoCarga}>Cargando estadías...</Text>
        </View>
      ) : estadiasFiltradas.length === 0 ? (
        <View style={styles.vacio}>
          <Icon name="business-outline" size={70} color="#cbd5e1" />
          <Text style={styles.vacioTitulo}>
            {estadias.length === 0
              ? esMaestro
                ? 'Aún no hay estadías de tus alumnos'
                : 'No tienes estadías registradas'
              : 'No hay resultados con ese filtro'}
          </Text>
          {esAlumno && estadias.length === 0 && (
            <TouchableOpacity
              style={styles.btnCrearPrimera}
              onPress={() => navigation.navigate('CrearEstadia')}
            >
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnCrearPrimeraTexto}>Solicitar mi primera estadía</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={estadiasFiltradas}
          keyExtractor={(item) => item._id}
          renderItem={renderEstadia}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => {
                setRefrescando(true);
                cargarEstadias();
              }}
              colors={['#667eea']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  btnAgregar: {
    backgroundColor: '#667eea',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busquedaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  busquedaInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    padding: 0,
  },
  filtrosContainer: {
    marginTop: 12,
    maxHeight: 40,
  },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    gap: 4,
  },
  filtroBtnActivo: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filtroTexto: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filtroTextoActivo: { color: '#fff' },
  lista: { padding: 12, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAlumno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  cardAlumnoTexto: {
    fontSize: 12,
    color: '#4338ca',
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  cardEmpresa: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  cardFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  cardFecha: {
    fontSize: 12,
    color: '#64748b',
    flexShrink: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  estadoTexto: { fontSize: 11, fontWeight: '700' },
  selectorEstado: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  selectorLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  selectorBotones: { flexDirection: 'row', gap: 6 },
  selectorBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  selectorBtnActivo: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  selectorBtnTexto: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  selectorBtnTextoActivo: { color: '#fff' },
  acciones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  btnAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    gap: 5,
  },
  btnAccionTexto: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '700',
  },
  btnRegistrarHoras: {
    backgroundColor: '#6366f1',
    flex: 1,
  },
  btnRegistrarHorasTexto: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  btnEliminar: { backgroundColor: '#fee2e2' },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarga: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  vacioTitulo: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '500',
  },
  btnCrearPrimera: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 20,
  },
  btnCrearPrimeraTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});