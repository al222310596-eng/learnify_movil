// ============================================
// EditarPerfilModal - Modal para editar perfil
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { usuariosAPI, BASE_URL } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

export default function EditarPerfilModal({ visible, onClose }) {
  const { user, setUser } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [foto, setFoto] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar datos actuales al abrir el modal
  useEffect(() => {
    if (visible && user) {
      setNombre(user.nombre || '');
      setEmail(user.email || '');
      setPassword('');
      setConfirmPassword('');
      setFoto(
        user.foto_url
          ? {
              uri: user.foto_url.startsWith('http')
                ? user.foto_url
                : `${BASE_URL.replace('/api', '')}${user.foto_url}`,
            }
          : null
      );
    }
  }, [visible, user]);

  // Seleccionar foto desde galería
  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFoto(resultado.assets[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar foto:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con la cámara
  const tomarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar la foto');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFoto(resultado.assets[0]);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Mostrar opciones de foto
  const mostrarOpcionesFoto = () => {
    Alert.alert(
      'Cambiar foto',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: tomarFoto },
        { text: 'Galería', onPress: seleccionarFoto },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Guardar cambios
  const guardarCambios = async () => {
    // Validaciones
    if (!nombre.trim() || !email.trim()) {
      Alert.alert('Campos requeridos', 'El nombre y el correo son obligatorios');
      return;
    }

    if (password && password.length < 6) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales');
      return;
    }

    setCargando(true);

    try {
      // 1. Actualizar datos básicos
      const datosActualizar = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
      };
      if (password) datosActualizar.password = password;

      const respuesta = await usuariosAPI.actualizar(user._id, datosActualizar);

      if (!respuesta.exito) {
        Alert.alert('Error', respuesta.mensaje || 'No se pudo actualizar el perfil');
        setCargando(false);
        return;
      }

      let usuarioActualizado = respuesta.usuario;

      // 2. Si hay foto nueva (asset local), subirla
      if (foto && foto.uri && !foto.uri.startsWith('http')) {
        const respFoto = await usuariosAPI.subirFoto(user._id, foto);
        if (respFoto.exito) {
          usuarioActualizado = { ...usuarioActualizado, foto_url: respFoto.foto_url };
        } else {
          Alert.alert('Aviso', 'Los datos se guardaron, pero la foto no se pudo subir');
        }
      }

      // 3. Actualizar el contexto global (usa setUser de tu AuthContext)
      await setUser(usuarioActualizado);

      // 4. Persistir en storage para que sobreviva al reinicio
      // (si tu AuthContext guarda automáticamente, este paso se puede omitir)
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync('usuario', JSON.stringify(usuarioActualizado));
      } catch (e) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        } catch (e2) {
          console.log('No se pudo persistir el usuario actualizado');
        }
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los cambios');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <Icon name="person-circle-outline" size={22} color="#667eea" />
              <Text style={styles.headerTexto}>Editar Perfil</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnCerrar}>
              <Icon name="close-outline" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Foto de perfil */}
            <View style={styles.fotoContainer}>
              <TouchableOpacity onPress={mostrarOpcionesFoto}>
                {foto ? (
                  <Image source={{ uri: foto.uri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Icon name="person-outline" size={40} color="#94a3b8" />
                  </View>
                )}
                <View style={styles.camaraBadge}>
                  <Icon name="camera-outline" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.fotoHint}>Toca para cambiar la foto</Text>
            </View>

            {/* Nombre */}
            <View style={styles.formGrupo}>
              <Text style={styles.label}>
                <Icon name="person-outline" size={14} color="#64748b" /> Nombre completo
              </Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email */}
            <View style={styles.formGrupo}>
              <Text style={styles.label}>
                <Icon name="mail-outline" size={14} color="#64748b" /> Correo electrónico
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Nueva contraseña */}
            <View style={styles.formGrupo}>
              <Text style={styles.label}>
                <Icon name="lock-closed-outline" size={14} color="#64748b" /> Nueva contraseña
              </Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Dejar en blanco para no cambiar"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <Text style={styles.helpText}>Mínimo 6 caracteres</Text>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.formGrupo}>
              <Text style={styles.label}>
                <Icon name="checkmark-circle-outline" size={14} color="#64748b" /> Confirmar contraseña
              </Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecundario]}
              onPress={onClose}
              disabled={cargando}
            >
              <Icon name="close-outline" size={18} color="#64748b" />
              <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimario, cargando && styles.btnDeshabilitado]}
              onPress={guardarCambios}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="save-outline" size={18} color="#fff" />
                  <Text style={styles.btnPrimarioTexto}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTexto: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  btnCerrar: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  camaraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  fotoHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  formGrupo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  helpText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnSecundario: {
    backgroundColor: '#f1f5f9',
  },
  btnSecundarioTexto: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimario: {
    backgroundColor: '#667eea',
  },
  btnPrimarioTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDeshabilitado: {
    opacity: 0.6,
  },
});