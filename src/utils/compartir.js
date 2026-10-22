// ============================================
// utils/compartir.js
// Genera el archivo PDF de cualquier documento
// (estadía, dual o minuta) para poder enviarlo.
// ============================================
import * as Print from 'expo-print';
import { estadiasAPI, dualesAPI } from '../api/api';
import { obtenerHtmlMinuta } from './pdf';

/**
 * @param {'estadia'|'dual'|'minuta'} tipo  tipo de documento
 * @param {object} documento                 objeto con al menos _id
 * @returns {Promise<string>}                ruta local (uri) del PDF generado
 */
export const generarPdfDocumento = async (tipo, documento) => {
  let html = null;

  // Cada tipo de documento obtiene su HTML de forma distinta:
  if (tipo === 'estadia') {
    html = await estadiasAPI.getFormatoHTML(documento._id); // ya existía en el backend
  } else if (tipo === 'dual') {
    html = await dualesAPI.getFormatoHTML(documento._id);   // ruta nueva del backend
  } else if (tipo === 'minuta') {
    html = await obtenerHtmlMinuta(documento);              // se arma en el móvil
  }

  // Si no llegó HTML, no se puede generar el PDF
  if (!html || typeof html !== 'string') {
    throw new Error('No se pudo obtener el formato del documento');
  }

  // Convierte el HTML a un archivo PDF temporal en el teléfono
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};