// ============================================
// CompartirModal
// Modal reutilizable para compartir un documento.
// Pestañas: Por correo | Por enlace | Historial
// (equivalente móvil del modal de la versión web)
//
// Props:
//   visible   -> muestra u oculta el modal
//   onClose   -> función para cerrarlo
//   tipo      -> 'estadia' | 'dual' | 'minuta'
//   documento -> objeto del documento (debe traer _id)
// ============================================
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Share, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { compartirAPI } from '../api/api';
import { generarPdfDocumento } from '../utils/compartir';

// Opciones de vigencia del enlace (0 = nunca expira)
const VIGENCIAS = [
  { label: '1 día', value: 1 },
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: 'Nunca', value: 0 },
];

// Validación sencilla de correo
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompartirModal({ visible, onClose, tipo, documento }) {
  const { user } = useAuth();

  // ----- Estado -----
  const [tab, setTab] = useState('correo');           // pestaña activa
  const [correos, setCorreos] = useState('');         // texto de correos
  const [enviando, setEnviando] = useState(false);    // cargando envío de correo
  const [dias, setDias] = useState(7);                // vigencia elegida
  const [enlace, setEnlace] = useState('');           // enlace generado
  const [generando, setGenerando] = useState(false);  // cargando generación de enlace
  const [historial, setHistorial] = useState([]);     // lista del historial
  const [cargandoHist, setCargandoHist] = useState(false);

  // ID del documento y del usuario que comparte
  const documentoId = documento?._id;
  const usuarioId = user?._id || user?.id || user?.usuario_id;

  // Las minutas guardadas solo en el teléfono tienen id "local_..."
  // y el servidor no las conoce, así que no se pueden compartir
  const esLocal = String(documentoId || '').startsWith('local_');

  // Cada vez que se abre el modal, se limpian los campos
  useEffect(() => {
    if (visible) {
      setTab('correo');
      setCorreos('');
      setDias(7);
      setEnlace('');
      setHistorial([]);
    }
  }, [visible]);

  // Al entrar a la pestaña Historial, se carga desde el servidor
  useEffect(() => {
    if (visible && tab === 'historial') cargarHistorial();
  }, [tab, visible]);

  // Verifica que el documento exista en el servidor
  const validarDocumento = () => {
    if (!documentoId || esLocal) {
      Alert.alert('No disponible', 'Este documento aún no está guardado en el servidor.');
      return false;
    }
    return true;
  };

  // ----- POR CORREO -----
  const enviarCorreo = async () => {
    if (!validarDocumento()) return;

    // Convierte "a@x.com, b@y.com" en ['a@x.com', 'b@y.com']
    const lista = correos.split(',').map(c => c.trim()).filter(Boolean);
    if (lista.length === 0) {
      return Alert.alert('Falta información', 'Ingresa al menos un correo');
    }

    // Avisa si algún correo tiene formato inválido
    const invalidos = lista.filter(c => !EMAIL_REGEX.test(c));
    if (invalidos.length) {
      return Alert.alert('Correos inválidos', invalidos.join('\n'));
    }

    try {
      setEnviando(true);

      // 1. Genera el PDF en el teléfono
      const pdfUri = await generarPdfDocumento(tipo, documento);

      // 2. Lo sube al backend, que lo envía por correo
      const res = await compartirAPI.enviarPorCorreo({
        pdfUri,
        correos: lista,
        tipo,
        documentoId,
        creadorId: usuarioId,
      });

      if (res.exito) {
        Alert.alert('Enviado', 'Correo enviado con el PDF adjunto');
        onClose();
      } else {
        Alert.alert('Error', res.mensaje || 'No se pudo enviar');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error al generar o enviar el PDF');
    } finally {
      setEnviando(false); // siempre quita el spinner
    }
  };

  // ----- POR ENLACE -----
  const generarEnlace = async () => {
    if (!validarDocumento()) return;
    try {
      setGenerando(true);
      const res = await compartirAPI.generarEnlace({
        documentoId,
        tipo,
        creadorId: usuarioId,
        diasExpiracion: dias,
      });
      if (res.exito) setEnlace(res.enlace); // muestra el enlace en pantalla
      else Alert.alert('Error', res.mensaje || 'No se pudo generar el enlace');
    } finally {
      setGenerando(false);
    }
  };

  // Abre el menú nativo de compartir (WhatsApp, copiar, correo, etc.)
  const compartirEnlace = async () => {
    if (!enlace) return Alert.alert('Aviso', 'Genera un enlace primero');
    try {
      await Share.share({ message: enlace });
    } catch (e) {
      console.log(e);
    }
  };

  // ----- HISTORIAL -----
  const cargarHistorial = async () => {
    if (!documentoId || esLocal) return;
    setCargandoHist(true);
    const res = await compartirAPI.getHistorial(documentoId);
    setHistorial(res.exito ? res.historial : []);
    setCargandoHist(false);
  };

  // Botón de pestaña (se resalta si es la activa)
  const TabBtn = ({ id, label }) => (
    <TouchableOpacity
      style={[styles.tab, tab === id && styles.tabActiva]}
      onPress={() => setTab(id)}
    >
      <Text style={[styles.tabTexto, tab === id && styles.tabTextoActiva]}>{label}</Text>
    </TouchableOpacity>
  );

  // ----- RENDER -----
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.contenido}>

          {/* Encabezado con título y botón cerrar */}
          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <Icon name="share-social-outline" size={20} color="#0ea5e9" />
              <Text style={styles.titulo}>Compartir documento</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Pestañas */}
          <View style={styles.tabs}>
            <TabBtn id="correo" label="Por correo" />
            <TabBtn id="enlace" label="Por enlace" />
            <TabBtn id="historial" label="Historial" />
          </View>

          {/* PESTAÑA: CORREO */}
          {tab === 'correo' && (
            <View>
              <Text style={styles.label}>Correos destinatarios (separados por coma)</Text>
              <TextInput
                style={styles.input}
                value={correos}
                onChangeText={setCorreos}
                placeholder="ejemplo1@correo.com, ejemplo2@correo.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.btnPrincipal} onPress={enviarCorreo} disabled={enviando}>
                {enviando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="paper-plane-outline" size={18} color="#fff" />
                    <Text style={styles.btnPrincipalTexto}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* PESTAÑA: ENLACE */}
          {tab === 'enlace' && (
            <View>
              <Text style={styles.label}>Vigencia</Text>
              <View style={styles.chips}>
                {VIGENCIAS.map(v => (
                  <TouchableOpacity
                    key={v.value}
                    style={[styles.chip, dias === v.value && styles.chipActivo]}
                    onPress={() => setDias(v.value)}
                  >
                    <Text style={[styles.chipTexto, dias === v.value && styles.chipTextoActivo]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.btnPrincipal} onPress={generarEnlace} disabled={generando}>
                {generando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="link-outline" size={18} color="#fff" />
                    <Text style={styles.btnPrincipalTexto}>Generar enlace</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Solo aparece cuando ya se generó el enlace */}
              {!!enlace && (
                <View style={styles.enlaceBox}>
                  <Text style={styles.enlaceTexto} selectable numberOfLines={3}>{enlace}</Text>
                  <TouchableOpacity style={styles.btnSecundario} onPress={compartirEnlace}>
                    <Icon name="share-outline" size={16} color="#0ea5e9" />
                    <Text style={styles.btnSecundarioTexto}>Copiar / compartir enlace</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PESTAÑA: HISTORIAL */}
          {tab === 'historial' && (
            <ScrollView style={{ maxHeight: 260 }}>
              {cargandoHist ? (
                <ActivityIndicator color="#667eea" style={{ marginTop: 20 }} />
              ) : historial.length === 0 ? (
                <Text style={styles.vacio}>No hay historial aún.</Text>
              ) : (
                historial.map((h, i) => (
                  <View key={i} style={styles.histItem}>
                    <View style={styles.histFila}>
                      <Icon
                        name={h.accion === 'creado' ? 'add-circle-outline' : 'eye-outline'}
                        size={16}
                        color="#667eea"
                      />
                      <Text style={styles.histAccion}>{String(h.accion).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.histFecha}>{h.fecha}</Text>
                    <Text style={styles.histIp}>IP: {h.ip}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ----- ESTILOS -----
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  contenido: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActiva: { backgroundColor: '#fff' },
  tabTexto: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  tabTextoActiva: { color: '#0ea5e9' },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b', marginBottom: 14, backgroundColor: '#f8fafc' },
  btnPrincipal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0ea5e9', paddingVertical: 13, borderRadius: 12 },
  btnPrincipalTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f1f5f9' },
  chipActivo: { backgroundColor: '#0ea5e9' },
  chipTexto: { fontSize: 13, color: '#475569', fontWeight: '600' },
  chipTextoActivo: { color: '#fff' },
  enlaceBox: { marginTop: 14, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  enlaceTexto: { fontSize: 12, color: '#334155', marginBottom: 10 },
  btnSecundario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd' },
  btnSecundarioTexto: { color: '#0ea5e9', fontWeight: '600', fontSize: 13 },
  vacio: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
  histItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  histFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  histAccion: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  histFecha: { fontSize: 12, color: '#64748b', marginTop: 2 },
  histIp: { fontSize: 11, color: '#94a3b8' },
});