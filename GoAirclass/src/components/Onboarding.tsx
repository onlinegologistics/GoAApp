import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import OnboardingImage from '../assets/onboarding_bg.jpg';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(1.15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30, // lower tension for a smooth glide landing path
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleStart = () => {
    onComplete();
  };

  const handleClose = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {/* Animated full-screen background image */}
      <Animated.Image
        source={OnboardingImage}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
        resizeMode="cover"
      />

      {/* Close Button at top-right */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Content area overlay */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.title}>
          Welcome to <Text style={styles.titleHighlight}>GOairclass</Text>
        </Text>
        <Text style={styles.description}>
          Find the best flight deals instantly and travel without hassle
        </Text>
      </Animated.View>

      {/* Footer Area with Action Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Action Pill Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Get Started</Text>
          <View style={styles.buttonBadge}>
            <Text style={styles.badgeIcon}>✈</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleHighlight: {
    color: '#074ca6', // matching blue theme color
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: '#074ca6',
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingRight: 8,
    shadowColor: '#074ca6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    color: '#074ca6',
    fontSize: 20,
    fontWeight: 'bold',
    transform: [{ rotate: '45deg' }],
  },
});
