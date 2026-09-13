// ============================================
// AuthContext - Manejo de estado de autenticación
// CON FALLBACK PARA EXPO GO Y LOGOUT MEJORADO
// ============================================

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// ============================================
// ALMACENAMIENTO SIMPLE (FALLBACK)
// ============================================

// Usar el almacenamiento que esté disponible
let storage = null;

// Intentar cargar SecureStore primero
try {
  const SecureStore = require('expo-secure-store');
  if (SecureStore) {
    storage = {
      getItem: async (key) => await SecureStore.getItemAsync(key),
      setItem: async (key, value) => await SecureStore.setItemAsync(key, value),
      removeItem: async (key) => await SecureStore.deleteItemAsync(key),
    };
    console.log('✅ Usando SecureStore');
  }
} catch (e) {
  // Si no funciona, intentar con AsyncStorage
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage) {
      storage = {
        getItem: async (key) => await AsyncStorage.getItem(key),
        setItem: async (key, value) => await AsyncStorage.setItem(key, value),
        removeItem: async (key) => await AsyncStorage.removeItem(key),
      };
      console.log('✅ Usando AsyncStorage');
    }
  } catch (e2) {
    console.log('⚠️ No hay almacenamiento disponible, usando memory fallback');
    // Fallback en memoria (se pierde al cerrar la app)
    let memoryStorage = {};
    storage = {
      getItem: async (key) => memoryStorage[key] || null,
      setItem: async (key, value) => { memoryStorage[key] = value; },
      removeItem: async (key) => { delete memoryStorage[key]; },
    };
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await storage.getItem('usuario');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      await storage.setItem('usuario', JSON.stringify(userData));
      setUser(userData);
      setIsLoading(false);
      return { exito: true };
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      return { exito: false, mensaje: 'Error al guardar sesión' };
    }
  };

  const logout = async () => {
    try {
      // ✅ Marcar que estamos en proceso de logout
      setIsLoggingOut(true);
      
      // Limpiar almacenamiento
      await storage.removeItem('usuario');
      
      // Limpiar cualquier otro dato relacionado
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('usuario');
      } catch (e) {}
      
      // ✅ Resetear estado
      setUser(null);
      setIsLoading(false);
      
      // ✅ Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 150);
      
      console.log('✅ Sesión cerrada correctamente');
      return { exito: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
      return { exito: false, mensaje: 'Error al cerrar sesión' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isLoggingOut,
        login,
        logout,
        isAuthenticated: !!user && !isLoggingOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};