// ============================================
// AppNavigator - Navegación completa de la app
// ============================================

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// Importar pantallas de autenticación
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Importar pantallas principales
import DashboardScreen from '../screens/DashboardScreen';
import EquiposScreen from '../screens/EquiposScreen';
import TareasScreen from '../screens/TareasScreen';
import PerfilScreen from '../screens/PerfilScreen';

// Importar pantallas de Duales
import DualesScreen from '../screens/DualesScreen';
import CrearDualScreen from '../screens/CrearDualScreen';

// Importar otras pantallas
import ChatScreen from '../screens/ChatScreen';
import AnalisisScreen from '../screens/AnalisisScreen';
import EstadiasScreen from '../screens/EstadiasScreen';
import CrearEquipoScreen from '../screens/CrearEquipoScreen';
import CrearTareaScreen from '../screens/CrearTareaScreen';
import EntregarTareaScreen from '../screens/EntregarTareaScreen';
import CalificarTareaScreen from '../screens/CalificarTareaScreen';
import DetalleTareaScreen from '../screens/DetalleTareaScreen';
import FirmaScreen from '../screens/FirmaScreen';

// Pantallas de Estadías
import CrearEstadiaScreen from '../screens/CrearEstadiaScreen';
import RegistrarHorasScreen from '../screens/RegistrarHorasScreen';
import DetalleEstadiaScreen from '../screens/DetalleEstadiaScreen';

// Importar la pantalla de videollamada
import VideollamadaScreen from '../screens/VideollamadaScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================
// COMPONENTE DE CARGA PARA TRANSICIÓN
// ============================================

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.loadingText}>Cerrando sesión...</Text>
    </View>
  );
}

// ============================================
// TABS PARA USUARIOS AUTENTICADOS
// ============================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Equipos') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Tareas') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Duales') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Estadias') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Equipos" component={EquiposScreen} />
      <Tab.Screen name="Tareas" component={TareasScreen} />
      <Tab.Screen name="Duales" component={DualesScreen} />
      <Tab.Screen name="Estadias" component={EstadiasScreen} options={{ title: 'Estadías' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// ============================================
// STACK PRINCIPAL (con todas las pantallas)
// ============================================

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Analisis" component={AnalisisScreen} />
      <Stack.Screen name="CrearEstadia" component={CrearEstadiaScreen} />
      <Stack.Screen name="RegistrarHoras" component={RegistrarHorasScreen} />
      <Stack.Screen name="DetalleEstadia" component={DetalleEstadiaScreen} />
      <Stack.Screen name="CrearDual" component={CrearDualScreen} />
      <Stack.Screen name="CrearEquipo" component={CrearEquipoScreen} />
      <Stack.Screen name="CrearTarea" component={CrearTareaScreen} />
      <Stack.Screen name="EntregarTarea" component={EntregarTareaScreen} />
      <Stack.Screen name="CalificarTarea" component={CalificarTareaScreen} />
      <Stack.Screen name="DetalleTarea" component={DetalleTareaScreen} />
      <Stack.Screen name="Videollamada" component={VideollamadaScreen} />
      <Stack.Screen name="Firma" component={FirmaScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// NAVEGADOR PRINCIPAL
// ============================================

export default function AppNavigator() {
  const { isAuthenticated, isLoading, isLoggingOut } = useAuth();

  if (isLoading || isLoggingOut) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainStack} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
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
});