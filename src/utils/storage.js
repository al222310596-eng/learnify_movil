import AsyncStorage from "@react-native-async-storage/async-storage";

const MINUTAS_KEY = "@minutas_local";

// ---- Minutas locales (fallback) ----
export const guardarMinutasLocal = async (minutas) => {
    try {
        await AsyncStorage.setItem(MINUTAS_KEY, JSON.stringify(minutas));
    } catch (e) {
        console.error("Error al guardar minutas local:", e);
    }
};

export const obtenerMinutasLocal = async () => {
    try {
        const data = await AsyncStorage.getItem(MINUTAS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error al leer minutas local:", e);
        return [];
    }
};

export const agregarMinutaLocal = async (minuta) => {
    const minutas = await obtenerMinutasLocal();
    const nueva = {
        ...minuta,
        _id: `local_${Date.now()}`,
        _local: true,
    };
    const actualizadas = [...minutas, nueva];
    await guardarMinutasLocal(actualizadas);
    return nueva;
};

export const eliminarMinutaLocal = async (id) => {
    const minutas = await obtenerMinutasLocal();
    const filtradas = minutas.filter((m) => m._id !== id);
    await guardarMinutasLocal(filtradas);
    return filtradas;
};