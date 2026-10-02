// ============================================
// DetalleEstadiaScreen - Detalle + Imprimir formato
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { estadiasAPI } from '../api/api';

export default function DetalleEstadiaScreen({ route, navigation }) {
  const { id } = route.params;
  const [estadia, setEstadia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const result = await estadiasAPI.getDetalleEstadia(id);
      if (result.exito && result.estadia) {
        setEstadia(result.estadia);
      } else {
        Alert.alert('Error', 'No se encontró la estadía');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error de conexión');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const etiquetaEstado = (estado) => {
    const mapa = {
      'pendiente':  { texto: 'Pendiente',  icono: 'time-outline',               color: '#d97706', bg: '#fef3c7' },
      'en-curso':   { texto: 'En curso',   icono: 'play-circle-outline',        color: '#059669', bg: '#d1fae5' },
      'completada': { texto: 'Completada', icono: 'checkmark-circle-outline',   color: '#475569', bg: '#e2e8f0' },
      'cancelada':  { texto: 'Cancelada',  icono: 'close-circle-outline',       color: '#dc2626', bg: '#fee2e2' },
    };
    return mapa[estado] || { texto: estado || 'Sin estado', icono: 'help-circle-outline', color: '#64748b', bg: '#f1f5f9' };
  };

  // ============================================
  // GENERAR Y COMPARTIR PDF
  // ============================================
  const imprimirFormato = async () => {
    try {
      setGenerandoPDF(true);
      setModalVisible(false);

      const html = await estadiasAPI.getFormatoHTML(estadia._id);
      if (!html || typeof html !== 'string') {
        throw new Error('No se pudo obtener el formato');
      }

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!base64) throw new Error('No se pudo generar el PDF');

      const destino = `${FileSystem.documentDirectory}Formato_Estadia_${estadia._id}.pdf`;
      await FileSystem.writeAsStringAsync(destino, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destino, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir formato de estadía',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF generado', `Guardado en: ${destino}`);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setGenerandoPDF(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!estadia) return null;

  const estadoInfo = etiquetaEstado(estadia.estado);

  const equipoMiembros = estadia.equipo && estadia.equipo.trim()
    ? estadia.equipo.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER con botón imprimir */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Estadía</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.printButton}
          disabled={generandoPDF}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <Icon name="print-outline" size={24} color="#0ea5e9" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="business" size={36} color="#fff" />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.proyecto}>{estadia.proyecto || 'Proyecto sin nombre'}</Text>
            <View style={styles.fila}>
              <Icon name="business-outline" size={16} color="#667eea" />
              <Text style={styles.empresa}>{estadia.empresa || 'Empresa no especificada'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
              <Icon name={estadoInfo.icono} size={14} color={estadoInfo.color} />
              <Text style={[styles.badgeText, { color: estadoInfo.color }]}>{estadoInfo.texto}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN: Datos del Alumno */}
        <Seccion titulo="Datos del Alumno" icono="person-outline">
          <Item label="Nombre completo" valor={`${estadia.nombre || ''} ${estadia.apellidos || ''}`.trim()} icono="person-outline" />
          <Item label="Carrera" valor={estadia.carrera} icono="school-outline" />
          <Item label="Grupo" valor={estadia.grupo} icono="people-outline" />
        </Seccion>

        {/* SECCIÓN: Empresa y Asesores */}
        <Seccion titulo="Empresa y Asesores" icono="briefcase-outline">
          <Item label="Empresa" valor={estadia.empresa} icono="business-outline" />
          <Item label="Lugar" valor={estadia.ubicacion} icono="location-outline" />
          <Item label="Asesor Académico" valor={estadia.asesor_academico} icono="school-outline" />
          <Item label="Asesor Externo" valor={estadia.asesor_externo} icono="person-outline" />
        </Seccion>

        {/* SECCIÓN: Proyecto */}
        <Seccion titulo="Proyecto" icono="bulb-outline">
          <Item label="Nombre" valor={estadia.proyecto} icono="bulb-outline" />
          <View style={styles.item}>
            <Text style={styles.itemLabel}>EQUIPO DE TRABAJO</Text>
            {equipoMiembros.length > 0 ? (
              <View style={styles.chipsEquipo}>
                {equipoMiembros.map((m, i) => (
                  <View key={i} style={styles.chipEquipo}>
                    <Icon name="person" size={12} color="#667eea" />
                    <Text style={styles.chipEquipoText}>{m}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.itemValor}>Proyecto individual</Text>
            )}
          </View>
          {estadia.descripcion ? (
            <View style={styles.item}>
              <Text style={styles.itemLabel}>DESCRIPCIÓN</Text>
              <View style={styles.descripcionBox}>
                <Text style={styles.descripcionText}>{estadia.descripcion}</Text>
              </View>
            </View>
          ) : null}
        </Seccion>

        {/* SECCIÓN: Periodo y Fechas (SIN barra de progreso) */}
        <Seccion titulo="Periodo y Fechas" icono="calendar-outline">
          <Item label="Periodo" valor={estadia.periodo} icono="calendar-outline" />
          <Item label="Fecha de inicio" valor={formatearFecha(estadia.fecha_inicio)} icono="calendar-outline" />
          <Item label="Fecha de término" valor={formatearFecha(estadia.fecha_fin)} icono="calendar-outline" />
          {/* ✅ Eliminado: "Horas totales" con barra de progreso (está en RegistrarHoras) */}
        </Seccion>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL de opciones */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="document-text-outline" size={28} color="#0ea5e9" />
              <Text style={styles.modalTitle}>Formato de Estadía</Text>
              <Text style={styles.modalSubtitle}>¿Qué quieres hacer?</Text>
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={imprimirFormato}>
              <Icon name="download-outline" size={22} color="#0ea5e9" />
              <Text style={styles.modalBtnText}>Generar y compartir PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close-outline" size={22} color="#64748b" />
              <Text style={[styles.modalBtnText, { color: '#64748b' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// Componentes auxiliares
// ============================================
function Seccion({ titulo, icono, children }) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionHeader}>
        <Icon name={icono} size={16} color="#667eea" />
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function Item({ label, valor, icono }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label.toUpperCase()}</Text>
      <View style={styles.fila}>
        <Icon name={icono} size={14} color="#667eea" />
        <Text style={styles.itemValor}>{valor || 'No especificado'}</Text>
      </View>
    </View>
  );
}

// ============================================
// Estilos
// ============================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 36 },
  printButton: { padding: 6, width: 36, alignItems: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#94a3b8', fontSize: 15 },

  scrollContent: { padding: 15 },

  hero: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  proyecto: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  empresa: { fontSize: 14, color: '#475569', flex: 1 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  seccion: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667eea',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  item: { marginBottom: 12 },
  itemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemValor: { fontSize: 15, color: '#1e293b', flex: 1 },

  chipsEquipo: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chipEquipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chipEquipoText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  descripcionBox: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  descripcionText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  modalSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  modalBtnCancel: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#0ea5e9' },
});