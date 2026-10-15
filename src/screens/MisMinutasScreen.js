import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { minutasAPI } from "../api/api";
import { exportarPDFyCompartir } from "../utils/pdf";
import {
    obtenerMinutasLocal,
    guardarMinutasLocal,
    eliminarMinutaLocal,
} from "../utils/storage";
import MinutaCard from "../components/MinutaCard";

export default function MisMinutasScreen({ navigation }) {
    const { user } = useAuth();
    const [minutas, setMinutas] = useState([]);
    const [filtradas, setFiltradas] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);

const cargar = async () => {
    setLoading(true);
    try {
        // Usar el user del contexto (que ya viene de SecureStore)
        console.log("[MisMinutas] user del contexto:", user);

        const usuarioId = user?._id || user?.id || user?.usuario_id;
        console.log("[MisMinutas] ID a enviar:", usuarioId);

        if (!usuarioId) {
            console.warn("[MisMinutas] No hay ID de usuario, usando solo local");
            const locales = await obtenerMinutasLocal();
            setMinutas(locales);
            setFiltradas(locales);
            setLoading(false);
            return;
        }

        console.log("[MisMinutas] Llamando getMinutas con ID:", usuarioId);
        const result = await minutasAPI.getMinutas(usuarioId);
        console.log("[MisMinutas] Respuesta:", result);

        if (result.exito && result.minutas) {
            console.log(`[MisMinutas] ${result.minutas.length} minutas del backend`);
            setMinutas(result.minutas);
            setFiltradas(result.minutas);
            await guardarMinutasLocal(result.minutas);
        } else {
            console.warn("[MisMinutas] Backend no exitoso, usando local");
            const locales = await obtenerMinutasLocal();
            setMinutas(locales);
            setFiltradas(locales);
        }
    } catch (e) {
        console.error("[MisMinutas] Error:", e);
        const locales = await obtenerMinutasLocal();
        setMinutas(locales);
        setFiltradas(locales);
    }
    setLoading(false);
};

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", cargar);
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const q = busqueda.toLowerCase().trim();
        if (!q) {
            setFiltradas(minutas);
        } else {
            setFiltradas(
                minutas.filter(
                    (m) =>
                        (m.asunto || "").toLowerCase().includes(q) ||
                        (m.area_carrera || "").toLowerCase().includes(q)
                )
            );
        }
    }, [busqueda, minutas]);

    const handleEliminar = (id) => {
        Alert.alert(
            "Eliminar minuta",
            "¿Estás seguro? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        if (String(id).startsWith("local_")) {
                            await eliminarMinutaLocal(id);
                        } else {
                            await minutasAPI.eliminarMinuta(id);
                            await eliminarMinutaLocal(id);
                        }
                        cargar();
                    },
                },
            ]
        );
    };

    const handlePDF = async (minuta) => {
        try {
            await exportarPDFyCompartir(minuta);
        } catch (e) {
            console.error("❌ Error PDF:", e);
            Alert.alert("Error", "No se pudo generar el PDF");
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Cargando minutas...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Icon name="document-text-outline" size={22} color="#667eea" />
                    <Text style={styles.titulo}>Mis Minutas</Text>
                </View>
                <TouchableOpacity
                    style={styles.btnNueva}
                    onPress={() => navigation.navigate("CrearMinuta")}
                >
                    <Text style={styles.btnNuevaText}>+ Nueva</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buscador}>
                <Icon name="search-outline" size={18} color="#94a3b8" />
                <TextInput
                    style={styles.input}
                    placeholder="Buscar por asunto o área..."
                    placeholderTextColor="#94a3b8"
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
            </View>

            {filtradas.length === 0 ? (
                <View style={styles.vacio}>
                    <Icon name="folder-open-outline" size={60} color="#cbd5e1" />
                    <Text style={styles.vacioText}>No hay minutas todavía</Text>
                    <TouchableOpacity
                        style={styles.btnPrimario}
                        onPress={() => navigation.navigate("CrearMinuta")}
                    >
                        <Text style={styles.btnPrimarioText}>Crear primera minuta</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtradas}
                    keyExtractor={(item) => item._id?.toString() || String(Math.random())}
                    renderItem={({ item }) => (
                        <MinutaCard
                            minuta={item}
                            onVer={() =>
                                navigation.navigate("DetalleMinuta", { minuta: item })
                            }
                            onPDF={() => handlePDF(item)}
                            onEliminar={() => handleEliminar(item._id)}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 30 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 10, color: "#64748b" },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    titulo: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
    btnNueva: {
        backgroundColor: "#667eea",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    btnNuevaText: { color: "#fff", fontWeight: "600", fontSize: 14 },

    buscador: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: "#1e293b",
    },

    vacio: { flex: 1, justifyContent: "center", alignItems: "center" },
    vacioText: {
        fontSize: 16,
        color: "#64748b",
        marginTop: 12,
        marginBottom: 20,
    },
    btnPrimario: {
        backgroundColor: "#667eea",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    btnPrimarioText: { color: "#fff", fontWeight: "600" },
});