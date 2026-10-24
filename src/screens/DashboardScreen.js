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
import { equiposAPI, tareasAPI, minutasAPI, historialAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DashboardScreen({ navigation }) {
  const { user, isLoading, logout } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [minutas, setMinutas] = useState([]);
  const [historial, setHistorial] = useState([]);

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

      // Cargar minutas
      const minutasResult = await minutasAPI.getMinutas(user._id);
      if (minutasResult.exito) {
        setMinutas(minutasResult.minutas || []);
      }

      // ✅ Cargar historial de descargas
      const historialResult = await historialAPI.obtener(user._id);
      if (historialResult.exito) {
        setHistorial(historialResult.historial || []);
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
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{minutas.length}</Text>
            <Text style={styles.statLabel}>Minutas</Text>
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

        {/* Sección de Minutas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Minutas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MisMinutas')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {minutas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes minutas aún</Text>
              <TouchableOpacity
                style={styles.btnCrearMinuta}
                onPress={() => navigation.navigate('CrearMinuta')}
              >
                <Icon name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnCrearMinutaText}>Crear minuta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            minutas.slice(0, 3).map((minuta, index) => (
              <TouchableOpacity
                key={minuta._id || index}
                style={styles.minutaCard}
                onPress={() =>
                  navigation.navigate('DetalleMinuta', { minuta })
                }
              >
                <View style={styles.minutaCardInfo}>
                  <Text style={styles.minutaAsunto} numberOfLines={1}>
                    {minuta.asunto}
                  </Text>

                  <View style={styles.fila}>
                    <Icon name="calendar-outline" size={14} color="#667eea" />
                    <Text style={styles.minutaFecha}>
                      {minuta.fecha
                        ? new Date(minuta.fecha + 'T12:00:00').toLocaleDateString('es-MX')
                        : ''}
                      {minuta.hora ? ` · ${minuta.hora}` : ''}
                    </Text>
                  </View>

                  <View style={styles.fila}>
                    <Icon name="people-outline" size={14} color="#667eea" />
                    <Text style={styles.minutaInfo}>
                      {minuta.total_asistentes ?? minuta.asistentes?.length ?? 0} asistentes ·{' '}
                      {minuta.total_acuerdos ?? minuta.acuerdos?.length ?? 0} acuerdos
                    </Text>
                  </View>
                </View>

                <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ✅ Sección de Historial de Descargas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de Descargas</Text>
          </View>

          {historial.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="download-outline" size={28} color="#94a3b8" />
              <Text style={styles.emptyText}>Aún no has descargado documentos</Text>
            </View>
          ) : (
            historial.map((item, index) => {
              // Estilos según tipo
              const tipoStyles = {
                Minuta:  { icon: 'document-text-outline', color: '#d97706', bg: '#fef3c7' },
                Estadía: { icon: 'business-outline',       color: '#059669', bg: '#d1fae5' },
                Dual:    { icon: 'briefcase-outline',      color: '#2563eb', bg: '#dbeafe' },
              };
              const estilo = tipoStyles[item.tipo] || {
                icon: 'document-outline', color: '#4338ca', bg: '#e0e7ff'
              };

              return (
                <View key={item._id || index} style={styles.historialCard}>
                  <View style={[styles.historialIcono, { backgroundColor: estilo.bg }]}>
                    <Icon name={estilo.icon} size={20} color={estilo.color} />
                  </View>

                  <View style={styles.historialInfo}>
                    <Text style={styles.historialTipo}>
                      {item.tipo} descargada
                    </Text>
                    <Text style={styles.historialRef} numberOfLines={1}>
                      {item.referencia || 'Sin título'}
                    </Text>
                  </View>

                  <Text style={styles.historialFecha}>
                    {item.fecha || ''}
                  </Text>
                </View>
              );
            })
          )}
        </View>

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
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
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
    gap: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },

  // Estilos exclusivos de minutas
  minutaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  minutaCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  minutaAsunto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  minutaFecha: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  minutaInfo: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  btnCrearMinuta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  btnCrearMinutaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ============================================
  // Historial de Descargas
  // ============================================
  historialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  historialIcono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historialInfo: {
    flex: 1,
    minWidth: 0,
  },
  historialTipo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  historialRef: {
    fontSize: 12,
    color: '#64748b',
  },
  historialFecha: {
    fontSize: 11,
    color: '#94a3b8',
  },
});