// ============================================
// DualesScreen.js - CON BOTONES EN TARJETA PRINCIPAL
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  TextInput,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { dualesAPI } from '../api/api';

export default function DualesScreen({ navigation }) {
  const { user } = useAuth();
  const [duales, setDuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDual, setSelectedDual] = useState(null);
  const [dualAEliminar, setDualAEliminar] = useState(null);
  const [filtrados, setFiltrados] = useState([]);       // la lista ya filtrada
  const [filtroEstado, setFiltroEstado] = useState('todos'); // chip seleccionado
  const [busqueda, setBusqueda] = useState('');          // texto del buscador

  const esMaestro = user?.rol === 'maestro';
  const esAlumno = user?.rol === 'alumno';

  const cargarDuales = async () => {
    try {
      setLoading(true);
      const result = await dualesAPI.getDuales(user?._id);
      if (result.exito) {
        setDuales(result.duales || []);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al cargar duales');
      }
    } catch (error) {
      console.error('Error al cargar duales:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDuales();
  }, []);


  // Cada vez que cambie la lista, el chip o el texto, se vuelve a filtrar
useEffect(() => {
  aplicarFiltros();
}, [duales, filtroEstado, busqueda]);

const aplicarFiltros = () => {
  let resultado = [...duales];

  // Solo maestros pueden filtrar por estado
  if (esMaestro && filtroEstado !== 'todos') {
    resultado = resultado.filter(d => d.estado === filtroEstado);
  }

  // Búsqueda por título, empresa o nombre del alumno
  if (busqueda.trim()) {
    const q = busqueda.toLowerCase();
    resultado = resultado.filter(d =>
      (d.titulo || '').toLowerCase().includes(q) ||
      (d.empresa || '').toLowerCase().includes(q) ||
      (d.alumno?.nombre || '').toLowerCase().includes(q)
    );
  }

  setFiltrados(resultado);
};

  const onRefresh = () => {
    setRefreshing(true);
    cargarDuales();
  };

  const verDetalle = async (dual) => {
    if (dual.asignaciones && dual.alumno) {
      setSelectedDual(dual);
      setModalVisible(true);
      return;
    }

    try {
      const result = await dualesAPI.getDetalleDual(dual._id);
      if (result.exito) {
        setSelectedDual(result.dual);
        setModalVisible(true);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al cargar el detalle');
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const cerrarDetalle = () => {
    setModalVisible(false);
    setSelectedDual(null);
  };

  const abrirFirma = (dualId, asignacionIndex) => {
    navigation.navigate('Firma', { dualId, asignacionIndex });
  };

  const confirmarEliminar = (dualId, dualNombre) => {
    Alert.alert(
      'Eliminar Dual',
      `¿Estás seguro de que quieres eliminar el dual "${dualNombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarDual(dualId)
        }
      ]
    );
  };

  const eliminarDual = async (dualId) => {
    try {
      const result = await dualesAPI.eliminarDual(dualId);
      if (result.exito) {
        Alert.alert('Éxito', 'Dual eliminado correctamente');
        cargarDuales();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al eliminar el dual');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const generarPDF = async (dual) => {
    try {
      let contenido = `
============================================
REPORTE DE DUAL - LEARNIFY
============================================

DATOS DEL ALUMNO
--------------------------------------------
Nombre: ${dual.alumno?.nombre || 'No disponible'}
Correo: ${dual.alumno?.email || 'No disponible'}

DATOS DEL DUAL
--------------------------------------------
Titulo: ${dual.titulo}
Empresa: ${dual.empresa}
Descripcion: ${dual.descripcion || 'Sin descripcion'}
Cuatrimestre: ${dual.cuatrimestre || 'No especificado'}
Curso: ${dual.curso || 'No especificado'}
Carrera: ${dual.carrera || 'No especificado'}
Tutor: ${dual.tutor || 'No asignado'}
Horas: ${dual.horas}
Fecha Inicio: ${formatearFecha(dual.fecha_inicio)}
Fecha Fin: ${formatearFecha(dual.fecha_fin)}
Estado: ${dual.estado}

MATERIAS Y FIRMAS
--------------------------------------------
`;

      if (dual.asignaciones && dual.asignaciones.length > 0) {
        dual.asignaciones.forEach(a => {
          contenido += `
Materia: ${a.materia || 'Sin materia'}
Maestro: ${a.maestro_nombre || 'No asignado'} (${a.maestro_email || 'Sin correo'})
Firma: ${a.firmado ? 'FIRMADO' : 'PENDIENTE'}
--------------------------------------------
`;
        });
      } else {
        contenido += 'No hay materias asignadas.\n';
      }

      contenido += `
============================================
Generado el: ${new Date().toLocaleString('es-MX')}
============================================
`;

      await Share.share({
        message: contenido,
        title: `Reporte Dual - ${dual.titulo}`
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
  };

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'activo': return { color: '#059669', bg: '#d1fae5', text: 'Activo', icon: 'play-circle' };
      case 'pendiente': return { color: '#d97706', bg: '#fef3c7', text: 'Pendiente', icon: 'time' };
      case 'inactivo': return { color: '#64748b', bg: '#e2e8f0', text: 'Inactivo', icon: 'stop-circle' };
      default: return { color: '#64748b', bg: '#f1f5f9', text: estado || 'Pendiente', icon: 'time' };
    }
  };

  const renderDual = ({ item }) => {
    const estadoInfo = getEstadoInfo(item.estado);
    const totalFirmas = item.asignaciones?.length || 0;
    const firmasCompletadas = item.asignaciones?.filter(a => a.firmado).length || 0;

    let tieneFirmaPendiente = false;
    let asignacionPendienteIndex = -1;

    if (esMaestro && item.asignaciones) {
      item.asignaciones.forEach((a, index) => {
        if (!a.firmado && a.maestro_email === user?.email) {
          tieneFirmaPendiente = true;
          asignacionPendienteIndex = index;
        }
      });
    }

    return (
      <View style={[styles.dualCard, item.estado === 'activo' && styles.dualCardActivo]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => verDetalle(item)}
        >
          <View style={styles.dualHeader}>
            <Text style={styles.dualTitulo} numberOfLines={1}>{item.titulo}</Text>
            {/* NUEVO: badge con bg unificado */}
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
              <Icon name={estadoInfo.icon} size={12} color={estadoInfo.color} />
              <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
                {estadoInfo.text}
              </Text>
            </View>
          </View>

          {/* NUEVO: filas con icono al estilo EstadiasScreen */}
          <View style={styles.fila}>
            <Icon name="business-outline" size={16} color="#667eea" />
            <Text style={styles.dualEmpresa} numberOfLines={1}>{item.empresa}</Text>
          </View>

          <View style={styles.fila}>
            <Icon name="calendar-outline" size={16} color="#667eea" />
            <Text style={styles.fechaText}>
              {formatearFecha(item.fecha_inicio)} - {formatearFecha(item.fecha_fin)}
            </Text>
          </View>

          {esMaestro && item.alumno && (
            <View style={styles.fila}>
              <Icon name="person-outline" size={16} color="#667eea" />
              <Text style={styles.alumnoText} numberOfLines={1}>
                Alumno: <Text style={{ fontWeight: '700' }}>{item.alumno.nombre}</Text>
              </Text>
            </View>
          )}

          {esAlumno && (
            <View style={styles.fila}>
              <Icon name="document-text-outline" size={16} color="#667eea" />
              <Text style={styles.firmasText}>
                Firmas: {firmasCompletadas}/{totalFirmas}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.dualActions}>
          <TouchableOpacity style={[styles.actionButton, styles.actionVer]} onPress={() => verDetalle(item)}>
            <Icon name="eye-outline" size={15} color="#4338ca" />
            <Text style={styles.actionTextVer}>Detalles</Text>
          </TouchableOpacity>

          {tieneFirmaPendiente && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionFirma]}
              onPress={() => abrirFirma(item._id, asignacionPendienteIndex)}
            >
              <Icon name="create-outline" size={15} color="#4338ca" />
              <Text style={styles.actionTextVer}>Firmar</Text>
            </TouchableOpacity>
          )}

          {esMaestro && item.estado !== 'inactivo' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionEditar]}
              onPress={() => navigation.navigate('CrearDual', { dualId: item._id })}
            >
              <Icon name="create-outline" size={15} color="#d97706" />
              <Text style={styles.actionTextEditar}>Editar</Text>
            </TouchableOpacity>
          )}

          {esMaestro && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionEliminar]}
              onPress={() => confirmarEliminar(item._id, item.titulo)}
            >
              <Icon name="trash-outline" size={15} color="#dc2626" />
              <Text style={styles.actionTextEliminar}>Eliminar</Text>
            </TouchableOpacity>
          )}

          {esAlumno && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionEliminar]}
              onPress={() => generarPDF(item)}
            >
              <Icon name="document-text-outline" size={15} color="#dc2626" />
              <Text style={styles.actionTextEliminar}>PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderModalDetalle = () => {
    if (!selectedDual) return null;
    const dual = selectedDual;
    const est = getEstadoInfo(dual.estado);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarDetalle}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Icon name="briefcase-outline" size={20} color="#667eea" /> Detalle del Dual
              </Text>
              <TouchableOpacity onPress={cerrarDetalle}>
                <Icon name="close-outline" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Titulo</Text>
                <Text style={styles.detalleValor}>{dual.titulo || 'Sin titulo'}</Text>
              </View>

              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Empresa</Text>
                <Text style={styles.detalleValor}>{dual.empresa || 'Sin empresa'}</Text>
              </View>

              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Estado</Text>
                <View style={[styles.estadoBadgeLarge, { backgroundColor: est.bg }]}>
                  <Icon name={est.icon} size={16} color={est.color} />
                  <Text style={[styles.estadoTextLarge, { color: est.color }]}>
                    {est.text}
                  </Text>
                </View>
              </View>

              <View style={styles.detalleRow}>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Cuatrimestre</Text>
                  <Text style={styles.detalleValor}>{dual.cuatrimestre || 'No especificado'}</Text>
                </View>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Curso</Text>
                  <Text style={styles.detalleValor}>{dual.curso || 'No especificado'}</Text>
                </View>
              </View>

              <View style={styles.detalleRow}>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Carrera</Text>
                  <Text style={styles.detalleValor}>{dual.carrera || 'No especificado'}</Text>
                </View>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Horas</Text>
                  <Text style={styles.detalleValor}>{dual.horas || 0}</Text>
                </View>
              </View>

              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Tutor</Text>
                <Text style={styles.detalleValor}>{dual.tutor || 'No asignado'}</Text>
              </View>

              <View style={styles.detalleRow}>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Fecha Inicio</Text>
                  <Text style={styles.detalleValor}>{formatearFecha(dual.fecha_inicio)}</Text>
                </View>
                <View style={[styles.detalleField, styles.detalleHalf]}>
                  <Text style={styles.detalleLabel}>Fecha Fin</Text>
                  <Text style={styles.detalleValor}>{formatearFecha(dual.fecha_fin)}</Text>
                </View>
              </View>

              {dual.alumno && (
                <View style={styles.detalleField}>
                  <Text style={styles.detalleLabel}>Alumno</Text>
                  <Text style={styles.detalleValor}>{dual.alumno.nombre} ({dual.alumno.email})</Text>
                </View>
              )}

              {dual.descripcion && (
                <View style={styles.detalleField}>
                  <Text style={styles.detalleLabel}>Descripcion</Text>
                  <Text style={styles.detalleValor}>{dual.descripcion}</Text>
                </View>
              )}

              <View style={styles.firmasSection}>
                <Text style={styles.firmasSectionTitle}>
                  <Icon name="document-text-outline" size={18} color="#667eea" /> Materias y Firmas
                </Text>
                {dual.asignaciones && dual.asignaciones.length > 0 ? (
                  dual.asignaciones.map((a, index) => {
                    return (
                      <View key={index} style={styles.asignacionItem}>
                        <View style={styles.asignacionInfo}>
                          <Text style={styles.asignacionMateria}>{a.materia || 'Sin materia'}</Text>
                          <View style={styles.fila}>
                            <Icon name="person-outline" size={12} color="#94a3b8" />
                            <Text style={styles.asignacionMaestro}>
                              {a.maestro_nombre || 'No asignado'}
                              {a.maestro_email ? ` (${a.maestro_email})` : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.firmaBadge, a.firmado ? styles.firmaFirmado : styles.firmaPendiente]}>
                          {a.firmado ? (
                            <>
                              <Icon name="checkmark-circle" size={14} color="#059669" />
                              <Text style={styles.firmaTextFirmado}>Firmado</Text>
                            </>
                          ) : (
                            <>
                              <Icon name="time-outline" size={14} color="#d97706" />
                              <Text style={styles.firmaTextPendiente}>Pendiente</Text>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.sinAsignaciones}>No hay materias asignadas.</Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalCloseButton]}
                  onPress={cerrarDetalle}
                >
                  <Text style={styles.modalCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };


  const estados = [
  { key: 'todos', label: 'Todos' },
  { key: 'activo', label: 'Activo' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'inactivo', label: 'Inactivo' },
];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando duales...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* NUEVO: header unificado con EstadiasScreen */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            <Icon name="briefcase-outline" size={22} color="#667eea" />{' '}
            Mis Duales
          </Text>
        </View>
        {esMaestro && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CrearDual')}
          >
            <Icon name="add-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de búsqueda */}
<View style={styles.searchContainer}>
  <Icon name="search-outline" size={20} color="#94a3b8" />
  <TextInput
    style={styles.searchInput}
    placeholder="Buscar por título, empresa o alumno..."
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

{/* Chips de estado - SOLO MAESTRO */}
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

      <FlatList
        data={filtrados}
        renderItem={renderDual}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="briefcase-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {duales.length === 0 ? 'No tienes duales' : 'Sin resultados'}
            </Text>
            <Text style={styles.emptyText}>
              {duales.length === 0
                ? (esMaestro
                    ? 'Crea un nuevo dual para empezar'
                    : 'Espera a que te asignen un dual')
                : 'No hay resultados con los filtros actuales'}
            </Text>
          </View>
        }
      />

      {renderModalDetalle()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // NUEVO: fondo unificado
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  // NUEVO: header unificado con EstadiasScreen
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // NUEVO: botón crear circular 38x38
  createButton: {
    backgroundColor: '#667eea',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  // NUEVO: tarjeta homogénea (borderRadius 14, padding 16, shadow 0.05)
  dualCard: {
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
  dualCardActivo: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  dualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // NUEVO: tipografía unificada
  dualTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // NUEVO: filas con icono iguales a EstadiasScreen
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dualEmpresa: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  fechaText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  alumnoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  firmasText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  // NUEVO: acciones con separador superior igual a EstadiasScreen
  dualActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  // NUEVO: botones de acción homogéneos
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  actionVer: {
    backgroundColor: '#e0e7ff',
  },
  actionTextVer: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '700',
  },
  actionFirma: {
    backgroundColor: '#e0e7ff',
  },
  actionEditar: {
    backgroundColor: '#fef3c7',
  },
  actionTextEditar: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
  },
  actionEliminar: {
    backgroundColor: '#fee2e2',
  },
  actionTextEliminar: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  // NUEVO: modal con borderRadius 20 unificado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 16,
  },
  detalleField: {
    marginBottom: 12,
  },
  detalleLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  detalleValor: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  detalleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detalleHalf: {
    flex: 1,
  },
  estadoBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  estadoTextLarge: {
    fontSize: 14,
    fontWeight: '700',
  },
  firmasSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  firmasSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  asignacionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  asignacionInfo: {
    flex: 1,
  },
  asignacionMateria: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  asignacionMaestro: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  firmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  firmaFirmado: {
    backgroundColor: '#d1fae5',
  },
  firmaPendiente: {
    backgroundColor: '#fef3c7',
  },
  firmaTextFirmado: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  firmaTextPendiente: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '700',
  },
  sinAsignaciones: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalCloseButton: {
    backgroundColor: '#e0e7ff',
  },
  modalCloseText: {
    color: '#4338ca',
    fontWeight: '700',
    fontSize: 13,
  },

    // Filtros (iguales a EstadiasScreen)
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
});