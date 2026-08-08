import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface FlightFareSelectionProps {
  onClose: () => void;
  onContinue?: () => void;
}

interface FareOption {
  id: string;
  type: 'RETAIL' | 'CLEARTRIP EXCLUSIVE' | 'SPICE FLEX';
  price: string;
  originalPrice?: string;
  appliedPromo?: string;
  promoCodeText: string;
  cancellationText: string;
  dateChangeText: string;
  mealText: string;
  seatText: string;
  cabinBaggage: string;
  checkInBaggage: string;
  gradient?: boolean;
  benefitText?: string;
}

const FARE_OPTIONS: FareOption[] = [
  {
    id: '1',
    type: 'RETAIL',
    price: '₹6,183',
    promoCodeText: '₹578 off with CTFKSBIC',
    cancellationText: 'Cancellation fee from ₹4899',
    dateChangeText: 'Date change fee from ₹2999',
    mealText: 'Paid Meal',
    seatText: 'Paid Seat',
    cabinBaggage: '7 kg Cabin, 1 Pc',
    checkInBaggage: '15 kg Check-in, 1 Pc',
  },
  {
    id: '2',
    type: 'CLEARTRIP EXCLUSIVE',
    price: '₹5,972',
    originalPrice: '₹6,422',
    appliedPromo: '✓ CTVALUE APPLIED',
    promoCodeText: '₹601 off with CTFKSBIC',
    cancellationText: 'Cancellation fee from ₹4899',
    dateChangeText: 'Date change fee from ₹2999',
    mealText: 'Paid Meal',
    seatText: 'Paid Seat',
    cabinBaggage: '7 kg Cabin, 1 Pc',
    checkInBaggage: '15 kg Check-in, 1 Pc',
    gradient: true,
    benefitText: 'Get benefit worth of ₹239',
  },
  {
    id: '3',
    type: 'SPICE FLEX',
    price: '₹6,603',
    promoCodeText: '₹618 off with CTFKSBIC',
    cancellationText: 'Cancellation fee from ₹4899',
    dateChangeText: 'Date change fee from ₹2999',
    mealText: 'Paid Meal',
    seatText: 'Paid Seat',
    cabinBaggage: '7 kg Cabin, 1 Pc',
    checkInBaggage: '15 kg Check-in, 1 Pc',
  },
];

