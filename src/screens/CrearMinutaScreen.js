import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
//import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { minutasAPI } from "../api/api";
import { agregarMinutaLocal } from "../utils/storage";
import { exportarPDFyCompartir } from "../utils/pdf";

// Helpers
const formatearFecha = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const formatearFechaVista = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatearHora = (date) => {
    if (!date) return "";
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
};

export default function CrearMinutaScreen({ navigation }) {
    const { user } = useAuth();
    const [fecha, setFecha] = useState(new Date());
    const [hora, setHora] = useState(new Date());
    const [mostrarFecha, setMostrarFecha] = useState(false);
    const [mostrarHora, setMostrarHora] = useState(false);

    const [area, setArea] = useState("");
    const [asunto, setAsunto] = useState("");
    const [asistentes, setAsistentes] = useState([
        { nombre: "", firma: "" },
        { nombre: "", firma: "" },
    ]);
    const [acuerdos, setAcuerdos] = useState([
        { agenda: "", acuerdo: "", responsable: "", fecha_compromiso: "" },
    ]);

    const [fechaCompromiso, setFechaCompromiso] = useState({});
    const [mostrarFechaCompromiso, setMostrarFechaCompromiso] = useState(null);

    // --- Manejo de listas ---
    const agregarAsistente = () =>
        setAsistentes([...asistentes, { nombre: "", firma: "" }]);

    const agregarAcuerdo = () =>
        setAcuerdos([
            ...acuerdos,
            { agenda: "", acuerdo: "", responsable: "", fecha_compromiso: "" },
        ]);

    const actualizarAsistente = (i, campo, valor) => {
        const copia = [...asistentes];
        copia[i][campo] = valor;
        setAsistentes(copia);
    };

    const actualizarAcuerdo = (i, campo, valor) => {
        const copia = [...acuerdos];
        copia[i][campo] = valor;
        setAcuerdos(copia);
    };

    const eliminarAsistente = (i) =>
        setAsistentes(asistentes.filter((_, idx) => idx !== i));

    const eliminarAcuerdo = (i) =>
        setAcuerdos(acuerdos.filter((_, idx) => idx !== i));

    // --- Pickers ---
    const onChangeFecha = (event, selectedDate) => {
        setMostrarFecha(Platform.OS === "ios");
        if (selectedDate) setFecha(selectedDate);
    };

    const onChangeHora = (event, selectedDate) => {
        setMostrarHora(Platform.OS === "ios");
        if (selectedDate) setHora(selectedDate);
    };

    const onChangeFechaCompromiso = (event, selectedDate) => {
        const index = mostrarFechaCompromiso;
        setMostrarFechaCompromiso(null);
        if (selectedDate && index !== null) {
            setFechaCompromiso({ ...fechaCompromiso, [index]: selectedDate });
            actualizarAcuerdo(index, "fecha_compromiso", formatearFecha(selectedDate));
        }
    };

    // --- Construir datos ---
    const construirDatos = () => ({
        fecha: formatearFecha(fecha),
        hora: formatearHora(hora),
        area_carrera: area.trim(),
        asunto: asunto.trim(),
        asistentes: asistentes.filter((a) => a.nombre.trim()),
        acuerdos: acuerdos
            .filter((a) => a.agenda.trim() || a.acuerdo.trim())
            .map((a) => ({
                agenda: a.agenda.trim(),
                acuerdo: a.acuerdo.trim(),
                responsable: a.responsable.trim(),
                fecha_compromiso: a.fecha_compromiso.trim(),
            })),
    });

    // --- Guardar ---
    const handleGuardar = async () => {
        if (!asunto.trim()) {
            Alert.alert("Error", "El asunto es obligatorio");
            return;
        }

        if (!user || !user._id) {
            Alert.alert(
                "Sesión expirada",
                "Vuelve a iniciar sesión para guardar la minuta."
            );
            return;
        }

        const datos = {
            ...construirDatos(),
            usuario_id: user._id,
        };

        console.log("Datos a enviar:", JSON.stringify(datos, null, 2));

        const result = await minutasAPI.crearMinuta(datos);
        console.log("Respuesta backend:", JSON.stringify(result));

        if (result.exito) {
            Alert.alert("Éxito", "Minuta guardada correctamente");
            navigation.navigate("MisMinutas");
            return;
        }

        await agregarMinutaLocal(datos);
        Alert.alert(
            "Guardado local",
            "No se pudo conectar con el servidor. La minuta se guardó en el dispositivo."
        );
        navigation.navigate("MisMinutas");
    };

    const handleImprimir = async () => {
        if (!asunto.trim()) {
            Alert.alert("Error", "Completa el asunto antes de imprimir");
            return;
        }

        const datos = {
            ...construirDatos(),
            usuario_nombre: user?.nombre,   // 
        };

        try {
            await exportarPDFyCompartir(datos);
        } catch (e) {
            Alert.alert("Error", "No se pudo generar el PDF");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.titleRow}>
                <Icon name="document-text-outline" size={24} color="#667eea" />
                <Text style={styles.titulo}>Nueva Minuta</Text>
            </View>
            <Text style={styles.subtitulo}>Formato oficial 2-R-COM-04</Text>

            <Text style={styles.seccion}>INFORMACIÓN GENERAL</Text>

            {/* Fecha con calendario nativo */}
            <Text style={styles.label}>Fecha *</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setMostrarFecha(true)}
            >
                <Icon name="calendar-outline" size={18} color="#667eea" />
                <Text style={styles.pickerText}>{formatearFechaVista(fecha)}</Text>
                <Icon name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {mostrarFecha && (
                <DateTimePicker
                    value={fecha}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeFecha}
                />
            )}

            {/* Hora con reloj nativo */}
            <Text style={styles.label}>Hora</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setMostrarHora(true)}
            >
                <Icon name="time-outline" size={18} color="#667eea" />
                <Text style={styles.pickerText}>{formatearHora(hora)}</Text>
                <Icon name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {mostrarHora && (
                <DateTimePicker
                    value={hora}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    is24Hour={true}
                    onChange={onChangeHora}
                />
            )}

            <Text style={styles.label}>Área o Carrera</Text>
            <TextInput
                style={styles.input}
                value={area}
                onChangeText={setArea}
                placeholder="Ej. Ing. en Desarrollo de Software"
            />

            <Text style={styles.label}>Asunto *</Text>
            <TextInput
                style={styles.input}
                value={asunto}
                onChangeText={setAsunto}
                placeholder="Tema principal"
            />

            {/* Asistentes */}
            <View style={styles.seccionHeader}>
                <View style={styles.seccionTitleRow}>
                    <Icon name="people-outline" size={16} color="#667eea" />
                    <Text style={styles.seccion}>ASISTENTES</Text>
                </View>
                <TouchableOpacity style={styles.btnAgregar} onPress={agregarAsistente}>
                    <Icon name="add" size={14} color="#fff" />
                    <Text style={styles.btnAgregarText}>Agregar</Text>
                </TouchableOpacity>
            </View>

            {asistentes.map((a, i) => (
                <View key={i} style={styles.item}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemTitulo}>Asistente #{i + 1}</Text>
                        <TouchableOpacity onPress={() => eliminarAsistente(i)}>
                            <Icon name="close-circle-outline" size={20} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre"
                        value={a.nombre}
                        onChangeText={(v) => actualizarAsistente(i, "nombre", v)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Firma"
                        value={a.firma}
                        onChangeText={(v) => actualizarAsistente(i, "firma", v)}
                    />
                </View>
            ))}

            {/* Acuerdos */}
            <View style={styles.seccionHeader}>
                <View style={styles.seccionTitleRow}>
                    <Icon name="list-outline" size={16} color="#667eea" />
                    <Text style={styles.seccion}>AGENDA Y ACUERDOS</Text>
                </View>
                <TouchableOpacity style={styles.btnAgregar} onPress={agregarAcuerdo}>
                    <Icon name="add" size={14} color="#fff" />
                    <Text style={styles.btnAgregarText}>Agregar</Text>
                </TouchableOpacity>
            </View>

            {acuerdos.map((a, i) => (
                <View key={i} style={styles.item}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemTitulo}>Acuerdo #{i + 1}</Text>
                        <TouchableOpacity onPress={() => eliminarAcuerdo(i)}>
                            <Icon name="close-circle-outline" size={20} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Agenda"
                        value={a.agenda}
                        onChangeText={(v) => actualizarAcuerdo(i, "agenda", v)}
                    />
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Acuerdo"
                        multiline
                        value={a.acuerdo}
                        onChangeText={(v) => actualizarAcuerdo(i, "acuerdo", v)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Responsable"
                        value={a.responsable}
                        onChangeText={(v) => actualizarAcuerdo(i, "responsable", v)}
                    />

                    {/* Fecha compromiso con calendario nativo */}
                    <Text style={styles.label}>Fecha compromiso</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setMostrarFechaCompromiso(i)}
                    >
                        <Icon name="calendar-outline" size={18} color="#667eea" />
                        <Text style={styles.pickerText}>
                            {fechaCompromiso[i]
                                ? formatearFechaVista(fechaCompromiso[i])
                                : a.fecha_compromiso || "Seleccionar fecha"}
                        </Text>
                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                    </TouchableOpacity>

                    {mostrarFechaCompromiso === i && (
                        <DateTimePicker
                            value={fechaCompromiso[i] || new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onChangeFechaCompromiso}
                        />
                    )}
                </View>
            ))}

            <View style={styles.botones}>
                <TouchableOpacity style={styles.btnPdf} onPress={handleImprimir}>
                    <Icon name="document-outline" size={18} color="#fff" />
                    <Text style={styles.btnPdfText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
                    <Icon name="save-outline" size={18} color="#fff" />
                    <Text style={styles.btnGuardarText}>Guardar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    titulo: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
    subtitulo: { fontSize: 13, color: "#64748b", marginBottom: 16, marginTop: 2 },
    seccion: {
        fontSize: 12,
        fontWeight: "700",
        color: "#667eea",
        letterSpacing: 0.5,
    },
    seccionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 8,
    },
    seccionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        marginBottom: 10,
    },
    textarea: { minHeight: 60, textAlignVertical: "top" },

    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    pickerText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "600",
    },

    btnAgregar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#667eea",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    btnAgregarText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    item: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    itemTitulo: {
        fontSize: 11,
        color: "#94a3b8",
        fontWeight: "700",
        textTransform: "uppercase",
    },
    botones: { flexDirection: "row", gap: 10, marginVertical: 20 },
    btnPdf: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#0ea5e9",
        paddingVertical: 12,
        borderRadius: 10,
    },
    btnPdfText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    btnGuardar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#667eea",
        paddingVertical: 12,
        borderRadius: 10,
    },
    btnGuardarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});