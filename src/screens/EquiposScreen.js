// ============================================
// EquiposScreen.js - CON VISUALIZACIÓN DEL ID
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
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { equiposAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';

export default function EquiposScreen({ navigation }) {
  const { user, isLoading } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [descripcionEquipo, setDescripcionEquipo] = useState('');
  const [creando, setCreando] = useState(false);
  const [modalUnirseVisible, setModalUnirseVisible] = useState(false);
  const [codigoEquipo, setCodigoEquipo] = useState('');
  const [uniendo, setUniendo] = useState(false);
  const [modalExitoVisible, setModalExitoVisible] = useState(false);
  const [equipoCreado, setEquipoCreado] = useState(null);

  // Verificar que el usuario existe
  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando usuario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const result = await equiposAPI.getEquipos(user._id);
      if (result.exito) {
        setEquipos(result.equipos || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarEquipos();
  };

  const handleCrearEquipo = async () => {
    if (!nombreEquipo.trim()) {
      Alert.alert('Error', 'El nombre del equipo es obligatorio');
      return;
    }

    setCreando(true);
    try {
      const result = await equiposAPI.crearEquipo(
        nombreEquipo,
        descripcionEquipo,
        user._id
      );

      if (result.exito) {
        // Guardar el equipo creado
        setEquipoCreado({
          id: result.equipo_id,
          nombre: nombreEquipo
        });
        
        setModalVisible(false);
        setNombreEquipo('');
        setDescripcionEquipo('');
        cargarEquipos();
        
        // Mostrar modal con el ID
        setModalExitoVisible(true);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al crear equipo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCreando(false);
    }
  };

  const handleUnirseEquipo = async () => {
    if (!codigoEquipo.trim()) {
      Alert.alert('Error', 'Ingresa el ID del equipo');
      return;
    }

    setUniendo(true);
    try {
      const result = await equiposAPI.unirseEquipo(codigoEquipo.trim(), user._id);
      if (result.exito) {
        Alert.alert('Éxito', 'Te has unido al equipo correctamente');
        setModalUnirseVisible(false);
        setCodigoEquipo('');
        cargarEquipos();
      } else {
        Alert.alert('Error', result.mensaje || 'No se pudo unir al equipo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setUniendo(false);
    }
  };

  const copiarID = async () => {
    if (equipoCreado) {
      await Clipboard.setStringAsync(equipoCreado.id);
      Alert.alert('¡Copiado!', 'El ID del equipo ha sido copiado al portapapeles');
    }
  };

  const compartirID = async () => {
    if (equipoCreado) {
      try {
        await Share.share({
          message: `Únete a mi equipo "${equipoCreado.nombre}" en Learnify.\nID del equipo: ${equipoCreado.id}\n\nDescarga la app y únete con este ID.`,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    }
  };

  const abrirChat = (equipoId, equipoNombre) => {
    navigation.navigate('Chat', { equipoId, equipoNombre });
  };

  const verTareasEquipo = (equipoId) => {
    navigation.navigate('Tareas');
  };

  const verAnalisis = (equipoId) => {
    navigation.navigate('Analisis');
  };

  const confirmarSalirEquipo = (equipoId, equipoNombre) => {
    Alert.alert(
      'Salir del equipo',
      `¿Estás seguro de que quieres salir del equipo "${equipoNombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => salirDelEquipo(equipoId)
        }
      ]
    );
  };

  const salirDelEquipo = async (equipoId) => {
    try {
      const result = await equiposAPI.salirEquipo(equipoId, user._id);
      if (result.exito) {
        Alert.alert('Éxito', 'Has salido del equipo');
        cargarEquipos();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al salir del equipo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const confirmarEliminarEquipo = (equipoId, equipoNombre) => {
    Alert.alert(
      'Eliminar equipo',
      `¿Estás seguro de que quieres eliminar el equipo "${equipoNombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarEquipo(equipoId)
        }
      ]
    );
  };

  const eliminarEquipo = async (equipoId) => {
    try {
      const result = await equiposAPI.eliminarEquipo(equipoId, user._id);
      if (result.exito) {
        Alert.alert('Éxito', 'Equipo eliminado correctamente');
        cargarEquipos();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al eliminar equipo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const renderEquipo = ({ item }) => {
    const esLider = item.lider_id === user._id;
    const esMiembro = !esLider;

    return (
      <View style={styles.equipoCard}>
        <View style={styles.equipoInfo}>
          <View style={styles.equipoHeader}>
            <Text style={styles.equipoNombre}>{item.nombre}</Text>
            {esLider && (
              <View style={styles.liderBadge}>
                <Text style={styles.liderBadgeText}>👑 Líder</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.equipoDescripcion}>
            {item.descripcion || 'Sin descripción'}
          </Text>
          
          <View style={styles.equipoMeta}>
            <Text style={styles.equipoMetaText}>
              <Icon name="people-outline" size={14} color="#94a3b8" /> 
              {item.total_miembros || 0} miembros
            </Text>
            {esLider && (
              <TouchableOpacity 
                style={styles.mostrarIdButton}
                onPress={() => {
                  setEquipoCreado({
                    id: item._id,
                    nombre: item.nombre
                  });
                  setModalExitoVisible(true);
                }}
              >
                <Icon name="key-outline" size={14} color="#667eea" />
                <Text style={styles.mostrarIdText}>Mostrar ID</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.equipoAcciones}>
            <TouchableOpacity 
              style={styles.accionBoton}
              onPress={() => abrirChat(item._id, item.nombre)}
            >
              <Icon name="chatbubble-outline" size={18} color="#667eea" />
              <Text style={styles.accionText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.accionBoton}
              onPress={() => verTareasEquipo(item._id)}
            >
              <Icon name="list-outline" size={18} color="#667eea" />
              <Text style={styles.accionText}>Tareas</Text>
            </TouchableOpacity>

            {esLider && (
              <>
                <TouchableOpacity 
                  style={styles.accionBoton}
                  onPress={() => navigation.navigate('CrearTarea', { 
                    equipoId: item._id, 
                    equipoNombre: item.nombre 
                  })}
                >
                  <Icon name="add-circle-outline" size={18} color="#667eea" />
                  <Text style={styles.accionText}>Crear Tarea</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.accionBoton}
                  onPress={() => verAnalisis(item._id)}
                >
                  <Icon name="analytics-outline" size={18} color="#667eea" />
                  <Text style={styles.accionText}>Análisis</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.accionBoton, styles.accionEliminar]}
                  onPress={() => confirmarEliminarEquipo(item._id, item.nombre)}
                >
                  <Icon name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.accionText, styles.accionEliminarText]}>Eliminar</Text>
                </TouchableOpacity>
              </>
            )}

            {esMiembro && (
              <TouchableOpacity 
                style={[styles.accionBoton, styles.accionSalir]}
                onPress={() => confirmarSalirEquipo(item._id, item.nombre)}
              >
                <Icon name="exit-outline" size={18} color="#f59e0b" />
                <Text style={[styles.accionText, styles.accionSalirText]}>Salir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            <Icon name="people-outline" size={22} color="#667eea" /> Mis Equipos
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => setModalUnirseVisible(true)}
            >
              <Icon name="person-add-outline" size={20} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de equipos */}
        <FlatList
          data={equipos}
          renderItem={renderEquipo}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No tienes equipos</Text>
              <Text style={styles.emptyText}>
                Crea un nuevo equipo o únete a uno existente con el ID
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* Modal Crear Equipo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="people-outline" size={20} color="#667eea" /> Crear Equipo
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Nombre del equipo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Equipo de Desarrollo"
                  placeholderTextColor="#94a3b8"
                  value={nombreEquipo}
                  onChangeText={setNombreEquipo}
                />

                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción del equipo..."
                  placeholderTextColor="#94a3b8"
                  value={descripcionEquipo}
                  onChangeText={setDescripcionEquipo}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.infoBox}>
                  <Icon name="information-circle-outline" size={20} color="#667eea" />
                  <Text style={styles.infoText}>
                    Serás el líder de este equipo. Podrás gestionar miembros y tareas.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.createEquipoButton}
                  onPress={handleCrearEquipo}
                  disabled={creando}
                >
                  {creando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.createEquipoText}>Crear Equipo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Unirse a Equipo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalUnirseVisible}
          onRequestClose={() => setModalUnirseVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="person-add-outline" size={20} color="#667eea" /> Unirse a Equipo
                </Text>
                <TouchableOpacity onPress={() => setModalUnirseVisible(false)}>
                  <Icon name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>ID del equipo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa el ID del equipo"
                  placeholderTextColor="#94a3b8"
                  value={codigoEquipo}
                  onChangeText={setCodigoEquipo}
                  autoCapitalize="none"
                />

                <View style={styles.infoBox}>
                  <Icon name="key-outline" size={20} color="#667eea" />
                  <Text style={styles.infoText}>
                    Pídele el ID del equipo a tu maestro o líder.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.createEquipoButton}
                  onPress={handleUnirseEquipo}
                  disabled={uniendo}
                >
                  {uniendo ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.createEquipoText}>Unirse al Equipo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Éxito - Mostrar ID del equipo creado */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalExitoVisible}
          onRequestClose={() => setModalExitoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalExitoContent]}>
              <View style={styles.modalExitoHeader}>
                <Icon name="checkmark-circle" size={50} color="#10b981" />
                <Text style={styles.modalExitoTitle}>¡Equipo Creado!</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalExitoSubtitle}>
                  Comparte este ID con tus alumnos para que se unan:
                </Text>
                
                <View style={styles.idContainer}>
                  <Text style={styles.idTexto}>{equipoCreado?.id || 'Cargando...'}</Text>
                </View>

                <View style={styles.modalExitoButtons}>
                  <TouchableOpacity 
                    style={[styles.modalExitoButton, styles.copiarButton]}
                    onPress={copiarID}
                  >
                    <Icon name="copy-outline" size={20} color="#fff" />
                    <Text style={styles.modalExitoButtonText}>Copiar ID</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalExitoButton, styles.compartirButton]}
                    onPress={compartirID}
                  >
                    <Icon name="share-outline" size={20} color="#fff" />
                    <Text style={styles.modalExitoButtonText}>Compartir</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.modalExitoCerrar}
                  onPress={() => setModalExitoVisible(false)}
                >
                  <Text style={styles.modalExitoCerrarText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButton: {
    padding: 10,
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 10,
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  equipoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  equipoInfo: {
    flex: 1,
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipoNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  liderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liderBadgeText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
  },
  equipoDescripcion: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  equipoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  equipoMetaText: {
    fontSize: 13,
    color: '#94a3b8',
    marginRight: 12,
  },
  mostrarIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mostrarIdText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
    fontWeight: '500',
  },
  equipoAcciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  accionBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  accionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  accionEliminar: {
    backgroundColor: '#fef2f2',
  },
  accionEliminarText: {
    color: '#ef4444',
  },
  accionSalir: {
    backgroundColor: '#fffbeb',
  },
  accionSalirText: {
    color: '#f59e0b',
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
    paddingHorizontal: 30,
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
  inputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
    flex: 1,
  },
  createEquipoButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  createEquipoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para modal de éxito
  modalExitoContent: {
    paddingBottom: 10,
  },
  modalExitoHeader: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 10,
  },
  modalExitoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
  },
  modalExitoSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 15,
  },
  idContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  idTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: 1,
  },
  modalExitoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  modalExitoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  copiarButton: {
    backgroundColor: '#667eea',
  },
  compartirButton: {
    backgroundColor: '#10b981',
  },
  modalExitoButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalExitoCerrar: {
    padding: 12,
    alignItems: 'center',
  },
  modalExitoCerrarText: {
    color: '#94a3b8',
    fontSize: 15,
  },
});