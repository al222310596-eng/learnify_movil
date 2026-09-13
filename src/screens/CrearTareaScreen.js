// ============================================
// CrearTareaScreen - Crear nueva tarea (CON DateTimePicker)
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
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { tareasAPI } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CrearTareaScreen({ route, navigation }) {
  const { user } = useAuth();
  const { equipoId, equipoNombre } = route.params || {};
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título de la tarea es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const fechaFormateada = fechaLimite ? fechaLimite.toISOString().split('T')[0] : null;
      const result = await tareasAPI.crearTarea(
        titulo,
        descripcion,
        equipoId,
        user._id,
        fechaFormateada
      );

      if (result.exito) {
        Alert.alert('Éxito', 'Tarea creada correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al crear tarea');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFechaLimite(selectedDate);
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
          <Icon name="add-outline" size={22} color="#667eea" /> Crear Tarea
        </Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {equipoNombre && (
            <View style={styles.equipoInfo}>
              <Icon name="people-outline" size={18} color="#94a3b8" />
              <Text style={styles.equipoInfoText}>Equipo: {equipoNombre}</Text>
            </View>
          )}

          <Text style={styles.label}>Título de la tarea *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Reporte semanal"
            placeholderTextColor="#94a3b8"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción de la tarea..."
            placeholderTextColor="#94a3b8"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Fecha límite</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-outline" size={20} color="#667eea" />
            <Text style={styles.dateButtonText}>
              {fechaLimite ? fechaLimite.toLocaleDateString('es-MX') : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={fechaLimite || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCrear}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Crear Tarea</Text>
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
  equipoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  equipoInfoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 10,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 10,
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