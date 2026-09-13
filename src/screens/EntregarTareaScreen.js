// ============================================
// EntregarTareaScreen - Entregar tarea
// ============================================

import React, { useState, useEffect } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function EntregarTareaScreen({ route, navigation }) {
  const { user } = useAuth();
  const { tareaId, equipoId } = route.params || {};
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [infoTarea, setInfoTarea] = useState(null);

  useEffect(() => {
    if (!tareaId) {
      Alert.alert('Error', 'No se especificó la tarea');
      navigation.goBack();
      return;
    }
    cargarInfoTarea();
  }, [tareaId]);

  const cargarInfoTarea = async () => {
    try {
      const result = await tareasAPI.getDetalleTarea(tareaId);
      if (result.exito) {
        setInfoTarea(result.tarea);
      }
    } catch (error) {
      console.error('Error al cargar tarea:', error);
    }
  };

  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setArchivo({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      });
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleEntregar = async () => {
    setLoading(true);
    try {
      const result = await tareasAPI.entregarTarea(
        tareaId,
        user._id,
        comentario,
        archivo
      );

      if (result.exito) {
        Alert.alert('Éxito', 'Tarea entregada correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.mensaje || 'Error al entregar tarea');
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
          <Icon name="cloud-upload-outline" size={22} color="#667eea" /> Entregar Tarea
        </Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {infoTarea && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitulo}>{infoTarea.titulo}</Text>
              <Text style={styles.infoEquipo}>
                <Icon name="people-outline" size={14} color="#94a3b8" /> {infoTarea.equipo_nombre}
              </Text>
              {infoTarea.fecha_limite && (
                <Text style={styles.infoFecha}>
                  <Icon name="calendar-outline" size={14} color="#f59e0b" /> 
                  Límite: {new Date(infoTarea.fecha_limite).toLocaleDateString('es-MX')}
                </Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Agrega un comentario a tu entrega..."
            placeholderTextColor="#94a3b8"
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Archivo adjunto</Text>
          <TouchableOpacity style={styles.fileButton} onPress={seleccionarArchivo}>
            <Icon name="document-attach-outline" size={24} color="#667eea" />
            <Text style={styles.fileButtonText}>
              {archivo ? archivo.name : 'Seleccionar archivo'}
            </Text>
          </TouchableOpacity>
          {archivo && (
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => setArchivo(null)}
            >
              <Icon name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.removeFileText}>Quitar archivo</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.fileHelp}>
            Formatos permitidos: PDF, Imagen, Word
          </Text>

          <TouchableOpacity
            style={styles.entregarButton}
            onPress={handleEntregar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.entregarButtonText}>
                <Icon name="send-outline" size={18} color="#fff" /> Entregar Tarea
              </Text>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoEquipo: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  infoFecha: {
    fontSize: 14,
    color: '#f59e0b',
    marginTop: 4,
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
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  fileButtonText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 10,
    flex: 1,
  },
  removeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  removeFileText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 4,
  },
  fileHelp: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
  },
  entregarButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  entregarButtonText: {
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