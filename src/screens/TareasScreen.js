// ============================================
// TareasScreen - Gestión de tareas (CON NAVEGACIÓN CORRECTA)
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { tareasAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function TareasScreen({ navigation }) {
  const { user, isLoading } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      let result;
      
      if (user.rol === 'alumno') {
        result = await tareasAPI.getTareasAlumno(user._id);
      } else {
        result = await tareasAPI.getTareasLider(user._id);
      }

      if (result.exito) {
        setTareas(result.tareas || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarTareas();
  };

  // Función para ver detalle de tarea
  const verDetalleTarea = (tareaId) => {
    navigation.navigate('DetalleTarea', { tareaId });
  };

  // Función para calificar (maestro)
  const calificarTarea = (tareaId) => {
    navigation.navigate('CalificarTarea', { tareaId });
  };

  // Función para entregar (alumno)
  const entregarTarea = (tareaId, equipoId) => {
    navigation.navigate('EntregarTarea', { tareaId, equipoId });
  };

  const renderTarea = ({ item }) => {
    const estaVencida = item.fecha_limite && new Date(item.fecha_limite) < new Date();
    const esLider = user.rol === 'maestro' && item.lider_id === user._id;
    const esAlumno = user.rol === 'alumno';
    
    return (
      <View style={[styles.tareaCard, estaVencida && styles.tareaVencida]}>
        <View style={styles.tareaHeader}>
          <Text style={styles.tareaTitulo}>{item.titulo}</Text>
          {estaVencida && (
            <View style={styles.vencidaBadge}>
              <Text style={styles.vencidaText}>Vencida</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.tareaDescripcion}>{item.descripcion || 'Sin descripción'}</Text>
        
        <View style={styles.tareaMeta}>
          <Text style={styles.tareaEquipo}>
            <Icon name="people-outline" size={14} /> {item.equipo_nombre || 'Sin equipo'}
          </Text>
          {item.fecha_limite && (
            <Text style={styles.tareaFecha}>
              📅 {new Date(item.fecha_limite).toLocaleDateString('es-MX')}
            </Text>
          )}
        </View>

        <View style={styles.accionesContainer}>
          {/* Botón Ver Detalle (todos) */}
          <TouchableOpacity 
            style={[styles.accionButton, styles.verButton]}
            onPress={() => verDetalleTarea(item._id)}
          >
            <Icon name="eye-outline" size={16} color="#667eea" />
            <Text style={styles.accionButtonText}>Ver</Text>
          </TouchableOpacity>

          {/* Botón Calificar (solo maestros líderes) */}
          {esLider && (
            <TouchableOpacity 
              style={[styles.accionButton, styles.calificarButton]}
              onPress={() => calificarTarea(item._id)}
            >
              <Icon name="star-outline" size={16} color="#f59e0b" />
              <Text style={[styles.accionButtonText, styles.calificarText]}>Calificar</Text>
            </TouchableOpacity>
          )}

          {/* Botón Entregar (solo alumnos) */}
          {esAlumno && (
            <TouchableOpacity 
              style={[styles.accionButton, styles.entregarButton]}
              onPress={() => entregarTarea(item._id, item.equipo_id)}
            >
              <Icon name="cloud-upload-outline" size={16} color="#10b981" />
              <Text style={[styles.accionButtonText, styles.entregarText]}>Entregar</Text>
            </TouchableOpacity>
          )}
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
          <Text style={styles.loadingText}>Cargando tareas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Tareas</Text>
          <Text style={styles.headerSubtitle}>
            {user.rol === 'alumno' ? 'Tareas asignadas' : 'Tareas de tus equipos'}
          </Text>
        </View>

        <FlatList
          data={tareas}
          renderItem={renderTarea}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkmark-done-circle-outline" size={60} color="#d1d5db" />
              <Text style={styles.emptyTitle}>¡Sin tareas pendientes!</Text>
              <Text style={styles.emptyText}>
                {user.rol === 'alumno' 
                  ? 'Has completado todas tus tareas' 
                  : 'No hay tareas pendientes en tus equipos'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
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
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  tareaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tareaVencida: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tareaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  vencidaBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vencidaText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  tareaDescripcion: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  tareaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tareaEquipo: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tareaFecha: {
    fontSize: 12,
    color: '#f59e0b',
  },
  accionesContainer: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  accionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  verButton: {
    backgroundColor: '#f0f0ff',
  },
  calificarButton: {
    backgroundColor: '#fffbeb',
  },
  entregarButton: {
    backgroundColor: '#ecfdf5',
  },
  accionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  calificarText: {
    color: '#f59e0b',
  },
  entregarText: {
    color: '#10b981',
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
});