// ============================================
// AnalisisScreen - Análisis de alumnos (solo maestros)
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
  StatusBar,
  FlatList
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { equiposAPI, analisisAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AnalisisScreen({ navigation }) {
  const { user, isLoading } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [alumnosRiesgo, setAlumnosRiesgo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);

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

  // Solo maestros pueden ver análisis
  useEffect(() => {
    if (user.rol !== 'maestro') {
      Alert.alert('Acceso denegado', 'Solo los maestros tienen acceso a esta sección');
      navigation.goBack();
    }
  }, [user]);

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const result = await equiposAPI.getEquipos(user._id);
      if (result.exito && result.equipos) {
        setEquipos(result.equipos);
        if (result.equipos.length > 0) {
          setEquipoSeleccionado(result.equipos[0]._id);
          cargarDatosEquipo(result.equipos[0]._id);
        }
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosEquipo = async (equipoId) => {
    try {
      setCargandoDatos(true);
      
      const statsResult = await analisisAPI.getEstadisticas(equipoId);
      if (statsResult.exito) {
        setEstadisticas(statsResult.estadisticas);
      }

      const riesgoResult = await analisisAPI.getRiesgo(equipoId);
      if (riesgoResult.exito) {
        setAlumnosRiesgo(riesgoResult.alumnos || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargandoDatos(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (equipoSeleccionado) {
      cargarDatosEquipo(equipoSeleccionado);
    } else {
      cargarEquipos();
    }
  };

  const getRiesgoColor = (nivel) => {
    switch (nivel) {
      case 'Alto': return '#ef4444';
      case 'Medio': return '#f59e0b';
      case 'Bajo': return '#10b981';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando análisis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            <Icon name="analytics-outline" size={22} color="#667eea" /> Análisis de Alumnos
          </Text>
          <Text style={styles.headerSubtitle}>Datos y métricas de tus equipos</Text>
        </View>

        {equipos.length > 0 && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Selecciona un equipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
              {equipos.map((equipo) => (
                <TouchableOpacity
                  key={equipo._id}
                  style={[
                    styles.selectorOption,
                    equipoSeleccionado === equipo._id && styles.selectorOptionActive
                  ]}
                  onPress={() => {
                    setEquipoSeleccionado(equipo._id);
                    cargarDatosEquipo(equipo._id);
                  }}
                >
                  <Text style={[
                    styles.selectorText,
                    equipoSeleccionado === equipo._id && styles.selectorTextActive
                  ]}>
                    {equipo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {equipos.length === 0 && (
          <View style={styles.emptyCard}>
            <Icon name="people-outline" size={50} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tienes equipos</Text>
            <Text style={styles.emptyText}>Crea un equipo para ver análisis</Text>
          </View>
        )}

        {cargandoDatos ? (
          <View style={styles.loadingDataContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingDataText}>Cargando datos...</Text>
          </View>
        ) : estadisticas && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{estadisticas.total_alumnos || 0}</Text>
                <Text style={styles.statLabel}>Total Alumnos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{estadisticas.promedio_general?.toFixed(1) || '0'}</Text>
                <Text style={styles.statLabel}>Promedio General</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                  {estadisticas.alumnos_riesgo || 0}
                </Text>
                <Text style={styles.statLabel}>En Riesgo</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Icon name="warning-outline" size={18} color="#ef4444" /> Alumnos en Riesgo
              </Text>
              {alumnosRiesgo.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay alumnos en riesgo</Text>
                </View>
              ) : (
                alumnosRiesgo.slice(0, 5).map((alumno, index) => (
                  <View key={index} style={styles.alumnoCard}>
                    <View style={styles.alumnoInfo}>
                      <Text style={styles.alumnoNombre}>{alumno.nombre}</Text>
                      <Text style={styles.alumnoPromedio}>Promedio: {alumno.promedio?.toFixed(1) || 0}%</Text>
                    </View>
                    <View style={[styles.riesgoBadge, { backgroundColor: getRiesgoColor(alumno.nivel_riesgo) }]}>
                      <Text style={styles.riesgoText}>{alumno.nivel_riesgo}</Text>
                    </View>
                  </View>
                ))
              )}
              {alumnosRiesgo.length > 5 && (
                <TouchableOpacity style={styles.verMasButton}>
                  <Text style={styles.verMasText}>Ver todos ({alumnosRiesgo.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
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
  selectorContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectorLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '500',
  },
  selectorScroll: {
    flexDirection: 'row',
  },
  selectorOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  selectorOptionActive: {
    backgroundColor: '#667eea',
  },
  selectorText: {
    color: '#64748b',
    fontSize: 14,
  },
  selectorTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  alumnoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alumnoInfo: {
    flex: 1,
  },
  alumnoNombre: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  alumnoPromedio: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  riesgoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riesgoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    margin: 15,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  loadingDataContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingDataText: {
    marginTop: 10,
    color: '#94a3b8',
  },
  verMasButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  verMasText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
});