// ============================================
// EstadiasScreen - Gestión de estadías (En desarrollo)
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function EstadiasScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Icon name="business-outline" size={22} color="#667eea" /> Estadías
        </Text>
      </View>

      <View style={styles.container}>
        <View style={styles.content}>
          <Icon name="construct-outline" size={80} color="#d1d5db" />
          <Text style={styles.title}>Estadías Profesionales</Text>
          <Text style={styles.subtitle}>
            Esta funcionalidad estará disponible próximamente.
          </Text>
          <Text style={styles.description}>
            Podrás gestionar tus estadías profesionales, registrar horas,
            y hacer seguimiento de tus prácticas.
          </Text>
          <View style={styles.placeholderCard}>
            <Icon name="calendar-outline" size={30} color="#94a3b8" />
            <Text style={styles.placeholderText}>Próximamente</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
    fontWeight: '500',
  },
});