// ============================================
// FirmaCanvas.js - Componente de firma simple
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - 80;
const CANVAS_HEIGHT = 200;

export default function FirmaCanvas({ onFirmaChange }) {
  const [points, setPoints] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // PanResponder para dibujar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setIsDrawing(true);
        setCurrentPath([{ x: locationX, y: locationY }]);
        console.log('✏️ Inicio dibujo en:', locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        if (!isDrawing) return;
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (currentPath.length > 1) {
          setPoints(prev => [...prev, currentPath]);
          onFirmaChange && onFirmaChange([...points, currentPath]);
        }
        setIsDrawing(false);
        setCurrentPath([]);
      },
      onPanResponderTerminate: () => {
        if (currentPath.length > 1) {
          setPoints(prev => [...prev, currentPath]);
          onFirmaChange && onFirmaChange([...points, currentPath]);
        }
        setIsDrawing(false);
        setCurrentPath([]);
      },
    })
  ).current;

  const limpiar = () => {
    setPoints([]);
    setCurrentPath([]);
    onFirmaChange && onFirmaChange([]);
  };

  const getFirmaData = () => {
    const allPoints = [...points];
    if (currentPath.length > 1) {
      allPoints.push(currentPath);
    }
    return allPoints;
  };

  return (
    <View style={styles.container}>
      <View
        ref={canvasRef}
        style={styles.canvas}
        {...panResponder.panHandlers}
      >
        {/* Renderizar puntos dibujados */}
        <View style={styles.canvasContent}>
          {points.map((path, pathIndex) => (
            <View key={`path-${pathIndex}`} style={StyleSheet.absoluteFill}>
              {path.map((point, pointIndex) => (
                <View
                  key={`dot-${pathIndex}-${pointIndex}`}
                  style={[
                    styles.dot,
                    {
                      left: point.x - 2,
                      top: point.y - 2,
                    }
                  ]}
                />
              ))}
            </View>
          ))}
          {currentPath.map((point, index) => (
            <View
              key={`current-${index}`}
              style={[
                styles.dot,
                {
                  left: point.x - 2,
                  top: point.y - 2,
                }
              ]}
            />
          ))}
          {points.length === 0 && currentPath.length === 0 && (
            <Text style={styles.placeholder}>Firma aquí</Text>
          )}
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.limpiarButton} onPress={limpiar}>
          <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  canvasContent: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -10 }],
    color: '#cbd5e1',
    fontSize: 14,
    pointerEvents: 'none',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1e293b',
    position: 'absolute',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: CANVAS_WIDTH,
    marginTop: 8,
  },
  limpiarButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#64748b',
  },
});