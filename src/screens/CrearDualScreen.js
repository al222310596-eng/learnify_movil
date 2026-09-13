// ============================================
// CrearDualScreen.js - CON VALIDACIÓN DE MAESTRO (CORREGIDO)
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { dualesAPI } from '../api/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CrearDualScreen({ route, navigation }) {
  const { user } = useAuth();
  const { dualId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [cargandoDual, setCargandoDual] = useState(false);

  // Form fields
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuatrimestre, setCuatrimestre] = useState('');
  const [curso, setCurso] = useState('');
  const [carrera, setCarrera] = useState('');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [horas, setHoras] = useState('');
  const [tutor, setTutor] = useState('');
  const [alumnoEmail, setAlumnoEmail] = useState('');
  const [alumnoNombre, setAlumnoNombre] = useState('');
  const [asignaciones, setAsignaciones] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Date pickers
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

  const esEdicion = !!dualId;

  useEffect(() => {
    if (esEdicion) {
      cargarDual();
    }
  }, [dualId]);

  // ============================================
  // CARGAR DUAL PARA EDICIÓN
  // ============================================
  const cargarDual = async () => {
    try {
      setCargandoDual(true);
      const result = await dualesAPI.getDetalleDual(dualId);

      if (result.exito) {
        const dual = result.dual;
        setTitulo(dual.titulo || '');
        setEmpresa(dual.empresa || '');
        setDescripcion(dual.descripcion || '');
        setCuatrimestre(dual.cuatrimestre || '');
        setCurso(dual.curso || '');
        setCarrera(dual.carrera || '');
        setFechaInicio(dual.fecha_inicio ? new Date(dual.fecha_inicio) : null);
        setFechaFin(dual.fecha_fin ? new Date(dual.fecha_fin) : null);
        setHoras(dual.horas?.toString() || '');
        setTutor(dual.tutor || '');
        setAlumnoEmail(dual.alumno?.email || '');
        setAlumnoNombre(dual.alumno?.nombre || '');
        const asignacionesConValidacion = (dual.asignaciones || []).map(a => ({
          ...a,
          validado: true
        }));
        setAsignaciones(asignacionesConValidacion);
      } else {
        Alert.alert('Error', result.mensaje || 'Error al cargar el dual');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error al cargar dual:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargandoDual(false);
    }
  };

  // ============================================
  // BUSCAR ALUMNO POR CORREO
  // ============================================
  const buscarAlumno = async () => {
    if (!alumnoEmail.trim()) {
      Alert.alert('Error', 'Ingresa un correo electrónico');
      return;
    }

    setBuscando(true);
    try {
      const result = await dualesAPI.buscarUsuario(alumnoEmail);

      if (result.exito) {
        setAlumnoNombre(result.usuario.nombre);
        Alert.alert('Éxito', `Alumno encontrado: ${result.usuario.nombre}`);
      } else {
        setAlumnoNombre('');
        Alert.alert('Error', 'Alumno no encontrado. Verifica el correo.');
      }
    } catch (error) {
      console.error('Error al buscar alumno:', error);
      Alert.alert('Error', 'Error de conexión al buscar alumno');
    } finally {
      setBuscando(false);
    }
  };

  // ============================================
  // VALIDAR MAESTRO (PERMITIR AUTO-ASIGNACIÓN)
  // ============================================
  const validarMaestro = async (index) => {
    const asignacion = asignaciones[index];
    const email = asignacion.maestro_email?.trim();
    
    if (!email) {
      Alert.alert('Error', 'Ingresa un correo electrónico del maestro');
      return;
    }

    setBuscando(true);
    try {
      const result = await dualesAPI.buscarUsuario(email);

      if (result.exito && result.usuario) {
        if (result.usuario.rol === 'maestro') {
          const nuevasAsignaciones = [...asignaciones];
          nuevasAsignaciones[index] = {
            ...nuevasAsignaciones[index],
            maestro_nombre: result.usuario.nombre,
            validado: true
          };
          setAsignaciones(nuevasAsignaciones);
          
          if (email === user?.email) {
            Alert.alert('✅ Auto-asignación', `Te has asignado como maestro de "${asignacion.materia || 'esta materia'}"`);
          } else {
            Alert.alert('✅ Maestro validado', `Maestro encontrado: ${result.usuario.nombre}`);
          }
        } else {
          Alert.alert('❌ Error', `El usuario ${email} no es un maestro.`);
          const nuevasAsignaciones = [...asignaciones];
          nuevasAsignaciones[index] = {
            ...nuevasAsignaciones[index],
            maestro_nombre: '⚠️ No es maestro',
            validado: false
          };
          setAsignaciones(nuevasAsignaciones);
        }
      } else {
        Alert.alert('❌ Error', `No se encontró ningún usuario con el correo ${email}`);
        const nuevasAsignaciones = [...asignaciones];
        nuevasAsignaciones[index] = {
          ...nuevasAsignaciones[index],
          maestro_nombre: '⚠️ Usuario no encontrado',
          validado: false
        };
        setAsignaciones(nuevasAsignaciones);
      }
    } catch (error) {
      console.error('Error al validar maestro:', error);
      Alert.alert('Error', 'Error de conexión al validar maestro');
    } finally {
      setBuscando(false);
    }
  };

  // ============================================
  // GESTIÓN DE ASIGNACIONES
  // ============================================
  const agregarAsignacion = () => {
    setAsignaciones([
      ...asignaciones,
      { materia: '', maestro_nombre: '', maestro_email: '', validado: false }
    ]);
  };

  const removerAsignacion = (index) => {
    const nuevas = [...asignaciones];
    nuevas.splice(index, 1);
    setAsignaciones(nuevas);
  };

  const actualizarAsignacion = (index, campo, valor) => {
    const nuevas = [...asignaciones];
    nuevas[index][campo] = valor;
    
    if (campo === 'maestro_email') {
      nuevas[index].validado = false;
      nuevas[index].maestro_nombre = '';
    }
    
    setAsignaciones(nuevas);
  };

  // ============================================
  // GUARDAR DUAL (USANDO dualesAPI)
  // ============================================
  const guardarDual = async () => {
    // Validaciones básicas
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    if (!empresa.trim()) {
      Alert.alert('Error', 'La empresa es obligatoria');
      return;
    }
    if (!alumnoEmail.trim()) {
      Alert.alert('Error', 'El correo del alumno es obligatorio');
      return;
    }

    // Validar que todos los maestros asignados estén validados
    const asignacionesConMaestro = asignaciones.filter(a => a.maestro_email && a.maestro_email.trim() !== '');
    const asignacionesInvalidas = asignacionesConMaestro.filter(a => !a.validado);
    
    if (asignacionesInvalidas.length > 0) {
      Alert.alert(
        'Error de validación', 
        `Hay ${asignacionesInvalidas.length} maestro(s) sin validar. Por favor, valida cada maestro antes de guardar.`
      );
      return;
    }

    // Verificar que todas las materias con maestro tengan nombre
    const asignacionesSinNombre = asignacionesConMaestro.filter(a => !a.maestro_nombre || a.maestro_nombre.includes('⚠️'));
    if (asignacionesSinNombre.length > 0) {
      Alert.alert(
        'Error', 
        'Hay maestros que no han sido validados correctamente. Por favor, revisa los correos.'
      );
      return;
    }

    setLoading(true);

    try {
      const asignacionesLimpias = asignaciones
        .filter(a => a.materia || a.maestro_email)
        .map(a => ({
          materia: a.materia || '',
          maestro_nombre: a.maestro_nombre || '',
          maestro_email: a.maestro_email || ''
        }));

      const data = {
        usuario_id: user._id,
        titulo,
        empresa,
        descripcion,
        cuatrimestre,
        curso,
        carrera,
        fecha_inicio: fechaInicio ? fechaInicio.toISOString().split('T')[0] : null,
        fecha_fin: fechaFin ? fechaFin.toISOString().split('T')[0] : null,
        horas: parseInt(horas) || 0,
        tutor,
        alumno_email: alumnoEmail,
        asignaciones: asignacionesLimpias
      };

      let result;
      if (esEdicion) {
        result = await dualesAPI.actualizarDual(dualId, data);
      } else {
        result = await dualesAPI.crearDual(data);
      }

      if (result.exito) {
        Alert.alert(
          'Éxito',
          esEdicion ? 'Dual actualizado correctamente' : 'Dual registrado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.mensaje || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'Error de conexión al guardar');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER ASIGNACIÓN
  // ============================================
  const renderAsignacion = (item, index) => {
    const estaValidado = item.validado === true;
    const tieneEmail = item.maestro_email && item.maestro_email.trim() !== '';
    const tieneError = item.maestro_nombre && item.maestro_nombre.includes('⚠️');
    
    return (
      <View key={index} style={styles.asignacionItem}>
        <View style={styles.asignacionRow}>
          <View style={styles.asignacionField}>
            <Text style={styles.inputLabel}>Materia *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la materia"
              value={item.materia}
              onChangeText={(text) => actualizarAsignacion(index, 'materia', text)}
            />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removerAsignacion(index)}
          >
            <Icon name="close-circle-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.asignacionRow}>
          <View style={styles.asignacionField}>
            <Text style={styles.inputLabel}>Correo del Maestro *</Text>
            <TextInput
              style={[styles.input, estaValidado && styles.inputSuccess]}
              placeholder="maestro@email.com"
              value={item.maestro_email}
              onChangeText={(text) => actualizarAsignacion(index, 'maestro_email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!estaValidado}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.validarButton, 
              estaValidado && styles.validarButtonSuccess,
              !tieneEmail && styles.validarButtonDisabled
            ]}
            onPress={() => validarMaestro(index)}
            disabled={!tieneEmail || estaValidado}
          >
            <Icon 
              name={estaValidado ? 'checkmark-circle' : 'search-outline'} 
              size={20} 
              color={estaValidado ? '#10b981' : '#667eea'} 
            />
            <Text style={[styles.validarButtonText, estaValidado && styles.validarButtonTextSuccess]}>
              {estaValidado ? 'Validado' : 'Validar'}
            </Text>
          </TouchableOpacity>
        </View>

        {item.maestro_nombre && (
          <View style={styles.maestroInfoContainer}>
            <Icon 
              name={estaValidado ? 'checkmark-circle' : (tieneError ? 'alert-circle' : 'information-circle')} 
              size={16} 
              color={estaValidado ? '#10b981' : (tieneError ? '#ef4444' : '#f59e0b')} 
            />
            <Text style={[
              styles.maestroInfoText, 
              estaValidado && styles.maestroInfoTextSuccess,
              tieneError && styles.maestroInfoTextError
            ]}>
              {item.maestro_nombre}
            </Text>
          </View>
        )}

        <View style={styles.asignacionRow}>
          <View style={styles.asignacionField}>
            <Text style={styles.inputLabel}>Nombre del Maestro</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Se autocompleta al validar"
              value={item.maestro_nombre || ''}
              editable={false}
              pointerEvents="none"
            />
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // PANTALLA DE CARGA
  // ============================================
  if (cargandoDual) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando dual...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {esEdicion ? 'Editar Dual' : 'Registrar Dual'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Alumno */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="person-outline" size={18} color="#667eea" /> Alumno
            </Text>
            <View style={styles.alumnoContainer}>
              <View style={styles.alumnoField}>
                <Text style={styles.inputLabel}>Correo del Alumno *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="alumno@email.com"
                  value={alumnoEmail}
                  onChangeText={setAlumnoEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.buscarButton} onPress={buscarAlumno} disabled={buscando}>
                {buscando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="search-outline" size={20} color="#fff" />
                    <Text style={styles.buscarButtonText}>Buscar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {alumnoNombre ? (
              <Text style={styles.alumnoEncontrado}>
                <Icon name="checkmark-circle" size={16} color="#10b981" /> {alumnoNombre}
              </Text>
            ) : null}
          </View>

          {/* Información del Dual */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="information-circle-outline" size={18} color="#667eea" /> Información del Dual
            </Text>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Desarrollo Full Stack"
              value={titulo}
              onChangeText={setTitulo}
            />
            <Text style={styles.inputLabel}>Empresa *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la empresa"
              value={empresa}
              onChangeText={setEmpresa}
            />
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe las actividades..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Académico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="school-outline" size={18} color="#667eea" /> Información Académica
            </Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>Cuatrimestre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 5"
                  value={cuatrimestre}
                  onChangeText={setCuatrimestre}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>Curso</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Desarrollo Web"
                  value={curso}
                  onChangeText={setCurso}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>Carrera</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Ingeniería en Sistemas"
                  value={carrera}
                  onChangeText={setCarrera}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>Tutor</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del tutor"
                  value={tutor}
                  onChangeText={setTutor}
                />
              </View>
            </View>
          </View>

          {/* Fechas y Horas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="calendar-outline" size={18} color="#667eea" /> Fechas y Horas
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePickerInicio(true)}
            >
              <Icon name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.dateButtonText}>
                {fechaInicio ? fechaInicio.toLocaleDateString('es-MX') : 'Seleccionar fecha inicio'}
              </Text>
            </TouchableOpacity>
            {showDatePickerInicio && (
              <DateTimePicker
                value={fechaInicio || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePickerInicio(false);
                  if (selectedDate) setFechaInicio(selectedDate);
                }}
              />
            )}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePickerFin(true)}
            >
              <Icon name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.dateButtonText}>
                {fechaFin ? fechaFin.toLocaleDateString('es-MX') : 'Seleccionar fecha fin'}
              </Text>
            </TouchableOpacity>
            {showDatePickerFin && (
              <DateTimePicker
                value={fechaFin || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePickerFin(false);
                  if (selectedDate) setFechaFin(selectedDate);
                }}
              />
            )}
            <Text style={styles.inputLabel}>Horas totales</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 480"
              value={horas}
              onChangeText={setHoras}
              keyboardType="numeric"
            />
          </View>

          {/* Asignaciones con Validación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="people-outline" size={18} color="#667eea" /> Materias y Maestros
            </Text>
            {asignaciones.map((item, index) => renderAsignacion(item, index))}
            <TouchableOpacity style={styles.addButton} onPress={agregarAsignacion}>
              <Icon name="add-circle-outline" size={20} color="#667eea" />
              <Text style={styles.addButtonText}>Agregar Materia</Text>
            </TouchableOpacity>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={guardarDual}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {esEdicion ? 'Actualizar Dual' : 'Registrar Dual'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    color: '#1e293b',
  },
  inputSuccess: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  alumnoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alumnoField: {
    flex: 1,
  },
  buscarButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
    marginTop: 4,
  },
  buscarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  alumnoEncontrado: {
    color: '#10b981',
    fontSize: 13,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1e293b',
  },
  asignacionItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  asignacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  asignacionField: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
    marginTop: 20,
  },
  validarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
    height: 44,
  },
  validarButtonSuccess: {
    backgroundColor: '#d1fae5',
  },
  validarButtonDisabled: {
    opacity: 0.5,
  },
  validarButtonText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 12,
  },
  validarButtonTextSuccess: {
    color: '#059669',
  },
  maestroInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  maestroInfoText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
  },
  maestroInfoTextSuccess: {
    color: '#10b981',
  },
  maestroInfoTextError: {
    color: '#ef4444',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#667eea',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});