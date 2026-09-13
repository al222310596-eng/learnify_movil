// ============================================
// RegisterScreen - Pantalla de registro
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { authAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('alumno');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.registrar(nombre, email, password, rol);
      
      if (result.exito) {
        Alert.alert(
          '¡Registro exitoso!',
          'Tu cuenta ha sido creada. Inicia sesión para continuar.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', result.mensaje || 'Error al registrarse');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Icon name="person-add-outline" size={50} color="#667eea" />
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete a Learnify</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Icon name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#999"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.rolContainer}>
                <Text style={styles.rolLabel}>Rol:</Text>
                <View style={styles.rolOptions}>
                  <TouchableOpacity
                    style={[styles.rolOption, rol === 'alumno' && styles.rolOptionActive]}
                    onPress={() => setRol('alumno')}
                  >
                    <Text style={[styles.rolText, rol === 'alumno' && styles.rolTextActive]}>
                      🎓 Alumno
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rolOption, rol === 'maestro' && styles.rolOptionActive]}
                    onPress={() => setRol('maestro')}
                  >
                    <Text style={[styles.rolText, rol === 'maestro' && styles.rolTextActive]}>
                      👨‍🏫 Maestro
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Registrarse</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}
              >
                <Text style={styles.loginText}>
                  ¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 5,
  },
  rolContainer: {
    marginBottom: 20,
  },
  rolLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  rolOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  rolOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 10,
  },
  rolOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#f0f0ff',
  },
  rolText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  rolTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  loginBold: {
    color: '#667eea',
    fontWeight: '600',
  },
});