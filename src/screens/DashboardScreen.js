// ============================================
// DashboardScreen - Pantalla principal
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { equiposAPI, tareasAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DashboardScreen({ navigation }) {
  const { user, isLoading, logout } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const equiposResult = await equiposAPI.getEquipos(user._id);
      if (equiposResult.exito) {
        setEquipos(equiposResult.equipos || []);
      }

      if (user.rol === 'alumno') {
        const tareasResult = await tareasAPI.getTareasAlumno(user._id);
        if (tareasResult.exito) {
          setTareas(tareasResult.tareas || []);
        }
      } else if (user.rol === 'maestro') {
        const tareasResult = await tareasAPI.getTareasLider(user._id);
        if (tareasResult.exito) {
          setTareas(tareasResult.tareas || []);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              <Icon name="home-outline" size={22} color="#667eea" />{' '}
              ¡Hola, {user?.nombre || 'Usuario'}!
            </Text>
            <Text style={styles.headerSubtitle}>
              {user?.rol === 'maestro' ? 'Maestro' : 'Alumno'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{equipos.length}</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{tareas.length}</Text>
            <Text style={styles.statLabel}>Tareas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {tareas.filter(t => t.total_entregas > 0).length}
            </Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
        </View>

        {/* Botón de videollamada */}
        <TouchableOpacity
          style={styles.videoCallButton}
          onPress={() => navigation.navigate('Videollamada')}
        >
          <Icon name="videocam" size={22} color="#fff" />
          <Text style={styles.videoCallButtonText}>Videollamada</Text>
        </TouchableOpacity>

        {/* Equipos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Equipos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Equipos')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {equipos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes equipos aún</Text>
            </View>
          ) : (
            equipos.slice(0, 3).map((equipo, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.equipoCard}
                onPress={() => navigation.navigate('Equipos')}
              >
                <View style={styles.equipoCardInfo}>
                  <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                  <Text style={styles.equipoInfo}>
                    {equipo.total_miembros || 0} miembros
                  </Text>
                </View>
                <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Tareas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas Pendientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tareas')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {tareas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay tareas pendientes</Text>
            </View>
          ) : (
            tareas.slice(0, 3).map((tarea, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tareaCard}
                onPress={() => navigation.navigate('Tareas')}
              >
                <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
                <View style={styles.fila}>
                  <Icon name="people-outline" size={14} color="#667eea" />
                  <Text style={styles.tareaEquipo}>{tarea.equipo_nombre}</Text>
                </View>
                {tarea.fecha_limite && (
                  <View style={styles.fila}>
                    <Icon name="calendar-outline" size={14} color="#667eea" />
                    <Text style={styles.tareaFecha}>
                      {new Date(tarea.fecha_limite).toLocaleDateString('es-MX')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // NUEVO: fondo unificado
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  // NUEVO: header unificado con el de EstadiasScreen
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
  headerInfo: {
    flex: 1,
  },
  // NUEVO: tipografía del header igual a EstadiasScreen
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
  logoutButton: {
    padding: 8,
  },
  // NUEVO: tarjetas de estadística homogéneas con las de EstadiasScreen
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  // NUEVO: botón videollamada con paleta unificada (primario)
  videoCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  videoCallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  // NUEVO: tarjeta de equipo con estilo homogéneo (borderRadius 14, padding 16)
  equipoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  equipoCardInfo: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  equipoInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  // NUEVO: tarjeta de tarea con estilo homogéneo
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
  tareaTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  // NUEVO: filas con icono iguales a EstadiasScreen
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tareaEquipo: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  tareaFecha: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});