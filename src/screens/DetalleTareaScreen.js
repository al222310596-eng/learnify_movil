// ============================================
// DetalleTareaScreen - Detalle de una tarea
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { tareasAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DetalleTareaScreen({ route, navigation }) {
  const { user } = useAuth();
  const { tareaId, equipoId } = route.params || {};
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tareaId) {
      Alert.alert('Error', 'No se especificó la tarea');
      navigation.goBack();
      return;
    }
    cargarDetalle();
  }, [tareaId]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const result = await tareasAPI.getDetalleTarea(tareaId);
      if (result.exito) {
        setTarea(result.tarea);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al cargar detalle');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const esLider = tarea?.lider_id === user._id;
  const esAlumno = user.rol === 'alumno' && !esLider;
  const miEntrega = esAlumno && tarea?.entregas?.find(e => e.alumno_id === user._id);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tarea) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <Icon name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.loadingText}>No se encontró la tarea</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle de Tarea
        </Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Información de la tarea */}
        <View style={styles.infoCard}>
          <Text style={styles.titulo}>{tarea.titulo}</Text>
          <Text style={styles.descripcion}>{tarea.descripcion || 'Sin descripción'}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Icon name="person-outline" size={16} color="#94a3b8" />
              <Text style={styles.metaText}>Creada por: {tarea.creador_nombre}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="people-outline" size={16} color="#94a3b8" />
              <Text style={styles.metaText}>Equipo: {tarea.equipo_nombre}</Text>
            </View>
            {tarea.fecha_limite && (
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={16} color="#f59e0b" />
                <Text style={[styles.metaText, styles.fechaLimite]}>
                  Límite: {new Date(tarea.fecha_limite).toLocaleDateString('es-MX')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Mi entrega (alumnos) */}
        {esAlumno && (
          <View style={styles.miEntregaCard}>
            <Text style={styles.sectionTitle}>
              <Icon name="cloud-upload-outline" size={18} color="#667eea" /> Mi Entrega
            </Text>
            {miEntrega ? (
              <View style={styles.entregaInfo}>
                <Text style={styles.entregaFecha}>
                  <Icon name="checkmark-circle-outline" size={14} color="#10b981" />
                  Entregada el: {new Date(miEntrega.fecha_entrega).toLocaleDateString('es-MX')}
                </Text>
                {miEntrega.calificacion !== null && (
                  <Text style={styles.entregaCalificacion}>
                    <Icon name="star-outline" size={14} color="#f59e0b" />
                    Calificación: {miEntrega.calificacion}/100
                  </Text>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.sinEntregaText}>Aún no has entregado esta tarea</Text>
                <TouchableOpacity
                  style={styles.entregarAhoraButton}
                  onPress={() => navigation.navigate('EntregarTarea', { tareaId, equipoId })}
                >
                  <Text style={styles.entregarAhoraText}>
                    <Icon name="send-outline" size={16} color="#fff" /> Entregar ahora
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Entregas de alumnos (maestros) */}
        {esLider && (
          <View style={styles.entregasCard}>
            <Text style={styles.sectionTitle}>
              <Icon name="people-outline" size={18} color="#667eea" /> Entregas de Alumnos
            </Text>
            {tarea.entregas?.length > 0 ? (
              <View>
                <Text style={styles.entregasCount}>
                  Total: {tarea.entregas.length} entregas
                </Text>
                {tarea.entregas.slice(0, 3).map((entrega, index) => (
                  <View key={index} style={styles.entregaResumen}>
                    <Text style={styles.entregaAlumno}>{entrega.alumno_nombre}</Text>
                    {entrega.calificacion !== null ? (
                      <Text style={styles.entregaNota}>{entrega.calificacion}/100</Text>
                    ) : (
                      <Text style={styles.entregaSinNota}>Sin calificar</Text>
                    )}
                  </View>
                ))}
                {tarea.entregas.length > 3 && (
                  <Text style={styles.verMasText}>+{tarea.entregas.length - 3} más</Text>
                )}
                <TouchableOpacity
                  style={styles.verEntregasButton}
                  onPress={() => navigation.navigate('CalificarTarea', { tareaId })}
                >
                  <Text style={styles.verEntregasText}>Ver todas las entregas</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.sinEntregasText}>No hay entregas aún</Text>
            )}
          </View>
        )}

        {/* Botón para ver/calificar entregas (maestros) */}
        {esLider && (
          <TouchableOpacity
            style={styles.verEntregasFullButton}
            onPress={() => navigation.navigate('CalificarTarea', { tareaId })}
          >
            <Text style={styles.verEntregasFullText}>
              <Icon name="list-outline" size={18} color="#667eea" /> Gestionar entregas
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
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
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  descripcion: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 20,
  },
  metaContainer: {
    marginTop: 12,
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  fechaLimite: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  miEntregaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  entregaInfo: {
    gap: 6,
  },
  entregaFecha: {
    fontSize: 14,
    color: '#10b981',
  },
  entregaCalificacion: {
    fontSize: 14,
    color: '#f59e0b',
  },
  sinEntregaText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
  },
  entregarAhoraButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  entregarAhoraText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  entregasCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entregasCount: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
  },
  entregaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  entregaAlumno: {
    fontSize: 14,
    color: '#1e293b',
  },
  entregaNota: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  entregaSinNota: {
    fontSize: 14,
    color: '#f59e0b',
  },
  verMasText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  verEntregasButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  verEntregasText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  sinEntregasText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 10,
  },
  verEntregasFullButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verEntregasFullText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
});