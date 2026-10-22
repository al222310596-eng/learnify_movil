// ============================================
// API - Configuración para llamadas al backend
// ============================================

import axios from 'axios';

// IP DE TU COMPUTADORA

const IP = '192.168.100.14';  //ip de datos 172.20.10.2 172.20.10.4
//const IP = '192.168.100.14'; // ip de internet casa 192.168.100.14
export const BASE_URL = `http://192.168.100.14:5000/api`; // ✅ EXPORTADA

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ============================================
// AUTENTICACIÓN
// ============================================

export const authAPI = {
  registrar: async (nombre, email, password, rol) => { 
    try {
      const response = await api.post('/registro', { nombre, email, password, rol });
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error de conexión' };
    }
  },
  iniciarSesion: async (email, password) => {
    try {
      const response = await api.post('/iniciar-sesion', { email, password });
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error de conexión' };
    }
  }
};

// ============================================
// EQUIPOS
// ============================================

export const equiposAPI = {
  getEquipos: async (usuarioId) => {
    try {
      const response = await api.get(`/equipos/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      return { exito: false, equipos: [] };
    }
  },
  getDetalleEquipo: async (equipoId) => {
    try {
      const response = await api.get(`/equipos/detalle/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      return { exito: false };
    }
  },
  crearEquipo: async (nombre, descripcion, liderId) => {
    try {
      const response = await api.post('/equipos/crear', { nombre, descripcion, lider_id: liderId });
      return response.data;
    } catch (error) {
      console.error('Error al crear equipo:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al crear equipo' };
    }
  },
  unirseEquipo: async (equipoId, usuarioId) => {
    try {
      const response = await api.post('/equipos/unirse', { equipo_id: equipoId, usuario_id: usuarioId });
      return response.data;
    } catch (error) {
      console.error('Error al unirse a equipo:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al unirse' };
    }
  },
  salirEquipo: async (equipoId, usuarioId) => {
    try {
      const response = await api.delete(`/equipos/salir/${equipoId}`, {
        data: { usuario_id: usuarioId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al salir de equipo:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al salir' };
    }
  },
  eliminarEquipo: async (equipoId, usuarioId) => {
    try {
      const response = await api.delete(`/equipos/eliminar/${equipoId}`, {
        data: { usuario_id: usuarioId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar' };
    }
  }
};

// ============================================
// TAREAS
// ============================================

export const tareasAPI = {
  getTareasAlumno: async (alumnoId) => {
    try {
      const response = await api.get(`/tareas/alumno/${alumnoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      return { exito: false, tareas: [] };
    }
  },
  getTareasLider: async (liderId) => {
    try {
      const response = await api.get(`/tareas/lider/${liderId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tareas de líder:', error);
      return { exito: false, tareas: [] };
    }
  },
  getTareasEquipo: async (equipoId) => {
    try {
      const response = await api.get(`/tareas/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tareas del equipo:', error);
      return { exito: false, tareas: [] };
    }
  },
  getDetalleTarea: async (tareaId) => {
    try {
      const response = await api.get(`/tareas/detalle/${tareaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      return { exito: false };
    }
  },
  crearTarea: async (titulo, descripcion, equipoId, creadorId, fechaLimite) => {
    try {
      const response = await api.post('/tareas/crear', {
        titulo,
        descripcion,
        equipo_id: equipoId,
        creador_id: creadorId,
        fecha_limite: fechaLimite || null
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear tarea:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al crear tarea' };
    }
  },
  entregarTarea: async (tareaId, alumnoId, comentario, archivo) => {
    try {
      const formData = new FormData();
      formData.append('tarea_id', tareaId);
      formData.append('alumno_id', alumnoId);
      formData.append('comentario', comentario || '');
      if (archivo) {
        formData.append('archivo', {
          uri: archivo.uri,
          name: archivo.name || 'archivo.pdf',
          type: archivo.type || 'application/pdf'
        });
      }

      const response = await api.post('/entregas/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Error al entregar tarea:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al entregar' };
    }
  },
  calificarEntrega: async (entregaId, calificacion) => {
    try {
      const response = await api.put('/entregas/calificar', { entrega_id: entregaId, calificacion });
      return response.data;
    } catch (error) {
      console.error('Error al calificar:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al calificar' };
    }
  }
};

// ============================================
// CHAT
// ============================================

export const chatAPI = {
  getMensajes: async (equipoId) => {
    try {
      const response = await api.get(`/chat/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      return { exito: false, mensajes: [] };
    }
  },
  enviarMensaje: async (equipoId, usuarioId, mensaje) => {
    try {
      const response = await api.post('/chat/enviar', { equipo_id: equipoId, usuario_id: usuarioId, mensaje });
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al enviar' };
    }
  }
};

// ============================================
// ANÁLISIS (SOLO PARA MAESTROS)
// ============================================

export const analisisAPI = {
  getEstadisticas: async (equipoId) => {
    try {
      const response = await api.get(`/analisis/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { exito: false };
    }
  },
  getGraficas: async (equipoId) => {
    try {
      const response = await api.get(`/analisis/graficas/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener gráficas:', error);
      return { exito: false };
    }
  },
  getRiesgo: async (equipoId) => {
    try {
      const response = await api.get(`/analisis/riesgo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener riesgo:', error);
      return { exito: false };
    }
  },
  getSegmentacion: async (equipoId) => {
    try {
      const response = await api.get(`/analisis/segmentacion/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener segmentación:', error);
      return { exito: false };
    }
  },
  getAbandono: async (equipoId) => {
    try {
      const response = await api.get(`/analisis/abandono/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener abandono:', error);
      return { exito: false };
    }
  }
};

// ============================================
// DUALES
// ============================================

export const dualesAPI = {
  getDuales: async (usuarioId) => {
    try {
      const response = await api.get(`/duales/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener duales:', error);
      return { exito: false, duales: [] };
    }
  },

  getDetalleDual: async (dualId) => {
  try {
    console.log('🔍 API: getDetalleDual llamado con ID:', dualId);
    const response = await api.get(`/duales/detalle/${dualId}`);
    console.log('📦 API: Respuesta recibida:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API: Error en getDetalleDual:', error);
    return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al obtener detalle' };
  }
},

  // ✅ NUEVO: obtiene el HTML del formato del dual para convertirlo en PDF
  // (el backend lo devuelve como texto HTML, no como JSON)
  getFormatoHTML: async (dualId) => {
    try {
      const response = await api.get(`/duales/formato/${dualId}`, {
        responseType: 'text', // importante: HTML plano, no JSON
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener formato del dual:', error);
      return null; // si falla devolvemos null y quien lo llame lo maneja
    }
  },

  crearDual: async (datos) => {
    try {
      const response = await api.post('/duales/crear', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear dual:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al crear dual' };
    }
  },

  actualizarDual: async (dualId, datos) => {
    try {
      const response = await api.put(`/duales/actualizar/${dualId}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar dual:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar' };
    }
  },

  eliminarDual: async (dualId) => {
    try {
      const response = await api.delete(`/duales/eliminar/${dualId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar dual:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar' };
    }
  },

  firmarDual: async (dualId, asignacionIndex, usuarioId, firma) => {
    try {
      const response = await api.post('/duales/firmar', {
        dual_id: dualId,
        asignacion_index: asignacionIndex,
        usuario_id: usuarioId,
        firma: firma
      });
      return response.data;
    } catch (error) {
      console.error('Error al firmar dual:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al firmar' };
    }
  },

  // ✅ NUEVO: Solicitar código de firma por email
  solicitarCodigoFirma: async (dualId, asignacionIndex, usuarioId) => {
    try {
      const response = await api.post('/duales/solicitar-codigo-firma', {
        dual_id: dualId,
        asignacion_index: asignacionIndex,
        usuario_id: usuarioId
      });
      return response.data;
    } catch (error) {
      console.error('Error al solicitar código:', error);
      return {
        exito: false,
        mensaje: error.response?.data?.mensaje || 'Error al enviar el código'
      };
    }
  },

  // ✅ NUEVO: Verificar código + contraseña y firmar
  verificarCodigoFirma: async (dualId, asignacionIndex, usuarioId, codigo, password) => {
    try {
      const response = await api.post('/duales/verificar-codigo-firma', {
        dual_id: dualId,
        asignacion_index: asignacionIndex,
        usuario_id: usuarioId,
        codigo: codigo,
        password: password
      });
      return response.data;
    } catch (error) {
      console.error('Error al verificar código:', error);
      return {
        exito: false,
        mensaje: error.response?.data?.mensaje || 'Error al verificar el código'
      };
    }
  },

  buscarUsuario: async (email) => {
    try {
      const response = await api.get(`/usuarios/buscar?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar usuario:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al buscar' };
    }
  }
};

// ============================================
// JITSI MEET - VIDEOLLAMADAS
// ============================================

export const jitsiAPI = {
  // Crear sala de videollamada
  crearSala: async (usuarioId, usuarioNombre) => {
    try {
      const response = await api.post('/jitsi/crear-sala', {
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear sala Jitsi:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al crear sala' };
    }
  },

  // Eliminar sala
  eliminarSala: async (salaId) => {
    try {
      const response = await api.delete(`/jitsi/eliminar-sala/${salaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar sala:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar sala' };
    }
  },

  // Obtener salas de un usuario
  getSalas: async (usuarioId) => {
    try {
      const response = await api.get(`/jitsi/salas/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener salas:', error);
      return { exito: false, salas: [] };
    }
  }
};

// ============================================
// ESTADÍAS (extendido)
// ============================================

export const estadiasAPI = {
  // Listar estadías (ya lo tenías)
  getEstadias: async (usuarioId) => {
    try {
      const response = await api.get(`/estadias/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadías:', error);
      return { exito: false, estadias: [] };
    }
  },

  // Detalle de una estadía
  getDetalleEstadia: async (estadiaId) => {
    try {
      const response = await api.get(`/estadias/detalle/${estadiaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      return { exito: false };
    }
  },

  // Crear estadía
  crearEstadia: async (datos) => {
    try {
      const response = await api.post('/estadias/crear', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear estadía:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al crear' };
    }
  },

  // Actualizar estadía
  actualizarEstadia: async (estadiaId, datos) => {
    try {
      const response = await api.put(`/estadias/actualizar/${estadiaId}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estadía:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar' };
    }
  },

  // Eliminar estadía
  eliminarEstadia: async (estadiaId) => {
    try {
      const response = await api.delete(`/estadias/eliminar/${estadiaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar estadía:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar' };
    }
  },

  // ✅ NUEVO: buscar maestros (autocompletado)
  buscarMaestros: async (q, limite = 8) => {
    try {
      const response = await api.get('/usuarios/maestros', {
        params: { q, limite }
      });
      return response.data;
    } catch (error) {
      console.error('Error al buscar maestros:', error);
      return { exito: false, maestros: [] };
    }
  },

  // ✅ NUEVO: progreso de horas
  getProgreso: async (estadiaId) => {
    try {
      const response = await api.get(`/estadias/${estadiaId}/progreso`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener progreso:', error);
      return { exito: false };
    }
  },

  // ✅ NUEVO: listar registros de horas
  getRegistros: async (estadiaId) => {
    try {
      const response = await api.get(`/estadias/${estadiaId}/registros`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener registros:', error);
      return { exito: false, registros: [] };
    }
  },

  // ✅ NUEVO: crear registro de horas
  crearRegistro: async (estadiaId, datos) => {
    try {
      const response = await api.post(`/estadias/${estadiaId}/registros`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear registro:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al guardar' };
    }
  },

  // ✅ NUEVO: actualizar registro
  actualizarRegistro: async (registroId, datos) => {
    try {
      const response = await api.put(`/registros/${registroId}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar registro:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar' };
    }
  },

  // ✅ NUEVO: eliminar registro
  eliminarRegistro: async (registroId) => {
    try {
      const response = await api.delete(`/registros/${registroId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar' };
    }
    
  },

    // ✅ NUEVO: obtener HTML del formato para imprimir
  getFormatoHTML: async (estadiaId) => {
    try {
      const response = await api.get(`/estadias/formato/${estadiaId}`, {
        responseType: 'text'  // ← HTML plano, no JSON
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener formato:', error);
      return null;
    }
  },

    // ✅ NUEVO: estadías nuevas para el maestro (notificación)
  getEstadiasNuevas: async (usuarioId) => {
    try {
      const response = await api.get(`/estadias/nuevas/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadías nuevas:', error);
      return { exito: false, total_nuevas: 0, estadias: [] };
    }
  },

  // ✅ NUEVO: marcar estadías como vistas
  marcarEstadiasVistas: async (usuarioId) => {
    try {
      const response = await api.post('/estadias/marcar-vistas', { usuario_id: usuarioId });
      return response.data;
    } catch (error) {
      console.error('Error al marcar vistas:', error);
      return { exito: false };
    }
  },

};


// ============================================
// USUARIOS / PERFIL
// ============================================

export const usuariosAPI = {
  // Actualizar datos del perfil (nombre, email, password)
  actualizar: async (usuarioId, datos) => {
    try {
      const response = await api.put('/usuarios/actualizar', {
        usuario_id: usuarioId,
        ...datos,
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar' };
    }
  },

  // Subir foto de perfil
  subirFoto: async (usuarioId, imagen) => {
    try {
      const formData = new FormData();
      formData.append('usuario_id', usuarioId);
      formData.append('foto', {
        uri: imagen.uri,
        name: imagen.fileName || 'perfil.jpg',
        type: imagen.mimeType || 'image/jpeg',
      });

      const response = await api.post('/usuarios/subir-foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir foto:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al subir foto' };
    }
  },

  // Eliminar foto de perfil
  eliminarFoto: async (usuarioId) => {
    try {
      const response = await api.delete('/usuarios/eliminar-foto', {
        data: { usuario_id: usuarioId },
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar foto' };
    }
  },
  
};
// ============================================
// MINUTAS
// ============================================

export const minutasAPI = {
  getMinutas: async (usuarioId) => {
    // ✅ Validación: no permitir usuarioId vacío o inválido
    if (!usuarioId || usuarioId === "undefined" || usuarioId === "null") {
      console.warn("⚠️ [minutasAPI.getMinutas] usuarioId inválido:", usuarioId);
      return {
        exito: false,
        minutas: [],
        mensaje: "usuarioId inválido"
      };
    }

    try {
      const url = `/minutas/${usuarioId}`;
      console.log("🌐 [minutasAPI] GET", url);

      const response = await api.get(url);
      console.log("✅ [minutasAPI] Respuesta:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [minutasAPI] Error en getMinutas:");
      console.error("   URL:", error.config?.url);
      console.error("   Método:", error.config?.method);
      console.error("   Status:", error.response?.status);
      console.error("   Data del servidor:", error.response?.data);
      console.error("   Mensaje:", error.message);

      return {
        exito: false,
        minutas: [],
        mensaje: error.response?.data?.mensaje || "Error al obtener minutas"
      };
    }
  },

  getDetalleMinuta: async (minutaId) => {
    try {
      const response = await api.get(`/minutas/detalle/${minutaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle de minuta:', error);
      return { exito: false };
    }
  },

  crearMinuta: async (datos) => {
    try {
      const response = await api.post('/minutas/crear', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear minuta:', error);
      return {
        exito: false,
        mensaje: error.response?.data?.mensaje || 'Error al crear minuta'
      };
    }
  },

  eliminarMinuta: async (minutaId) => {
    if (String(minutaId).startsWith("local_")) {
      return { exito: true, mensaje: "Eliminada localmente" };
    }

    try {
      const response = await api.delete(`/minutas/eliminar/${minutaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar minuta:', error);
      return {
        exito: false,
        mensaje: error.response?.data?.mensaje || 'Error al eliminar'
      };
    }
  },
};

// ============================================
// COMPARTIR DOCUMENTOS (estadía, dual, minuta)
// Usa los mismos endpoints que la versión web
// ============================================
export const compartirAPI = {

  // Envía el PDF por correo a uno o varios destinatarios
  // POST /api/compartir/crear  (multipart/form-data)
  enviarPorCorreo: async ({ pdfUri, correos, tipo, documentoId, creadorId }) => {
    try {
      const formData = new FormData();

      // En React Native el archivo se manda como objeto { uri, name, type }
      // (en la web se manda un Blob, aquí no existe)
      formData.append('pdf_file', {
        uri: pdfUri,
        name: `documento_${tipo}.pdf`,
        type: 'application/pdf',
      });

      // El backend espera los correos separados por coma en un solo campo
      formData.append('correos', correos.join(','));
      formData.append('tipo_documento', tipo);      // 'estadia' | 'dual' | 'minuta'
      formData.append('documento_id', documentoId);
      formData.append('creador_id', creadorId);

      const response = await api.post('/compartir/crear', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // más tiempo: el envío por SMTP puede tardar
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar por correo:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error de conexión' };
    }
  },

  // Genera un enlace público con vigencia
  // POST /api/compartir/generar-enlace
  generarEnlace: async ({ documentoId, tipo, creadorId, diasExpiracion }) => {
    try {
      const response = await api.post('/compartir/generar-enlace', {
        documento_id: documentoId,
        tipo_documento: tipo,
        creador_id: creadorId,
        dias_expiracion: diasExpiracion, // 0 = nunca expira
        permisos: 'ver',                 // solo lectura
        correos: [],                     // el enlace no va ligado a correos
      });
      return response.data; // { exito, token, enlace }
    } catch (error) {
      console.error('Error al generar enlace:', error);
      return { exito: false, mensaje: error.response?.data?.mensaje || 'Error de conexión' };
    }
  },

  // Historial de "creado" y "visto" de un documento
  // GET /api/compartir/historial/<documento_id>
  getHistorial: async (documentoId) => {
    try {
      const response = await api.get(`/compartir/historial/${documentoId}`);
      return response.data; // { exito, historial: [{accion, fecha, ip}] }
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return { exito: false, historial: [] };
    }
  },
};

export default api;