export default function FlightFareSelection({ onClose, onContinue }: FlightFareSelectionProps) {
  const [selectedOption, setSelectedOption] = useState<FareOption>(FARE_OPTIONS[0]);

  // Slide Animation Ref
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Mount Animation (Slide-Up)
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 35,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Close Animation (Slide-Down)
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.modalPanel, { transform: [{ translateY: slideAnim }] }]}>
        
        {/* Header with Title and Circle Close Button */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Select fare for DEL → BOM</Text>
          <TouchableOpacity style={styles.closeBtnCircle} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll options list */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {FARE_OPTIONS.map((option) => {
            const isSelected = selectedOption.id === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  option.gradient && styles.gradientCard
                ]}
                onPress={() => setSelectedOption(option)}
                activeOpacity={0.9}
              >
                {/* Purple cleartrip exclusive badge */}
                {option.type === 'CLEARTRIP EXCLUSIVE' && (
                  <View style={styles.exclusiveBadge}>
                    <Text style={styles.exclusiveBadgeText}>CLEARTRIP EXCLUSIVE</Text>
                  </View>
                )}

                <View style={styles.cardHeaderRow}>
                  {/* Left info */}
                  <View style={styles.cardHeaderLeft}>
                    {option.type === 'CLEARTRIP EXCLUSIVE' ? (
                      <View style={styles.exclusiveTypeTitleRow}>
                        <Text style={styles.exclusiveSymbol}>💜</Text>
                        <Text style={styles.exclusiveTypeTitle}>Value Max</Text>
                      </View>
                    ) : (
                      <Text style={styles.optionTypeTitle}>{option.type}</Text>
                    )}
                    <View style={styles.priceLineRow}>
                      <Text style={styles.priceText}>{option.price}</Text>
                      {option.originalPrice && (
                        <Text style={styles.originalPriceText}>{option.originalPrice}</Text>
                      )}
                    </View>
                    {option.appliedPromo && (
                      <Text style={styles.appliedPromoText}>{option.appliedPromo}</Text>
                    )}
                    <Text style={styles.promoLabel}>{option.promoCodeText}</Text>
                  </View>

                  {/* Right Button */}
                  <TouchableOpacity
                    style={[
                      styles.selectBtn,
                      isSelected ? styles.selectBtnActive : styles.selectBtnOutline
                    ]}
                    onPress={() => setSelectedOption(option)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.selectBtnText,
                      isSelected ? styles.selectBtnTextActive : styles.selectBtnTextOutline
                    ]}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Grid features info */}
                <View style={styles.featuresGrid}>
                  <View style={styles.featureRow}>
                    <View style={styles.featureItem}>
                      <Text style={styles.yellowCircle}>🔸</Text>
                      <Text style={styles.featureLabel} numberOfLines={1}>{option.cancellationText}</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.yellowCircle}>🔸</Text>
                      <Text style={styles.featureLabel} numberOfLines={1}>{option.dateChangeText}</Text>
                    </View>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={styles.featureItem}>
                      <Text style={styles.yellowCircle}>🔸</Text>
                      <Text style={styles.featureLabel}>{option.mealText}</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.yellowCircle}>🔸</Text>
                      <Text style={styles.featureLabel}>{option.seatText}</Text>
                    </View>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={styles.featureItem}>
                      <Text style={styles.greenCheck}>✓</Text>
                      <Text style={styles.featureLabel}>{option.cabinBaggage}</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.greenCheck}>✓</Text>
                      <Text style={styles.featureLabel}>{option.checkInBaggage}</Text>
                    </View>
                  </View>
                </View>

                {/* Extra Benefit bottom info for Cleartrip Exclusive card */}
                {option.benefitText && (
                  <View style={styles.benefitContainer}>
                    <View style={styles.benefitHeaderRow}>
                      <Text style={styles.greenShield}>🛡️</Text>
                      <Text style={styles.benefitTitleText}>{option.benefitText}</Text>
                    </View>
                    <View style={styles.insurancePill}>
                      <Text style={styles.insurancePillText}>Travel Insurance</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sticky bottom checkout bar */}
        <View style={styles.checkoutFooter}>
          <View style={styles.checkoutLeft}>
            <Text style={styles.checkoutPrice}>{selectedOption.price}</Text>
            <Text style={styles.checkoutPromo}>{selectedOption.promoCodeText}</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed transparent background overlay
  },
  modalPanel: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 60, // push down slightly from very top
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#0f172a',
    borderWidth: 2,
  },
  gradientCard: {
    backgroundColor: '#f0f9ff', // light blue background representing gradient
    borderColor: '#bae6fd',
  },
  exclusiveBadge: {
    position: 'absolute',
    left: 12,
    top: -10,
    backgroundColor: '#6d28d9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
  },
  exclusiveBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  optionTypeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY,
  },
  exclusiveTypeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exclusiveSymbol: {
    fontSize: 11,
    marginRight: 4,
  },
  exclusiveTypeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6d28d9',
    fontFamily: FONT_FAMILY,
  },
  priceLineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  appliedPromoText: {
    fontSize: 10,
    color: '#6d28d9',
    fontWeight: '700',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  promoLabel: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  selectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  selectBtnActive: {
    backgroundColor: '#0f172a',
  },
  selectBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#0f172a',
    backgroundColor: '#ffffff',
  },
  selectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  selectBtnTextActive: {
    color: '#ffffff',
  },
  selectBtnTextOutline: {
    color: '#0f172a',
  },
  featuresGrid: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  yellowCircle: {
    fontSize: 10,
    marginRight: 6,
  },
  greenCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: '#16a34a',
    marginRight: 6,
  },
  featureLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  benefitContainer: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  benefitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenShield: {
    fontSize: 12,
    marginRight: 6,
  },
  benefitTitleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e3a8a',
    fontFamily: FONT_FAMILY,
  },
  insurancePill: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  insurancePillText: {
    fontSize: 8,
    color: '#1e3a8a',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  checkoutLeft: {
    flex: 1,
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  checkoutPromo: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  continueBtn: {
    backgroundColor: '#ea580c', // Bright orange
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  continueBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
});
