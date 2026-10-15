import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function MinutaCard({ minuta, onVer, onEliminar, onPDF }) {
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

    return (
        <View style={styles.card}>
            <View style={styles.fechaBadge}>
                <Icon name="calendar-outline" size={12} color="#4338ca" />
                <Text style={styles.fechaTexto}>
                    {formatearFecha(minuta.fecha)}
                    {minuta.hora ? ` · ${minuta.hora}` : ""}
                </Text>
            </View>

            <Text style={styles.asunto}>{minuta.asunto}</Text>

            {minuta.area_carrera ? (
                <View style={styles.fila}>
                    <Icon name="school-outline" size={13} color="#64748b" />
                    <Text style={styles.area} numberOfLines={1}>
                        {minuta.area_carrera}
                    </Text>
                </View>
            ) : null}

            <View style={styles.infoRow}>
                <View style={styles.infoChip}>
                    <Icon name="people-outline" size={12} color="#475569" />
                    <Text style={styles.info}>
                        {minuta.total_asistentes ?? minuta.asistentes?.length ?? 0} asistentes
                    </Text>
                </View>
                <View style={styles.infoChip}>
                    <Icon name="checkmark-done-outline" size={12} color="#475569" />
                    <Text style={styles.info}>
                        {minuta.total_acuerdos ?? minuta.acuerdos?.length ?? 0} acuerdos
                    </Text>
                </View>
            </View>

            <View style={styles.acciones}>
                <TouchableOpacity style={[styles.btn, styles.btnVer]} onPress={onVer}>
                    <Icon name="eye-outline" size={14} color="#1d4ed8" />
                    <Text style={styles.btnTextVer}>Ver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnPdf]} onPress={onPDF}>
                    <Icon name="document-text-outline" size={14} color="#4338ca" />
                    <Text style={styles.btnTextPdf}>PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.btnEliminar]}
                    onPress={onEliminar}
                >
                    <Icon name="trash-outline" size={14} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#667eea",
        elevation: 2,
    },
    fechaBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#eef2ff",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    fechaTexto: { color: "#4338ca", fontSize: 12, fontWeight: "600" },
    asunto: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 6,
    },
    fila: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 8,
    },
    area: { fontSize: 13, color: "#64748b", flex: 1 },

    infoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    infoChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    info: {
        fontSize: 12,
        color: "#475569",
    },

    acciones: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 10,
    },
    btn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    btnVer: { backgroundColor: "#dbeafe" },
    btnPdf: { backgroundColor: "#e0e7ff" },
    btnEliminar: { backgroundColor: "#fee2e2" },
    btnTextVer: { color: "#1d4ed8", fontSize: 12, fontWeight: "600" },
    btnTextPdf: { color: "#4338ca", fontSize: 12, fontWeight: "600" },
});