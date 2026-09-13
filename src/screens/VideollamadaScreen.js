// ============================================
// VideollamadaScreen - Versión para Expo (CORREGIDA)
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { jitsiAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

export default function VideollamadaScreen({ navigation }) {
  const { user } = useAuth();
  const [salaActiva, setSalaActiva] = useState(null);
  const [linkSala, setLinkSala] = useState('');
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);
  const [modo, setModo] = useState('maestro');
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  useEffect(() => {
    if (user?.rol === 'maestro') {
      setModo('maestro');
    } else {
      setModo('alumno');
    }
    cargarSalaActiva();
  }, []);

  const cargarSalaActiva = async () => {
    try {
      const salas = await jitsiAPI.getSalas(user._id);
      if (salas.exito && salas.salas && salas.salas.length > 0) {
        const sala = salas.salas[0];
        setSalaActiva(sala);
        setLinkSala(sala.sala_url);
      }
    } catch (error) {
      console.error('Error al cargar sala activa:', error);
    }
  };

  // ✅ Función para copiar al portapapeles (USANDO EXPO-CLIPBOARD)
  const copiarAlPortapapeles = async (texto) => {
    try {
      await Clipboard.setStringAsync(texto);
      Alert.alert('✅ Copiado', 'Link copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
      Alert.alert('📋 Link de la sala', texto, [{ text: 'OK' }]);
    }
  };

  // ✅ Función para compartir link (USANDO EXPO-SHARING + FALLBACK)
  const compartirLink = async () => {
    if (!linkSala) {
      Alert.alert('Error', 'No hay un link para compartir');
      return;
    }

    // 1. Intentar con el sistema nativo de compartir (iOS/Android)
    const shareAvailable = await Sharing.isAvailableAsync();
    if (shareAvailable) {
      try {
        await Sharing.shareAsync(linkSala, {
          dialogTitle: 'Compartir videollamada',
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
        });
        return;
      } catch (error) {
        console.log('Share falló, usando copia:', error);
      }
    }

    // 2. Fallback: copiar al portapapeles
    await copiarAlPortapapeles(linkSala);
  };

  // Función para unirse a la videollamada
  const unirseVideollamada = async (salaUrl, nombreUsuario) => {
    if (!salaUrl) {
      Alert.alert('Error', 'No hay una sala activa');
      return;
    }

    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        window.open(salaUrl, '_blank');
        setLoading(false);
        return;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const result = await WebBrowser.openBrowserAsync(salaUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: '#667eea',
            toolbarColor: '#fff',
          });
          console.log('WebBrowser result:', result);
          setLoading(false);
          return;
        } catch (browserError) {
          console.log('WebBrowser falló, usando WebView:', browserError);
        }

        setWebViewUrl(salaUrl);
        setShowWebView(true);
        setLoading(false);
        return;
      }

      const Linking = require('react-native').Linking;
      Linking.openURL(salaUrl);
      setLoading(false);

    } catch (error) {
      console.error('❌ Error al unirse a Jitsi:', error);
      Alert.alert('Error', 'No se pudo conectar a la videollamada: ' + error.message);
      setLoading(false);
    }
  };

  // Función para crear sala (solo maestro)
  const crearSala = async () => {
    if (modo !== 'maestro') {
      Alert.alert('Error', 'Solo los maestros pueden crear salas');
      return;
    }

    try {
      setCreando(true);
      
      const resultado = await jitsiAPI.crearSala(user._id, user.nombre);
      
      if (resultado.exito) {
        setSalaActiva({
          sala_id: resultado.sala_id,
          sala_url: resultado.sala_url,
          sala_name: resultado.sala_name,
        });
        setLinkSala(resultado.sala_url);
        
        Alert.alert(
          '✅ Sala creada',
          `Sala: ${resultado.sala_name}`,
          [
            {
              text: 'Unirme',
              onPress: () => unirseVideollamada(resultado.sala_url, user.nombre)
            },
            { text: 'Compartir link', onPress: compartirLink }
          ]
        );
      } else {
        Alert.alert('Error', resultado.mensaje || 'No se pudo crear la sala');
      }
    } catch (error) {
      console.error('Error al crear sala:', error);
      Alert.alert('Error', 'No se pudo crear la sala');
    } finally {
      setCreando(false);
    }
  };

  // Limpiar sala
  const limpiarSala = async () => {
    if (salaActiva?.sala_id) {
      await jitsiAPI.eliminarSala(salaActiva.sala_id);
    }
    setSalaActiva(null);
    setLinkSala('');
    setShowWebView(false);
    setWebViewUrl('');
  };

  // Cerrar WebView
  const cerrarWebView = () => {
    setShowWebView(false);
    setWebViewUrl('');
  };

  // Renderizar WebView para iOS/Android
  const renderWebViewModal = () => {
    if (!showWebView || !webViewUrl) return null;

    return (
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={cerrarWebView}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={cerrarWebView} style={styles.webViewClose}>
              <Icon name="close" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Videollamada Jitsi</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView
            source={{ uri: webViewUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            originWhitelist={['*']}
            onError={(error) => {
              console.error('WebView error:', error);
              Alert.alert('Error', 'Error al cargar la videollamada');
              cerrarWebView();
            }}
            onLoadEnd={() => {
              console.log('WebView cargado');
              setLoading(false);
            }}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {modo === 'maestro' ? '📹 Videollamada' : '📹 Unirse a videollamada'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* ... el resto del contenido permanece igual ... */}
        
        {/* Información del usuario */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>👤 Usuario</Text>
          <Text style={styles.infoValue}>{user?.nombre}</Text>
          <Text style={styles.infoLabel}>🎓 Rol</Text>
          <Text style={styles.infoValue}>
            {user?.rol === 'maestro' ? 'Maestro' : 'Alumno'}
          </Text>
          <Text style={styles.infoLabel}>📱 Dispositivo</Text>
          <Text style={styles.infoValue}>
            {Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Web'}
          </Text>
        </View>

        {/* Estado de la sala */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>📊 Estado</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot}>
              <View style={[styles.dot, salaActiva ? styles.dotGreen : styles.dotRed]} />
            </View>
            <Text style={styles.statusText}>
              {salaActiva ? 'Sala activa' : 'Sin sala activa'}
            </Text>
          </View>
          {salaActiva && (
            <View style={styles.salaInfo}>
              <Text style={styles.salaName}>
                🏷️ {salaActiva.sala_name}
              </Text>
              <Text style={styles.salaLink} numberOfLines={1}>
                🔗 {linkSala}
              </Text>
            </View>
          )}
        </View>

        {/* Botones según rol */}
        {modo === 'maestro' ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, creando && styles.buttonDisabled]}
              onPress={crearSala}
              disabled={creando}
            >
              {creando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="videocam" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Crear sala</Text>
                </>
              )}
            </TouchableOpacity>

            {salaActiva && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSuccess]}
                  onPress={() => unirseVideollamada(linkSala, user.nombre)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="enter" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Unirme</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonShare]}
                  onPress={compartirLink}
                >
                  <Icon name="share-social" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Compartir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={() => {
                    Alert.alert(
                      'Cerrar sala',
                      '¿Estás seguro de que quieres cerrar la sala?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Cerrar', style: 'destructive', onPress: limpiarSala }
                      ]
                    );
                  }}
                >
                  <Icon name="close-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Cerrar sala</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Link de la sala</Text>
              <TextInput
                style={styles.input}
                placeholder="Pega el link que te dio tu maestro"
                value={linkSala}
                onChangeText={setLinkSala}
                multiline={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonSuccess, !linkSala && styles.buttonDisabled]}
              onPress={() => unirseVideollamada(linkSala, user.nombre)}
              disabled={!linkSala || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="enter" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Unirse a la videollamada</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={cargarSalaActiva}
            >
              <Icon name="search" size={20} color="#667eea" />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Buscar sala activa
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instrucciones */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>💡 Instrucciones</Text>
          {modo === 'maestro' ? (
            <>
              <Text style={styles.instructionsText}>
                1. Presiona "Crear sala" para generar una nueva sala
              </Text>
              <Text style={styles.instructionsText}>
                2. Comparte el link con tus alumnos
              </Text>
              <Text style={styles.instructionsText}>
                3. Presiona "Unirme" para entrar a la videollamada
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.instructionsText}>
                1. Pide el link de la sala a tu maestro
              </Text>
              <Text style={styles.instructionsText}>
                2. Pega el link en el campo de arriba
              </Text>
              <Text style={styles.instructionsText}>
                3. Presiona "Unirse a la videollamada"
              </Text>
            </>
          )}
          <Text style={[styles.instructionsText, { color: '#10b981', marginTop: 8 }]}>
            ✅ Jitsi Meet es gratuito y no requiere registro
          </Text>
          <Text style={[styles.instructionsText, { color: '#64748b', fontSize: 11, marginTop: 4 }]}>
            📱 En iPhone se abrirá en el navegador o en WebView
          </Text>
        </View>
      </ScrollView>

      {/* Modal WebView para iOS/Android */}
      {renderWebViewModal()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#1e293b',
  },
  salaInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  salaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  salaLink: {
    fontSize: 12,
    color: '#64748b',
  },
  buttonContainer: {
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonShare: {
    backgroundColor: '#3b82f6',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#667eea',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 20,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  webViewClose: {
    padding: 4,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
});