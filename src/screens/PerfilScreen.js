// ============================================
// PerfilScreen - Perfil del usuario
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PerfilScreen() {
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error en logout:', error);
              Alert.alert('Error', 'Ocurrió un error al cerrar sesión');
            }
          }
        }
      ]
    );
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView style={styles.container}>
        {/* NUEVO: header unificado con EstadiasScreen */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.nombre}>{user.nombre || 'Usuario'}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>
              {user.rol === 'maestro' ? 'Maestro' : 'Alumno'}
            </Text>
          </View>
          <View style={styles.emailFila}>
            <Icon name="mail-outline" size={14} color="#94a3b8" />
            <Text style={styles.email}>{user.email || 'sin correo'}</Text>
          </View>
        </View>

        {/* Opciones */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem}>
            <Icon name="person-outline" size={22} color="#667eea" />
            <Text style={styles.optionText}>Editar perfil</Text>
            <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Icon name="notifications-outline" size={22} color="#667eea" />
            <Text style={styles.optionText}>Notificaciones</Text>
            <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Icon name="color-palette-outline" size={22} color="#667eea" />
            <Text style={styles.optionText}>Tema</Text>
            <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, styles.optionItemLast]}>
            <Icon name="help-circle-outline" size={22} color="#667eea" />
            <Text style={styles.optionText}>Ayuda y soporte</Text>
            <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* NUEVO: estadisticas como tarjeta homogénea */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            <Icon name="stats-chart-outline" size={18} color="#667eea" />{' '}
            Estadísticas
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Equipos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Tareas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Entregas</Text>
            </View>
          </View>
        </View>

        {/* NUEVO: botón de logout con estilo de botón unificado */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Learnify v1.0.0</Text>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  // NUEVO: header unificado con EstadiasScreen (misma paleta y bordes)
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  // NUEVO: avatar con paleta primaria
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  // NUEVO: tipografía unificada
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // NUEVO: badge rol con paleta primaria suave
  rolBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  rolText: {
    fontSize: 13,
    color: '#4338ca',
    fontWeight: '700',
  },
  emailFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  email: {
    fontSize: 13,
    color: '#94a3b8',
  },
  // NUEVO: opciones como tarjeta homogénea
  optionsContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 15,
    fontWeight: '500',
  },
  // NUEVO: estadisticas como tarjeta homogénea
  statsContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  // NUEVO: botón de cerrar sesión unificado como botón con borde
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
});