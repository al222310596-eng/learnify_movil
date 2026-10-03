// ============================================
// ARCHIVO: EstadiasScreen.js
// Lista de Estadías con todas las acciones + Imprimir
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
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
  const [generandoPDFId, setGenerandoPDFId] = useState(null); // ID de la estadía que se está imprimiendo
  const [nuevas, setNuevas] = useState({ total: 0, ids: [], lista: [] }); //Noti

  const esMaestro = user?.rol === 'maestro';
  const esAlumno = user?.rol === 'alumno';

  useFocusEffect(
    useCallback(() => {
      if (user && user._id) {
        cargarEstadias();
      }
    }, [user])
  );

  useEffect(() => {
    aplicarFiltros();
  }, [estadias, filtroEstado, busqueda]);

  const cargarEstadias = async () => {
    if (!user || !user._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await estadiasAPI.getEstadias(user._id);
      if (result.exito) {
        setEstadias(result.estadias || []);
      } else {
        setEstadias([]);
      }

      await cargarNuevas(); //Noti
    } catch (error) {
      console.error('Error al cargar:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadías');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

//noti
  const cargarNuevas = async () => {
    if (!esMaestro || !user?._id) return;
    const res = await estadiasAPI.getEstadiasNuevas(user._id);
    if (res.exito) {
      setNuevas({
        total: res.total_nuevas || 0,
        ids: (res.estadias || []).map(e => e._id),
        lista: res.estadias || [],
      });
    }
  };

  const marcarComoVistas = async () => {
    await estadiasAPI.marcarEstadiasVistas(user._id);
    setNuevas({ total: 0, ids: [], lista: [] });
  };



  const aplicarFiltros = () => {
    let resultado = [...estadias];

    // ✅ Solo maestros pueden filtrar por estado
    if (esMaestro && filtroEstado !== 'todos') {
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

  // ============================================
  // IMPRIMIR FORMATO DE UNA ESTADÍA (desde la tarjeta)
  // ============================================
  const imprimirEstadia = async (estadia) => {
    try {
      setGenerandoPDFId(estadia._id);
      
      const html = await estadiasAPI.getFormatoHTML(estadia._id);
      if (!html || typeof html !== 'string') {
        throw new Error('No se pudo obtener el formato');
      }

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!base64) throw new Error('No se pudo generar el PDF');

      const destino = `${FileSystem.documentDirectory}Formato_Estadia_${estadia._id}.pdf`;
      await FileSystem.writeAsStringAsync(destino, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destino, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir formato de estadía',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF generado', `Guardado en: ${destino}`);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setGenerandoPDFId(null);
    }
  };

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

  const renderEstadia = ({ item }) => {
    const estadoInfo = etiquetaEstado(item.estado);
    const imprimiendo = generandoPDFId === item._id;

    return (
      <View style={styles.card}>
        {/* ✅ NUEVO: ETIQUETA NUEVA Noti */}
        {esMaestro && nuevas.ids.includes(item._id) && (
          <View style={styles.etiquetaNueva}>
            <Text style={styles.etiquetaNuevaTexto}>NUEVA</Text>
          </View>
        )}

        <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
          <Icon name={estadoInfo.icono} size={14} color={estadoInfo.color} />
          <Text style={[styles.badgeText, { color: estadoInfo.color }]}>
            {estadoInfo.texto}
          </Text>
        </View>

        {esMaestro && item.alumno_creador_nombre && (
          <View style={styles.cardAlumno}>
            <Icon name="person-circle-outline" size={14} color="#4338ca" />
            <Text style={styles.cardAlumnoTexto} numberOfLines={1}>
              Alumno: <Text style={{ fontWeight: '700' }}>{item.alumno_creador_nombre}</Text>
            </Text>
          </View>
        )}

        <Text style={styles.proyecto} numberOfLines={2}>
          {item.proyecto || 'Proyecto sin nombre'}
        </Text>

        <View style={styles.fila}>
          <Icon name="business-outline" size={16} color="#667eea" />
          <Text style={styles.empresa} numberOfLines={1}>
            {item.empresa || 'Empresa no especificada'}
          </Text>
        </View>

        <View style={styles.fila}>
          <Icon name="calendar-outline" size={16} color="#667eea" />
          <Text style={styles.fechas}>
            {formatearFecha(item.fecha_inicio)} → {formatearFecha(item.fecha_fin)}
          </Text>
        </View>

        {/* ✅ ACCIONES */}
        <View style={styles.acciones}>
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnVer]}
            onPress={() => navigation.navigate('DetalleEstadia', { id: item._id })}
          >
            <Icon name="eye-outline" size={15} color="#4338ca" />
            <Text style={styles.btnVerTexto}>Ver</Text>
          </TouchableOpacity>

          {/* Imprimir - Ambos roles */}
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnImprimir]}
            onPress={() => imprimirEstadia(item)}
            disabled={imprimiendo}
          >
            {imprimiendo ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="print-outline" size={15} color="#fff" />
                <Text style={styles.btnImprimirTexto}>Imprimir</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Editar - SOLO ALUMNO */}
          {esAlumno && (
            <TouchableOpacity
              style={[styles.btnAccion, styles.btnEditar]}
              onPress={() => navigation.navigate('CrearEstadia', { estadiaId: item._id })}
            >
              <Icon name="create-outline" size={15} color="#4338ca" />
              <Text style={styles.btnEditarTexto}>Editar</Text>
            </TouchableOpacity>
          )}

          {/* Registrar horas - Ambos roles (según retroalimentación) */}
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnRegistrar]}
            onPress={() => navigation.navigate('RegistrarHoras', { estadiaId: item._id })}
          >
            <Icon name="time-outline" size={15} color="#fff" />
            <Text style={styles.btnRegistrarTexto}>Registrar</Text>
          </TouchableOpacity>

          {/* Eliminar - ambos */}
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnEliminar]}
            onPress={() => confirmarEliminar(item)}
          >
            <Icon name="trash-outline" size={15} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            <Icon name="business-outline" size={22} color="#667eea" />{' '}
            {esMaestro ? 'Estadías de Alumnos' : 'Mis Estadías'}
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

      {/* ✅ NUEVO: BANNER DE NOTIFICACIÓN */}
      
      {esMaestro && nuevas.total > 0 && (
        <View style={styles.banner}>
          <Icon name="notifications" size={20} color="#b45309" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitulo}>
              {nuevas.total === 1
                ? 'Tienes 1 estadía nueva'
                : `Tienes ${nuevas.total} estadías nuevas`}
            </Text>
            {nuevas.lista[0] && (
              <Text style={styles.bannerTexto} numberOfLines={1}>
                {nuevas.lista[0].alumno_nombre} · {nuevas.lista[0].empresa}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={marcarComoVistas} style={styles.bannerBtn}>
            <Text style={styles.bannerBtnTexto}>Marcar vistas</Text>
          </TouchableOpacity>
        </View>
      )}


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

      {/* Filtros - SOLO MAESTRO */}
      {esMaestro && (
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
      )}

      {filtradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {estadias.length === 0
              ? esMaestro
                ? 'Aún no hay estadías de tus alumnos'
                : 'Aún no tienes estadías registradas'
              : 'No hay resultados con los filtros actuales'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnAgregar: {
    backgroundColor: '#667eea',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  chipsWrapper: { height: 60, marginTop: 8 },
  chipsScroll: { flexGrow: 0 },
  chipsContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    height: 36,
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

  cardAlumno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  cardAlumnoTexto: {
    fontSize: 12,
    color: '#4338ca',
    flex: 1,
  },

  proyecto: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 8 },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  empresa: { fontSize: 14, color: '#475569', flex: 1 },
  fechas: { fontSize: 13, color: '#64748b', flex: 1 },

  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  btnVer: { backgroundColor: '#e0e7ff' },
  btnVerTexto: { fontSize: 12, color: '#4338ca', fontWeight: '700' },
  btnImprimir: { backgroundColor: '#0ea5e9' },
  btnImprimirTexto: { fontSize: 12, color: '#fff', fontWeight: '700' },
  btnEditar: { backgroundColor: '#e0e7ff' },
  btnEditarTexto: { fontSize: 12, color: '#4338ca', fontWeight: '700' },
  btnRegistrar: { backgroundColor: '#6366f1', flex: 1 },
  btnRegistrarTexto: { fontSize: 12, color: '#fff', fontWeight: '700' },
  btnEliminar: { backgroundColor: '#fee2e2' },

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
// ✅ NUEVO: notificación
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginHorizontal: 15,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  bannerTitulo: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  bannerTexto: { fontSize: 12, color: '#b45309', marginTop: 2 },
  bannerBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerBtnTexto: { fontSize: 11, fontWeight: '700', color: '#fff' },
  etiquetaNueva: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  etiquetaNuevaTexto: { fontSize: 10, fontWeight: '800', color: '#fff' },

});