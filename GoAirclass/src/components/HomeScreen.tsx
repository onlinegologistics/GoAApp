import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  BackHandler,
  Alert,
  Animated,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface HomeScreenProps {
  onSelectFlights: () => void;
  onSelectHotels?: () => void;
}

interface GridItem {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  isFlights?: boolean;
  isHotels?: boolean;
}

export default function HomeScreen({ onSelectFlights, onSelectHotels }: HomeScreenProps) {
  const gridItems: GridItem[] = [
    { id: '1', name: 'Flights', icon: '✈', isFlights: true },
    { id: '2', name: 'Hotels', icon: '🏢', badge: '25% OFF', badgeColor: '#16a34a', badgeBg: '#e8f5e9', isHotels: true },
    { id: '3', name: 'Sightseeing', icon: '🚶', badge: '50%* OFF', badgeColor: '#b45309', badgeBg: '#fffbeb' },
    { id: '4', name: 'Experiences', icon: '🏖', badge: '50%* OFF', badgeColor: '#b45309', badgeBg: '#fffbeb' },
    { id: '5', name: 'Shop', icon: '🛒', badge: '40%* OFF', badgeColor: '#16a34a', badgeBg: '#e8f5e9' },
    { id: '6', name: 'Cabs', icon: '🚕', badge: 'NEW', badgeColor: '#0284c7', badgeBg: '#e0f2fe' },
    { id: '7', name: 'Gift Cards', icon: '🎁', badge: 'BETA', badgeColor: '#0284c7', badgeBg: '#e0f2fe' },
    { id: '8', name: 'Lifestyle Partners', icon: '🍽' },
    { id: '9', name: 'Financial Partners', icon: '💳' },
  ];

  const entranceAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entranceAnim, {
        toValue: 0,
        tension: 40,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Are you sure you want to exit GoAirClass?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e6f4fc" />

      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoTextMain}>GoAirClass</Text>
          <View style={styles.logoSymbol}>
            <Text style={styles.logoDots}>⠵✈</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>6E</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.animationWrapper, { transform: [{ translateY: entranceAnim }], opacity: opacityAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Headline Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Hi there, plan your journey{'\n'}
              with ease - <Text style={styles.highlightText}>Flights, Hotels and{'\n'}beyond!</Text>
            </Text>
          </View>

          {/* Services Grid (4 Columns) */}
          <View style={styles.gridContainer}>
            {gridItems.map((item) => {
              const itemContent = (
                <View style={styles.gridItemInner}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                    {item.badge && (
                      <View style={[styles.badgePill, { backgroundColor: item.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: item.badgeColor }]}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridItemLabel} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              );

              if (item.isFlights) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItemCard}
                    onPress={onSelectFlights}
                    activeOpacity={0.7}
                  >
                    {itemContent}
                  </TouchableOpacity>
                );
              }

              if (item.isHotels) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItemCard}
                    onPress={onSelectHotels}
                    activeOpacity={0.7}
                  >
                    {itemContent}
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity key={item.id} style={styles.gridItemCard} activeOpacity={0.8}>
                  {itemContent}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Capsule Card */}
          <TouchableOpacity
            style={styles.oneClickCard}
            onPress={onSelectFlights}
            activeOpacity={0.9}
          >
            <View style={styles.oneClickTextContainer}>
              <Text style={styles.oneClickTitle}>One click away</Text>
              <Text style={styles.oneClickDesc}>Find flights at lowest fare</Text>
            </View>
            <View style={styles.oneClickArrowButton}>
              <Text style={styles.oneClickArrowText}>↗</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  animationWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
    backgroundColor: '#e6f4fc', // soft sky blue background
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextMain: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0b2e66', // IndiGo Dark Blue
    fontFamily: FONT_FAMILY,
  },
  logoSymbol: {
    marginLeft: 6,
  },
  logoDots: {
    fontSize: 16,
    color: '#0b2e66',
    fontWeight: 'bold',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    backgroundColor: '#e6f4fc', // soft sky blue gradient representation
    flexGrow: 1,
  },
  heroSection: {
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 30,
    fontFamily: FONT_FAMILY,
  },
  highlightText: {
    color: '#15803d', // Green highlight
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 40,
  },
  gridItemCard: {
    width: '25%', // 4 columns layout
    alignItems: 'center',
    marginBottom: 24,
  },
  gridItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconText: {
    fontSize: 24,
    color: '#0b2e66',
  },
  gridItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONT_FAMILY,
    height: 32, // Fixed height for 2 lines alignment
  },
  badgePill: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  oneClickCard: {
    backgroundColor: '#ffffff',
    borderRadius: 35, // Oval Capsule shape
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 'auto', // push to bottom of viewport
  },
  oneClickTextContainer: {
    flex: 1,
  },
  oneClickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0b2e66',
    fontFamily: FONT_FAMILY,
  },
  oneClickDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  oneClickArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0b2e66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneClickArrowText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
