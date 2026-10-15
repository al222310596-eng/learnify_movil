// ============================================
// FirmaScreen.js - Firma por código de email
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { dualesAPI } from '../api/api';

export default function FirmaScreen({ route, navigation }) {
  const { dualId, asignacionIndex } = route.params || {};
  const { user } = useAuth();

  const [paso, setPaso] = useState(1); // 1 = solicitar, 2 = verificar
  const [isLoading, setIsLoading] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeEnviado, setMensajeEnviado] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ============================================
  // PASO 1: Solicitar código
  // ============================================
  const solicitarCodigo = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await dualesAPI.solicitarCodigoFirma(
        dualId,
        asignacionIndex,
        user?._id
      );

      if (result.exito) {
        setMensajeEnviado(result.mensaje || 'Código enviado a tu correo');
        setPaso(2);
      } else {
        setErrorMsg(result.mensaje || 'Error al enviar código');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // PASO 2: Verificar código + contraseña
  // ============================================
  const verificarYFirmar = async () => {
    setErrorMsg('');

    if (!codigo || codigo.length !== 6) {
      setErrorMsg('El código debe tener 6 dígitos');
      return;
    }
    if (!password) {
      setErrorMsg('Ingresa tu contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const result = await dualesAPI.verificarCodigoFirma(
        dualId,
        asignacionIndex,
        user?._id,
        codigo,
        password
      );

      if (result.exito) {
        Alert.alert(
          '✅ Firma registrada',
          'El dual ha sido firmado correctamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setErrorMsg(result.mensaje || 'Error al verificar el código');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // VOLVER AL PASO 1
  // ============================================
  const volverPaso1 = () => {
    setPaso(1);
    setCodigo('');
    setPassword('');
    setErrorMsg('');
    setMensajeEnviado('');
  };

  // Validación inicial
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Icon name="shield-checkmark-outline" size={20} color="#8b5cf6" /> Firmar Dual
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AVISO INICIAL */}
          <View style={styles.avisoInicial}>
            <Icon name="information-circle-outline" size={18} color="#4338ca" />
            <Text style={styles.avisoTexto}>
              Por seguridad, enviaremos un <Text style={{ fontWeight: '700' }}>código de 6 dígitos</Text> a tu
              correo electrónico. Deberás ingresarlo junto con tu contraseña para firmar.
            </Text>
          </View>

          {user && (
            <Text style={styles.userInfo}>
              👤 Firmando como: <Text style={{ fontWeight: '700' }}>{user.nombre}</Text>
            </Text>
          )}

          {/* ============================================ */}
          {/* PASO 1: SOLICITAR CÓDIGO                    */}
          {/* ============================================ */}
          {paso === 1 && (
            <View style={styles.card}>
              <View style={styles.pasoIndicator}>
                <View style={styles.pasoCirculoActivo}>
                  <Text style={styles.pasoTextoActivo}>1</Text>
                </View>
                <View style={styles.pasoLinea} />
                <View style={styles.pasoCirculoInactivo}>
                  <Text style={styles.pasoTextoInactivo}>2</Text>
                </View>
              </View>

              <Text style={styles.pasoTitle}>Solicitar código de firma</Text>
              <Text style={styles.pasoDescripcion}>
                Recibirás el código en el correo asociado a tu cuenta:
              </Text>
              <Text style={styles.correoTexto}>{user?.email || 'tu correo'}</Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Icon name="alert-circle-outline" size={16} color="#991b1b" />
                  <Text style={styles.errorBoxText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.botonPrincipal, isLoading && styles.botonDisabled]}
                onPress={solicitarCodigo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="paper-plane-outline" size={18} color="#fff" />
                    <Text style={styles.botonPrincipalTexto}>Enviar código a mi correo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================ */}
          {/* PASO 2: INGRESAR CÓDIGO Y CONTRASEÑA        */}
          {/* ============================================ */}
          {paso === 2 && (
            <View style={styles.card}>
              <View style={styles.pasoIndicator}>
                <View style={styles.pasoCirculoCompletado}>
                  <Icon name="checkmark" size={16} color="#fff" />
                </View>
                <View style={styles.pasoLineaActiva} />
                <View style={styles.pasoCirculoActivo}>
                  <Text style={styles.pasoTextoActivo}>2</Text>
                </View>
              </View>

              {/* Mensaje de éxito */}
              <View style={styles.exitoBox}>
                <Icon name="checkmark-circle" size={18} color="#166534" />
                <Text style={styles.exitoBoxText}>{mensajeEnviado}</Text>
              </View>

              {/* Input código */}
              <Text style={styles.inputLabel}>
                <Icon name="key-outline" size={14} color="#475569" /> Código de 6 dígitos
              </Text>
              <TextInput
                style={styles.inputCodigo}
                value={codigo}
                onChangeText={(t) => setCodigo(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              {/* Input contraseña */}
              <Text style={styles.inputLabel}>
                <Icon name="lock-closed-outline" size={14} color="#475569" /> Tu contraseña
              </Text>
              <TextInput
                style={styles.inputPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Icon name="alert-circle-outline" size={16} color="#991b1b" />
                  <Text style={styles.errorBoxText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.botonesRow}>
                <TouchableOpacity
                  style={[styles.botonFirmar, isLoading && styles.botonDisabled]}
                  onPress={verificarYFirmar}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.botonFirmarTexto}>Firmar ahora</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={volverPaso1}
                  disabled={isLoading}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.notaExpiracion}>
                <Icon name="time-outline" size={12} color="#94a3b8" /> El código expira en 10 minutos
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================
// ESTILOS
// ============================================
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avisoInicial: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 18,
  },
  userInfo: {
    fontSize: 13,
    color: '#8b5cf6',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Indicador de pasos
  pasoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pasoCirculoActivo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoCirculoInactivo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoCirculoCompletado: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoTextoActivo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  pasoTextoInactivo: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  pasoLinea: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  pasoLineaActiva: {
    width: 40,
    height: 2,
    backgroundColor: '#10b981',
    marginHorizontal: 6,
  },

  // Textos de paso
  pasoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  pasoDescripcion: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  correoTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
  },

  // Botón principal (paso 1)
  botonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  botonPrincipalTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Inputs (paso 2)
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputCodigo: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 10,
    color: '#1e293b',
    marginBottom: 18,
  },
  inputPassword: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 18,
  },

  // Cajas de mensaje
  exitoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
    gap: 8,
  },
  exitoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
  },

  // Botones paso 2
  botonesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  botonFirmar: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  botonFirmarTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  botonCancelar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
  },
  botonCancelarTexto: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  botonDisabled: {
    opacity: 0.6,
  },

  notaExpiracion: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 16,
  },

  // Error general
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