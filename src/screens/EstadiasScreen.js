// ============================================
// EstadiasScreen - Lista de Estadías
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { estadiasAPI } from '../api/api';

export default function EstadiasScreen({ navigation }) {
  const { user } = useAuth();
  const [estadias, setEstadias] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Cargar cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      cargarEstadias();
    }, [])
  );

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [estadias, filtroEstado, busqueda]);

  const cargarEstadias = async () => {
    try {
      setLoading(true);
      const result = await estadiasAPI.getEstadias(user._id);
      if (result.exito) {
        setEstadias(result.estadias || []);
      } else {
        setEstadias([]);
      }
    } catch (error) {
      console.error('Error al cargar:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadías');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...estadias];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(e => e.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(e =>
        (e.empresa || '').toLowerCase().includes(q) ||
        (e.proyecto || '').toLowerCase().includes(q)
      );
    }

    setFiltradas(resultado);
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarEstadias();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const etiquetaEstado = (estado) => {
    const mapa = {
      'pendiente':  { texto: 'Pendiente',  icono: 'time-outline',         color: '#d97706', bg: '#fef3c7' },
      'en-curso':   { texto: 'En curso',   icono: 'play-circle-outline',  color: '#059669', bg: '#d1fae5' },
      'completada': { texto: 'Completada', icono: 'checkmark-circle-outline', color: '#475569', bg: '#e2e8f0' },
      'cancelada':  { texto: 'Cancelada',  icono: 'close-circle-outline', color: '#dc2626', bg: '#fee2e2' },
    };
    return mapa[estado] || { texto: estado || 'Sin estado', icono: 'help-circle-outline', color: '#64748b', bg: '#f1f5f9' };
  };

  const renderEstadia = ({ item }) => {
    const estadoInfo = etiquetaEstado(item.estado);
    const horas = parseInt(item.horas) || 0;
    const progreso = Math.min(100, (horas / 600) * 100);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalleEstadia', { id: item._id })}
        activeOpacity={0.7}
      >
        {/* Estado badge */}
        <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
          <Icon name={estadoInfo.icono} size={14} color={estadoInfo.color} />
          <Text style={[styles.badgeText, { color: estadoInfo.color }]}>
            {estadoInfo.texto}
          </Text>
        </View>

        {/* Título / Proyecto */}
        <Text style={styles.proyecto} numberOfLines={2}>
          {item.proyecto || 'Proyecto sin nombre'}
        </Text>

        {/* Empresa */}
        <View style={styles.fila}>
          <Icon name="business-outline" size={16} color="#667eea" />
          <Text style={styles.empresa} numberOfLines={1}>
            {item.empresa || 'Empresa no especificada'}
          </Text>
        </View>

        {/* Fechas */}
        <View style={styles.fila}>
          <Icon name="calendar-outline" size={16} color="#667eea" />
          <Text style={styles.fechas}>
            {formatearFecha(item.fecha_inicio)} → {formatearFecha(item.fecha_fin)}
          </Text>
        </View>

        {/* Horas con barra de progreso */}
        <View style={styles.progresoContainer}>
          <View style={styles.fila}>
            <Icon name="hourglass-outline" size={16} color="#667eea" />
            <Text style={styles.horas}>{horas} / 600 hrs</Text>
          </View>
          <View style={styles.progresoBarra}>
            <View style={[styles.progresoFill, { width: `${progreso}%` }]} />
          </View>
        </View>

        {/* Botón ver detalle */}
        <View style={styles.footerCard}>
          <Text style={styles.verDetalle}>Ver detalle</Text>
          <Icon name="chevron-forward-outline" size={18} color="#667eea" />
        </View>
      </TouchableOpacity>
    );
  };

  const estados = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'en-curso', label: 'En curso' },
    { key: 'completada', label: 'Completada' },
    { key: 'cancelada', label: 'Cancelada' },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando estadías...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Icon name="business-outline" size={22} color="#667eea" /> Mis Estadías
        </Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por empresa o proyecto..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Icon name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros por estado (chips horizontales) - CORREGIDO */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {estados.map((e) => (
            <TouchableOpacity
              key={e.key}
              style={[styles.chip, filtroEstado === e.key && styles.chipActivo]}
              onPress={() => setFiltroEstado(e.key)}
            >
              <Text style={[styles.chipText, filtroEstado === e.key && styles.chipTextActivo]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {estadias.length === 0
              ? 'Aún no tienes estadías registradas'
              : 'No hay resultados con los filtros actuales'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item._id}
          renderItem={renderEstadia}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#94a3b8', fontSize: 16 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1e293b' },

  // ✅ NUEVOS ESTILOS - Chips con altura fija
  chipsWrapper: {
    height: 60,              // ← Altura total del área de chips
    marginTop: 8,
  },
  chipsScroll: {
    flexGrow: 0,             // ← Evita que el ScrollView se estire
  },
  chipsContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    height: 36,              // ← Altura fija de cada chip
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chipActivo: { backgroundColor: '#667eea', borderColor: '#667eea' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  chipTextActivo: { color: '#fff', fontWeight: '600' },

  listContent: { padding: 15, paddingTop: 0 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  proyecto: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 8 },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  empresa: { fontSize: 14, color: '#475569', flex: 1 },
  fechas: { fontSize: 13, color: '#64748b', flex: 1 },
  horas: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  progresoContainer: { marginTop: 6 },
  progresoBarra: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progresoFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },

  footerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  verDetalle: { fontSize: 13, color: '#667eea', fontWeight: '600' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
});