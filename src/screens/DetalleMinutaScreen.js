import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { minutasAPI } from "../api/api";

export default function DetalleMinutaScreen({ route, navigation }) {
    const { minuta: minutaParam } = route.params || {};

    const [minuta, setMinuta] = useState(minutaParam || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                const id = minutaParam?._id;
                console.log("[DetalleMinuta] Param minuta:", minutaParam);
                console.log("[DetalleMinuta] ID a consultar:", id);

                if (!id) {
                    console.warn("[DetalleMinuta] Sin ID, no se puede cargar");
                    setLoading(false);
                    return;
                }

                const res = await minutasAPI.getDetalleMinuta(id);
                console.log(
                    "[DetalleMinuta] Respuesta del backend:",
                    JSON.stringify(res, null, 2)
                );

                if (res.exito && res.minuta) {
                    console.log(
                        "[DetalleMinuta] asistentes:",
                        res.minuta.asistentes
                    );
                    console.log(
                        "[DetalleMinuta] acuerdos:",
                        res.minuta.acuerdos
                    );
                    setMinuta(res.minuta);
                } else {
                    // Fallback: mantener lo que vino por params
                    console.warn("[DetalleMinuta] Backend sin exito, uso params");
                }
            } catch (e) {
                console.error("[DetalleMinuta] Error:", e);
            } finally {
                setLoading(false);
            }
        };

        cargarDetalle();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalle de Minuta</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Cargando detalle...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!minuta) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalle de Minuta</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.error}>No hay minuta para mostrar</Text>
            </SafeAreaView>
        );
    }

    // Normalizar arrays (por si el backend no los trae)
    const asistentes = Array.isArray(minuta.asistentes)
        ? minuta.asistentes
        : [];
    const acuerdos = Array.isArray(minuta.acuerdos) ? minuta.acuerdos : [];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Minuta</Text>
                <TouchableOpacity
                    style={styles.btnCerrar}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="close" size={18} color="#fff" />
                    <Text style={styles.btnCerrarText}>Cerrar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Card 1: Información general */}
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha:</Text>
                        <Text style={styles.infoValue}>
                            {minuta.fecha} {minuta.hora ? `· ${minuta.hora}` : ""}
                        </Text>
                    </View>

                    {minuta.area_carrera ? (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Área:</Text>
                            <Text style={styles.infoValue}>
                                {minuta.area_carrera}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Asunto:</Text>
                        <Text style={styles.infoValue}>{minuta.asunto}</Text>
                    </View>
                </View>

                {/* Card 2: Asistentes */}
                <Text style={styles.sectionTitle}>
                    Asistentes ({asistentes.length})
                </Text>
                <View style={styles.card}>
                    {asistentes.length === 0 ? (
                        <Text style={styles.empty}>Sin asistentes</Text>
                    ) : (
                        asistentes.map((a, i) => (
                            <View key={i} style={styles.asistenteRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.asistenteNombre}>
                                    {a.nombre || "Sin nombre"}
                                </Text>
                                {a.firma ? (
                                    <Text style={styles.asistenteFirma}>
                                        ({a.firma})
                                    </Text>
                                ) : null}
                            </View>
                        ))
                    )}
                </View>

                {/* Card 3: Acuerdos */}
                <Text style={styles.sectionTitle}>
                    Acuerdos ({acuerdos.length})
                </Text>
                {acuerdos.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.empty}>Sin acuerdos</Text>
                    </View>
                ) : (
                    acuerdos.map((a, i) => (
                        <View key={i} style={styles.acuerdoCard}>
                            <View style={styles.acuerdoHeader}>
                                <Text style={styles.acuerdoNum}>
                                    Acuerdo #{i + 1}
                                </Text>
                            </View>

                            <View style={styles.acuerdoRow}>
                                <Text style={styles.acuerdoLabel}>Agenda:</Text>
                                <Text style={styles.acuerdoValue}>
                                    {a.agenda || "—"}
                                </Text>
                            </View>

                            <View style={styles.acuerdoRow}>
                                <Text style={styles.acuerdoLabel}>Acuerdo:</Text>
                                <Text style={styles.acuerdoValue}>
                                    {a.acuerdo || "—"}
                                </Text>
                            </View>

                            {a.responsable ? (
                                <View style={styles.acuerdoRow}>
                                    <Text style={styles.acuerdoLabel}>
                                        Responsable:
                                    </Text>
                                    <Text style={styles.acuerdoValue}>
                                        {a.responsable}
                                    </Text>
                                </View>
                            ) : null}

                            {a.fecha_compromiso ? (
                                <View style={styles.acuerdoRow}>
                                    <Text style={styles.acuerdoLabel}>
                                        Fecha compromiso:
                                    </Text>
                                    <Text style={styles.acuerdoValue}>
                                        {a.fecha_compromiso}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 10, color: "#64748b" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: "bold",
        color: "#1e293b",
        marginLeft: 12,
    },
    btnCerrar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#dc2626",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    btnCerrarText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    content: { padding: 16 },

    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    infoRow: { marginBottom: 8 },
    infoLabel: { fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
    infoValue: { fontSize: 14, color: "#334155" },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#667eea",
        marginBottom: 8,
        marginTop: 4,
    },
    empty: { fontSize: 14, color: "#94a3b8", fontStyle: "italic" },

    asistenteRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
    bullet: { fontSize: 16, color: "#667eea", marginRight: 8 },
    asistenteNombre: { fontSize: 14, color: "#1e293b", fontWeight: "500" },
    asistenteFirma: { fontSize: 13, color: "#94a3b8", marginLeft: 6 },

    acuerdoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderLeftWidth: 4,
        borderLeftColor: "#667eea",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    acuerdoHeader: { marginBottom: 8 },
    acuerdoNum: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    acuerdoRow: { flexDirection: "row", marginBottom: 6 },
    acuerdoLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#667eea",
        width: 110,
    },
    acuerdoValue: { flex: 1, fontSize: 13, color: "#1e293b" },

    error: { padding: 20, color: "red", textAlign: "center" },
});