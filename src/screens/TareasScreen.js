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
            <Icon name="people-outline" size={14} color="#667eea" /> {item.equipo_nombre || 'Sin equipo'}
          </Text>
          {item.fecha_limite && (
            <Text style={styles.tareaFecha}>
              <Icon name="calendar-outline" size={14} color="#667eea" /> {new Date(item.fecha_limite).toLocaleDateString('es-MX')}
            </Text>
          )}
        </View>

        <View style={styles.accionesContainer}>
          {/* Botón Ver Detalle (todos) */}
          <TouchableOpacity 
            style={[styles.accionButton, styles.verButton]}
            onPress={() => verDetalleTarea(item._id)}
          >
            <Icon name="eye-outline" size={15} color="#4338ca" />
            <Text style={styles.verText}>Ver</Text>
          </TouchableOpacity>

          {/* Botón Calificar (solo maestros líderes) */}
          {esLider && (
            <TouchableOpacity 
              style={[styles.accionButton, styles.calificarButton]}
              onPress={() => calificarTarea(item._id)}
            >
              <Icon name="star-outline" size={15} color="#d97706" />
              <Text style={styles.calificarText}>Calificar</Text>
            </TouchableOpacity>
          )}

          {/* Botón Entregar (solo alumnos) */}
          {esAlumno && (
            <TouchableOpacity 
              style={[styles.accionButton, styles.entregarButton]}
              onPress={() => entregarTarea(item._id, item.equipo_id)}
            >
              <Icon name="cloud-upload-outline" size={15} color="#fff" />
              <Text style={styles.entregarText}>Entregar</Text>
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
          <Text style={styles.headerTitle}>
            <Icon name="list-outline" size={22} color="#667eea" />{' '}
            Mis Tareas
          </Text>
          <Text style={styles.headerSubtitle}>
            {user.rol === 'alumno' ? 'Tareas asignadas' : 'Tareas de tus equipos'}
          </Text>
        </View>

        <FlatList
          data={tareas}
          renderItem={renderTarea}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkmark-done-circle-outline" size={60} color="#cbd5e1" />
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
  // NUEVO: fondo unificado con las demas pantallas
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  // NUEVO: tarjeta homogenea (borderRadius 14, padding 16, shadow 0.05, elevation 2) igual a EstadiasScreen
  tareaCard: {
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
  // NUEVO: borde rojo mas oscuro para que combine con paleta
  tareaVencida: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  // NUEVO: header de tarjeta con margen compacto
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  // NUEVO: tipografia de titulo consistente (17/700)
  tareaTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  // NUEVO: badge vencida con paleta unificada
  vencidaBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vencidaText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  // NUEVO: descripcion con tipografia consistente y margen compacto
  tareaDescripcion: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
  },
  // NUEVO: meta unificada (sin separador extra para evitar espacio)
  tareaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // NUEVO: texto de equipo con tipografia consistente
  tareaEquipo: {
    fontSize: 13,
    color: '#475569',
    flexShrink: 1,
  },
  // NUEVO: fecha con color de texto secundario (no ambar que desentona)
  tareaFecha: {
    fontSize: 13,
    color: '#475569',
    flexShrink: 1,
  },
  // NUEVO: acciones con separador superior y espaciado uniforme
  accionesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  // NUEVO: botones de accion homogeneos con EstadiasScreen
  accionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  // NUEVO: boton Ver con paleta primaria suave (igual a EstadiasScreen)
  verButton: {
    backgroundColor: '#e0e7ff',
  },
  verText: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '700',
  },
  // NUEVO: boton Calificar con paleta ambar suave
  calificarButton: {
    backgroundColor: '#fef3c7',
  },
  calificarText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
  },
  // NUEVO: boton Entregar como solido (btnRegistrar de EstadiasScreen)
  entregarButton: {
    backgroundColor: '#6366f1',
  },
  entregarText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  // NUEVO: empty state con paleta y tipografia unificada
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
});