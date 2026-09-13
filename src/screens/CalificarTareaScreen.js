// ============================================
// CalificarTareaScreen - Calificar entregas
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { tareasAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CalificarTareaScreen({ route, navigation }) {
  const { user } = useAuth();
  const { tareaId } = route.params || {};
  const [tarea, setTarea] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [calificacion, setCalificacion] = useState('');
  const [calificando, setCalificando] = useState(false);

  useEffect(() => {
    if (!tareaId) {
      Alert.alert('Error', 'No se especificó la tarea');
      navigation.goBack();
      return;
    }
    cargarDatos();
  }, [tareaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const result = await tareasAPI.getDetalleTarea(tareaId);
      if (result.exito) {
        setTarea(result.tarea);
        setEntregas(result.tarea.entregas || []);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al cargar datos');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCalificar = (entrega) => {
    setEntregaSeleccionada(entrega);
    setCalificacion(entrega.calificacion?.toString() || '');
    setModalVisible(true);
  };

  const guardarCalificacion = async () => {
    const nota = parseFloat(calificacion);
    if (isNaN(nota) || nota < 0 || nota > 100) {
      Alert.alert('Error', 'La calificación debe ser un número entre 0 y 100');
      return;
    }

    setCalificando(true);
    try {
      const result = await tareasAPI.calificarEntrega(entregaSeleccionada._id, nota);
      if (result.exito) {
        Alert.alert('Éxito', 'Calificación guardada');
        setModalVisible(false);
        cargarDatos();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al calificar');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCalificando(false);
    }
  };

  const renderEntrega = ({ item }) => {
    const fecha = new Date(item.fecha_entrega);
    const fechaStr = fecha.toLocaleDateString('es-MX') + ' ' + 
                     fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.entregaCard}>
        <View style={styles.entregaHeader}>
          <Text style={styles.entregaAlumno}>
            <Icon name="person-circle-outline" size={18} color="#667eea" /> {item.alumno_nombre}
          </Text>
          {item.calificacion !== null ? (
            <View style={styles.calificacionBadge}>
              <Text style={styles.calificacionText}>{item.calificacion}/100</Text>
            </View>
          ) : (
            <View style={[styles.calificacionBadge, styles.sinCalificar]}>
              <Text style={[styles.calificacionText, styles.sinCalificarText]}>Sin calificar</Text>
            </View>
          )}
        </View>

        <Text style={styles.entregaFecha}>
          <Icon name="calendar-outline" size={14} color="#94a3b8" /> {fechaStr}
        </Text>

        {item.comentario && (
          <Text style={styles.entregaComentario}>
            <Icon name="chatbubble-outline" size={14} color="#94a3b8" /> {item.comentario}
          </Text>
        )}

        {item.archivo_id && (
          <TouchableOpacity style={styles.verArchivoButton}>
            <Text style={styles.verArchivoText}>
              <Icon name="document-outline" size={14} color="#667eea" /> Ver archivo adjunto
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.calificarButton}
          onPress={() => abrirModalCalificar(item)}
        >
          <Text style={styles.calificarButtonText}>
            <Icon name="star-outline" size={16} color="#fff" /> {item.calificacion !== null ? 'Re-calificar' : 'Calificar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando entregas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            <Icon name="star-outline" size={22} color="#667eea" /> Calificar Entregas
          </Text>
          {tarea && (
            <Text style={styles.headerSubtitle}>{tarea.titulo}</Text>
          )}
        </View>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          <Icon name="people-outline" size={16} color="#94a3b8" /> {entregas.length} entregas
        </Text>
        <Text style={styles.statsText}>
          <Icon name="checkmark-circle-outline" size={16} color="#10b981" /> 
          {entregas.filter(e => e.calificacion !== null).length} calificadas
        </Text>
      </View>

      <FlatList
        data={entregas}
        renderItem={renderEntrega}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No hay entregas</Text>
            <Text style={styles.emptyText}>Aún no hay entregas para esta tarea</Text>
          </View>
        }
      />

      {/* Modal para calificar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calificar Entrega</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close-outline" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {entregaSeleccionada && (
              <View style={styles.modalBody}>
                <Text style={styles.modalAlumno}>
                  <Icon name="person-circle-outline" size={20} color="#667eea" /> 
                  {entregaSeleccionada.alumno_nombre}
                </Text>

                <Text style={styles.modalLabel}>Calificación (0 - 100)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={calificacion}
                  onChangeText={setCalificacion}
                  keyboardType="numeric"
                  placeholder="Ej: 85"
                  placeholderTextColor="#94a3b8"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton]}
                    onPress={guardarCalificacion}
                    disabled={calificando}
                  >
                    {calificando ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalSaveText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  entregaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entregaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entregaAlumno: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  calificacionBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sinCalificar: {
    backgroundColor: '#fef3c7',
  },
  calificacionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  sinCalificarText: {
    color: '#92400e',
  },
  entregaFecha: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  entregaComentario: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  verArchivoButton: {
    marginTop: 8,
  },
  verArchivoText: {
    fontSize: 14,
    color: '#667eea',
  },
  calificarButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  calificarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  modalAlumno: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    color: '#1e293b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#667eea',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});