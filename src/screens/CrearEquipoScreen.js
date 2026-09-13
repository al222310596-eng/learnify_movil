// ============================================
// CrearEquipoScreen - Crear nuevo equipo
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { equiposAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CrearEquipoScreen({ navigation }) {
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del equipo es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const result = await equiposAPI.crearEquipo(nombre, descripcion, user._id);
      if (result.exito) {
        Alert.alert('Éxito', 'Equipo creado correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al crear equipo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Icon name="people-outline" size={22} color="#667eea" /> Crear Equipo
        </Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Nombre del equipo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Equipo de Desarrollo"
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción del equipo..."
            placeholderTextColor="#94a3b8"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
          />

          <View style={styles.infoBox}>
            <Icon name="information-circle-outline" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Serás el líder de este equipo. Podrás invitar a otros miembros.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCrear}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Crear Equipo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 15,
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
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 10,
    flex: 1,
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});