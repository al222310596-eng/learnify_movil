// ============================================
// FirmaScreen.js - Pantalla para firmar duales
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../api/api';

const { width } = Dimensions.get('window');

export default function FirmaScreen({ route, navigation }) {
  const { dualId, asignacionIndex } = route.params || {};
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const signatureRef = useRef(null);

  const handleOK = (signature) => {
    console.log('✅ Firma capturada, tamaño:', signature?.length || 0);
    if (signature && signature.length > 100) {
      guardarFirma(signature);
    } else {
      Alert.alert('Error', 'La firma parece estar vacía o incompleta');
    }
  };

  const handleEmpty = () => {
    console.log('⚠️ Firma vacía');
    Alert.alert('Error', 'Por favor, firma en el recuadro');
  };

  const guardarFirma = async (firmaBase64) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📤 Enviando firma...');
      console.log('  - dualId:', dualId);
      console.log('  - asignacionIndex:', asignacionIndex);
      console.log('  - usuarioId:', user?._id);
      
      // ✅ Reducir la firma si es muy grande (comprimir)
      let firmaEnviar = firmaBase64;
      if (firmaEnviar && firmaEnviar.length > 500000) {
        console.log('⚠️ Firma grande, comprimiendo...');
        // Si es muy grande, solo enviar una versión reducida
        // (la firma ya viene en base64, no podemos comprimirla más fácilmente)
        // En su lugar, recortar si es necesario
        firmaEnviar = firmaEnviar.substring(0, 400000);
      }
      
      const url = `${BASE_URL}/duales/firmar`;
      console.log('  - URL:', url);
      
      // Timeout de 60 segundos para firma
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dual_id: dualId,
          asignacion_index: asignacionIndex,
          usuario_id: user?._id,
          firma: firmaEnviar
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📥 Respuesta:', response.status);
      
      const result = await response.json();
      console.log('📦 Datos:', result);

      if (result.exito) {
        Alert.alert(
          '✅ Éxito',
          'Firma registrada correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.mensaje || 'Error al registrar la firma');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      
      let mensaje = 'Error de conexión. Verifica que el servidor esté corriendo.';
      if (error.name === 'AbortError') {
        mensaje = 'El servidor tardó demasiado en responder. Intenta de nuevo.';
      } else if (error.message) {
        mensaje = error.message;
      }
      
      Alert.alert('Error', mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  const limpiarFirma = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  if (!dualId || asignacionIndex === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.errorTitle}>Datos incompletos</Text>
          <Text style={styles.errorText}>No se pudo identificar el dual a firmar</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>
          <Icon name="create-outline" size={20} color="#8b5cf6" /> Firmar Dual
        </Text>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          <Icon name="information-circle-outline" size={16} color="#8b5cf6" /> Firma en el recuadro para confirmar
        </Text>
        {user && (
          <Text style={styles.userInfo}>👤 Firmando como: {user.nombre}</Text>
        )}
        {error && (
          <Text style={styles.errorInfo}>⚠️ {error}</Text>
        )}
      </View>

      <View style={styles.signatureContainer}>
        <Signature
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={handleEmpty}
          descriptionText="Firma aquí"
          clearText="Limpiar"
          confirmText="Aceptar"
          webStyle={`
            .m-signature-pad {
              box-shadow: none;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              height: 220px;
            }
            .m-signature-pad--body {
              border: none;
            }
            .m-signature-pad--body canvas {
              border-radius: 10px;
            }
            .m-signature-pad--footer {
              display: none;
            }
          `}
          autoClear={false}
          imageType="image/png"
          // ✅ Reducir la calidad de la firma
          imageQuality={0.5}
        />
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={limpiarFirma}
          disabled={isLoading}
        >
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={() => {
            if (signatureRef.current) {
              signatureRef.current.readSignature();
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Firmar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  instructions: {
    fontSize: 14,
    color: '#64748b',
  },
  userInfo: {
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 4,
  },
  errorInfo: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 4,
  },
  signatureContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f1f5f9',
  },
  clearButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});