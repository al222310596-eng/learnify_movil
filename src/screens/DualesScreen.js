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
  Share,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { dualesAPI } from '../api/api';

const { width } = Dimensions.get('window');

export default function DualesScreen({ navigation }) {
  const { user } = useAuth();
  const [duales, setDuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal de detalle
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDual, setSelectedDual] = useState(null);
  
  // Estado para el menú de confirmación de eliminación
  const [dualAEliminar, setDualAEliminar] = useState(null);

  const esMaestro = user?.rol === 'maestro';
  const esAlumno = user?.rol === 'alumno';

  // ============================================
  // CARGAR DUALES
  // ============================================
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

  const onRefresh = () => {
    setRefreshing(true);
    cargarDuales();
  };

  // ============================================
  // VER DETALLE
  // ============================================
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

  // ============================================
  // FIRMA - NAVEGAR A PANTALLA INDEPENDIENTE
  // ============================================
  const abrirFirma = (dualId, asignacionIndex) => {
    console.log('✏️ Navegando a pantalla de firma');
    navigation.navigate('Firma', { 
      dualId, 
      asignacionIndex 
    });
  };

  // ============================================
  // ELIMINAR DUAL
  // ============================================
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

  // ============================================
  // GENERAR PDF
  // ============================================
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
Título: ${dual.titulo}
Empresa: ${dual.empresa}
Descripción: ${dual.descripcion || 'Sin descripción'}
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
Firma: ${a.firmado ? '✅ FIRMADO' : '❌ PENDIENTE'}
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

  // ============================================
  // UTILIDADES
  // ============================================
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
  };

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'activo': return { color: '#10b981', text: 'Activo', icon: 'play-circle' };
      case 'pendiente': return { color: '#f59e0b', text: 'Pendiente', icon: 'time' };
      case 'inactivo': return { color: '#94a3b8', text: 'Inactivo', icon: 'stop-circle' };
      default: return { color: '#94a3b8', text: estado || 'Pendiente', icon: 'time' };
    }
  };

  // ============================================
  // RENDER TARJETA
  // ============================================
  const renderDual = ({ item }) => {
    const estadoInfo = getEstadoInfo(item.estado);
    const totalFirmas = item.asignaciones?.length || 0;
    const firmasCompletadas = item.asignaciones?.filter(a => a.firmado).length || 0;

    // Verificar si el usuario es maestro asignado a alguna materia pendiente
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
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color + '20' }]}>
              <Icon name={estadoInfo.icon} size={12} color={estadoInfo.color} />
              <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
                {estadoInfo.text}
              </Text>
            </View>
          </View>

          <Text style={styles.dualEmpresa}>
            <Icon name="business-outline" size={14} color="#94a3b8" /> {item.empresa}
          </Text>

          <View style={styles.dualFechas}>
            <Text style={styles.fechaText}>
              <Icon name="calendar-outline" size={12} color="#94a3b8" /> Inicio: {formatearFecha(item.fecha_inicio)}
            </Text>
            <Text style={styles.fechaText}>
              <Icon name="calendar-outline" size={12} color="#94a3b8" /> Fin: {formatearFecha(item.fecha_fin)}
            </Text>
          </View>

          {esMaestro && item.alumno && (
            <Text style={styles.alumnoText}>
              <Icon name="person-outline" size={14} color="#94a3b8" /> Alumno: {item.alumno.nombre}
            </Text>
          )}

          {esAlumno && (
            <Text style={styles.firmasText}>
              <Icon name="document-text-outline" size={14} color="#8b5cf6" /> Firmas: {firmasCompletadas}/{totalFirmas}
            </Text>
          )}
        </TouchableOpacity>

        {/* ========================================== */}
        {/* BOTONES EN TARJETA PRINCIPAL */}
        {/* ========================================== */}
        <View style={styles.dualActions}>
          {/* Botón Detalles */}
          <TouchableOpacity style={styles.actionButton} onPress={() => verDetalle(item)}>
            <Icon name="eye-outline" size={18} color="#667eea" />
            <Text style={styles.actionText}>Detalles</Text>
          </TouchableOpacity>

          {/* Botón Firmar (solo maestro asignado a materia pendiente) */}
          {tieneFirmaPendiente && (
            <TouchableOpacity
              style={[styles.actionButton, styles.firmaButton]}
              onPress={() => abrirFirma(item._id, asignacionPendienteIndex)}
            >
              <Icon name="create-outline" size={18} color="#8b5cf6" />
              <Text style={[styles.actionText, styles.firmaText]}>Firmar</Text>
            </TouchableOpacity>
          )}

          {/* Botón Editar (solo maestro creador) */}
          {esMaestro && item.estado !== 'inactivo' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('CrearDual', { dualId: item._id })}
            >
              <Icon name="create-outline" size={18} color="#f59e0b" />
              <Text style={[styles.actionText, styles.editText]}>Editar</Text>
            </TouchableOpacity>
          )}

          {/* Botón Eliminar (solo maestro creador) */}
          {esMaestro && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => confirmarEliminar(item._id, item.titulo)}
            >
              <Icon name="trash-outline" size={18} color="#ef4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
            </TouchableOpacity>
          )}

          {/* Botón PDF (solo alumno) */}
          {esAlumno && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pdfButton]}
              onPress={() => generarPDF(item)}
            >
              <Icon name="document-text-outline" size={18} color="#dc2626" />
              <Text style={[styles.actionText, styles.pdfText]}>PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER MODAL DETALLE (Simplificado)
  // ============================================
  const renderModalDetalle = () => {
    if (!selectedDual) return null;
    const dual = selectedDual;

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
                <Icon name="close-outline" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Título</Text>
                <Text style={styles.detalleValor}>{dual.titulo || 'Sin título'}</Text>
              </View>

              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Empresa</Text>
                <Text style={styles.detalleValor}>{dual.empresa || 'Sin empresa'}</Text>
              </View>

              <View style={styles.detalleField}>
                <Text style={styles.detalleLabel}>Estado</Text>
                <View style={[styles.estadoBadgeLarge, { backgroundColor: getEstadoInfo(dual.estado).color + '20' }]}>
                  <Icon name={getEstadoInfo(dual.estado).icon} size={16} color={getEstadoInfo(dual.estado).color} />
                  <Text style={[styles.estadoTextLarge, { color: getEstadoInfo(dual.estado).color }]}>
                    {getEstadoInfo(dual.estado).text}
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
                  <Text style={styles.detalleLabel}>Descripción</Text>
                  <Text style={styles.detalleValor}>{dual.descripcion}</Text>
                </View>
              )}

              <View style={styles.firmasSection}>
                <Text style={styles.firmasSectionTitle}>
                  <Icon name="document-text-outline" size={18} color="#8b5cf6" /> Materias y Firmas
                </Text>
                {dual.asignaciones && dual.asignaciones.length > 0 ? (
                  dual.asignaciones.map((a, index) => {
                    const esMaestroAsignado = a.maestro_email === user?.email;
                    
                    return (
                      <View key={index} style={styles.asignacionItem}>
                        <View style={styles.asignacionInfo}>
                          <Text style={styles.asignacionMateria}>{a.materia || 'Sin materia'}</Text>
                          <Text style={styles.asignacionMaestro}>
                            <Icon name="person-outline" size={12} color="#94a3b8" /> {a.maestro_nombre || 'No asignado'}
                            {a.maestro_email ? ` (${a.maestro_email})` : ''}
                          </Text>
                        </View>
                        <View style={[styles.firmaBadge, a.firmado ? styles.firmaFirmado : styles.firmaPendiente]}>
                          {a.firmado ? (
                            <>
                              <Icon name="checkmark-circle" size={14} color="#10b981" />
                              <Text style={styles.firmaTextFirmado}>Firmado</Text>
                            </>
                          ) : (
                            <>
                              <Icon name="time-outline" size={14} color="#f59e0b" />
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

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Icon name="briefcase-outline" size={22} color="#667eea" /> Mis Duales
        </Text>
        {esMaestro && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CrearDual')}
          >
            <Icon name="add-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={duales}
        renderItem={renderDual}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="briefcase-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tienes duales</Text>
            <Text style={styles.emptyText}>
              {esMaestro
                ? 'Crea un nuevo dual para empezar'
                : 'Espera a que te asignen un dual'}
            </Text>
          </View>
        }
      />

      {renderModalDetalle()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  createButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  dualCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dualCardActivo: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  dualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dualTitulo: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  dualEmpresa: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  dualFechas: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  alumnoText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  firmasText: {
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 2,
  },
  dualActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  firmaButton: {
    backgroundColor: '#f0f0ff',
  },
  firmaText: {
    color: '#8b5cf6',
  },
  editButton: {
    backgroundColor: '#fffbeb',
  },
  editText: {
    color: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteText: {
    color: '#ef4444',
  },
  pdfButton: {
    backgroundColor: '#fef2f2',
  },
  pdfText: {
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
  },
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  firmasSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  firmasSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#1e293b',
  },
  asignacionMaestro: {
    fontSize: 12,
    color: '#94a3b8',
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
    fontWeight: '600',
  },
  firmaTextPendiente: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
  },
  firmarButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  firmarButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modalEditButton: {
    backgroundColor: '#f59e0b',
  },
  modalPdfButton: {
    backgroundColor: '#dc2626',
  },
  modalCloseButton: {
    backgroundColor: '#f1f5f9',
  },
  modalActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalCloseText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
});