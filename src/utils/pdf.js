import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Asset } from "expo-asset";
import { minutasAPI } from "../api/api";   // ← NUEVO

// ============================================
// Convertir asset local a base64
// ============================================
const assetToBase64 = async (module) => {
    try {
        const asset = Asset.fromModule(module);
        await asset.downloadAsync();
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    } catch (error) {
        console.error("Error convirtiendo asset a base64:", error);
        return "";
    }
};

const escapeHtml = (texto) => {
    if (!texto) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatearFecha = (fecha) => {
    if (!fecha) return "";
    try {
        const d = new Date(fecha + "T12:00:00");
        return d.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return fecha;
    }
};

export const generarHtmlFormato = (
    m,
    logoEscuelaBase64 = "",
    logoTecnmBase64 = ""
) => {
    const fecha = m.fecha ? formatearFecha(m.fecha) : "";

    // Normalizar arrays (por si vienen undefined)
    const asistentes = Array.isArray(m.asistentes) ? m.asistentes : [];
    const acuerdos = Array.isArray(m.acuerdos) ? m.acuerdos : [];

    console.log("[pdf] asistentes recibidos:", asistentes.length);
    console.log("[pdf] acuerdos recibidos:", acuerdos.length);

    // --- Asistentes en dos columnas ---
    const mitad = Math.ceil(asistentes.length / 2);
    const izq = asistentes.slice(0, mitad);
    const der = asistentes.slice(mitad);
    const maxFilas = Math.max(izq.length, der.length, 8);

    let filasAsistentes = "";
    for (let i = 0; i < maxFilas; i++) {
        const a = izq[i] || { nombre: "", firma: "" };
        const b = der[i] || { nombre: "", firma: "" };
        filasAsistentes += `
      <tr>
        <td>${escapeHtml(a.nombre || "")}</td>
        <td>${escapeHtml(a.firma || "")}</td>
        <td>${escapeHtml(b.nombre || "")}</td>
        <td>${escapeHtml(b.firma || "")}</td>
      </tr>
    `;
    }

    // --- Acuerdos ---
    const minAcuerdos = Math.max(acuerdos.length, 6);
    let filasAcuerdos = "";
    for (let i = 0; i < minAcuerdos; i++) {
        const a = acuerdos[i] || {};
        filasAcuerdos += `
      <tr>
        <td>${escapeHtml(a.agenda || "")}</td>
        <td>${escapeHtml(a.acuerdo || "")}</td>
        <td>${escapeHtml(a.responsable || "")}</td>
        <td>${a.fecha_compromiso ? formatearFecha(a.fecha_compromiso) : ""}</td>
      </tr>
    `;
    }

    const logoEscuelaHTML = logoEscuelaBase64
        ? `<img class="logo" src="data:image/png;base64,${logoEscuelaBase64}" alt="Logo Escuela" />`
        : `<div class="logo-placeholder">LOGO<br>ESCUELA</div>`;

    const logoTecnmHTML = logoTecnmBase64
        ? `<img class="logo" src="data:image/png;base64,${logoTecnmBase64}" alt="Logo TecNM" />`
        : `<div class="logo-placeholder">LOGO<br>TECNM</div>`;

    return `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: letter; margin: 1.2cm; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; line-height: 1.3; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .titulo h1 { font-size: 14pt; margin: 0; letter-spacing: 1px; }
        .titulo p { font-size: 9pt; color: #555; margin: 2px 0 0; text-align: center; }
        .logo { width: 70px; height: 70px; object-fit: contain; }
        .logo-placeholder { width: 60px; height: 60px; border: 2px dashed #999; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #666; text-align: center; font-weight: bold; }
        .info { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 10px; }
        .info .linea { border-bottom: 1px solid #000; display: inline-block; min-width: 100px; padding: 0 4px; }
        .seccion-titulo { background: #e2e8f0; padding: 4px 8px; font-size: 10pt; font-weight: bold; border-left: 3px solid #667eea; margin: 10px 0 6px; }
        .asunto { border: 1px solid #444; padding: 6px 8px; min-height: 30px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        th, td { border: 1px solid #666; padding: 5px 6px; text-align: left; vertical-align: top; }
        th { background: #f1f5f9; font-size: 8.5pt; text-transform: uppercase; }
        .pie { margin-top: 15px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 8pt; color: #555; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoEscuelaHTML}
        <div class="titulo">
          <h1>MINUTA</h1>
          <p>Registro formal de reunión · Formato 2-R-COM-04</p>
        </div>
        ${logoTecnmHTML}
      </div>

      <div class="info">
        <span><strong>FECHA:</strong> <span class="linea">${fecha}</span></span>
        <span><strong>HORA:</strong> <span class="linea">${m.hora || "___:___"}</span></span>
      </div>

      <div class="info">
        <span><strong>ÁREA O CARRERA:</strong> <span class="linea" style="min-width:250px;">${escapeHtml(m.area_carrera || "")}</span></span>
        <span><strong>PÁG:</strong> 1 <strong>DE</strong> 1</span>
      </div>

      <div class="seccion-titulo">ASUNTO</div>
      <div class="asunto">${escapeHtml(m.asunto || "")}</div>

      <div class="seccion-titulo">ASISTENTES</div>
      <table>
        <thead>
          <tr>
            <th style="width:30%;">NOMBRE</th>
            <th style="width:20%;">FIRMA</th>
            <th style="width:30%;">NOMBRE</th>
            <th style="width:20%;">FIRMA</th>
          </tr>
        </thead>
        <tbody>${filasAsistentes}</tbody>
      </table>

      <div class="seccion-titulo">AGENDA Y ACUERDOS</div>
      <table>
        <thead>
          <tr>
            <th style="width:25%;">AGENDA</th>
            <th style="width:40%;">ACUERDOS</th>
            <th style="width:20%;">RESPONSABLE</th>
            <th style="width:15%;">FECHA</th>
          </tr>
        </thead>
        <tbody>${filasAcuerdos}</tbody>
      </table>

      <div class="pie">
        <span>Revisión 02</span>
        <span>R-COM-04</span>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera el PDF y abre el diálogo nativo del sistema.
 * IMPORTANTE: pide el detalle completo al backend antes de generar el HTML.
 */
export const exportarPDFyCompartir = async (minuta) => {
    try {
        console.log("[pdf] minuta recibida por params:", minuta);

        // 1. Verificar si ya trae asistentes/acuerdos completos
        const tieneAsistentes =
            Array.isArray(minuta?.asistentes) && minuta.asistentes.length > 0;
        const tieneAcuerdos =
            Array.isArray(minuta?.acuerdos) && minuta.acuerdos.length > 0;

        let minutaCompleta = minuta;

        // 2. Si NO los trae y hay _id, pedir el detalle al backend
        if ((!tieneAsistentes || !tieneAcuerdos) && minuta?._id) {
            console.log("[pdf] Pidiendo detalle al backend, ID:", minuta._id);
            const res = await minutasAPI.getDetalleMinuta(minuta._id);
            console.log("[pdf] Respuesta detalle:", res);

            if (res?.exito && res.minuta) {
                minutaCompleta = res.minuta;
                console.log(
                    "[pdf] Detalle obtenido. asistentes:",
                    minutaCompleta.asistentes?.length,
                    "acuerdos:",
                    minutaCompleta.acuerdos?.length
                );
            } else {
                console.warn("[pdf] No se pudo obtener el detalle, uso params");
            }
        }

        // 3. Convertir los logos a base64
        const logoEscuelaBase64 = await assetToBase64(
            require("../assets/img/logo_escuela.png")
        );
        const logoTecnmBase64 = await assetToBase64(
            require("../assets/img/logo_tecnm.png")
        );

        // 4. Generar HTML y PDF
        const html = generarHtmlFormato(
            minutaCompleta,
            logoEscuelaBase64,
            logoTecnmBase64
        );

        await Print.printAsync({ html });
        return true;
    } catch (error) {
        console.error("Error al generar PDF:", error);
        throw error;
    }
};

export const generarPDF = exportarPDFyCompartir;