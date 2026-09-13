// ============================================
// ChatScreen - Chat del equipo
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const { equipoId, equipoNombre } = route.params || {};
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!equipoId) {
      Alert.alert('Error', 'No se especificó el equipo');
      navigation.goBack();
      return;
    }
    cargarMensajes();
    const interval = setInterval(cargarMensajes, 5000);
    return () => clearInterval(interval);
  }, [equipoId]);

  const cargarMensajes = async () => {
    try {
      const result = await chatAPI.getMensajes(equipoId);
      if (result.exito) {
        setMensajes(result.mensajes || []);
        scrollToEnd();
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviando(true);
    try {
      const result = await chatAPI.enviarMensaje(equipoId, user._id, nuevoMensaje.trim());
      if (result.exito) {
        setNuevoMensaje('');
        await cargarMensajes();
      } else {
        Alert.alert('Error', result.mensaje || 'No se pudo enviar el mensaje');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  const renderMensaje = ({ item }) => {
    const esPropio = item.usuario_id === user._id;
    const fecha = new Date(item.fecha_envio);
    const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.mensajeContainer, esPropio ? styles.propio : styles.otro]}>
        <View style={[styles.mensajeBubble, esPropio ? styles.bubblePropio : styles.bubbleOtro]}>
          {!esPropio && (
            <Text style={styles.mensajeAutor}>
              <Icon name="person-circle-outline" size={14} color="#94a3b8" /> {item.usuario_nombre}
            </Text>
          )}
          <Text style={[styles.mensajeText, esPropio ? styles.textPropio : styles.textOtro]}>
            {item.mensaje}
          </Text>
          <Text style={styles.mensajeHora}>{hora}</Text>
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
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            <Icon name="chatbubbles-outline" size={18} color="#667eea" /> {equipoNombre || 'Chat del equipo'}
          </Text>
          <Text style={styles.headerSubtitle}>{mensajes.length} mensajes</Text>
        </View>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={(item) => item._id || item.fecha_envio}
        contentContainerStyle={styles.mensajesList}
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={50} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay mensajes</Text>
            <Text style={styles.emptySubtext}>¡Escribe el primero!</Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#94a3b8"
            value={nuevoMensaje}
            onChangeText={setNuevoMensaje}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !nuevoMensaje.trim() && styles.sendButtonDisabled]}
            onPress={enviarMensaje}
            disabled={!nuevoMensaje.trim() || enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="send-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  mensajesList: {
    padding: 15,
    flexGrow: 1,
  },
  mensajeContainer: {
    marginBottom: 10,
  },
  propio: {
    alignItems: 'flex-end',
  },
  otro: {
    alignItems: 'flex-start',
  },
  mensajeBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  bubblePropio: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  bubbleOtro: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mensajeAutor: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  mensajeText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textPropio: {
    color: '#fff',
  },
  textOtro: {
    color: '#1e293b',
  },
  mensajeHora: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});