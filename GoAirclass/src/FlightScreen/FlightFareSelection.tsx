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
  ActivityIndicator,
  Modal,
  InteractionManager,
  Alert,
} from 'react-native';
import { flightService } from '../api/flightService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface FlightFareSelectionProps {
  onClose: () => void;
  onContinue?: (option?: any, sessionId?: string) => void;
  searchResults?: any;
  selectedFlight?: any;
}

export interface FareOption {
  id: string;
  type: string;
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
  cancelRules?: any[];
  dateChangeRules?: any[];
}

export default function FlightFareSelection({ onClose, onContinue, searchResults, selectedFlight }: FlightFareSelectionProps) {
  const [fareOptions, setFareOptions] = useState<FareOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FareOption | null>(null);
  const [searchIntentString, setSearchIntentString] = useState<string>('Select fare');
  const [loadingBenefits, setLoadingBenefits] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    // Generate fares based on searchResults and selectedFlight
    const data = searchResults?.data || {};
      const faresMap = data.fares || {};
      const initialBenefitsMap = data.benefits || {};
      const initialBaggageMap = data.baggageAllowances || {};
      const initialPenaltiesMap = data.penalties || {};
      const searchIntentMap = data.searchIntent || {};

      const firstIntent = Object.values(searchIntentMap)[0] as any;
      if (firstIntent) {
        setSearchIntentString(`Select fare for ${firstIntent.origin} → ${firstIntent.destination} | ${firstIntent.departDate}`);
      }

      let fareKeys = Object.keys(faresMap).slice(0, 3); // Fallback to first 3

      // If we have a specific flight ID, try to find fares that match its travel options
      if (selectedFlight && selectedFlight.id) {
        const flightId = String(selectedFlight.id);
        const matching = Object.keys(faresMap).filter(k => {
          const fare = faresMap[k];
          let fareFlightId = '';
          try {
            fareFlightId = fare.subTravelOptionFare[0].flightFare.map((f: any) => f.flightId).join('__');
          } catch (e) { }
          return fareFlightId === flightId;
        });

        if (matching.length > 0) {
          fareKeys = matching;
        }
      }

      if (fareKeys.length === 0) return;

      const generateFares = (benefitsMap: any, baggageMap: any, penaltiesMap: any, currentFaresMap: any) => {
        return fareKeys.map((key, index) => {
          const originalFare = faresMap[key] || {};
          const newFare = currentFaresMap[key] || {};
          const fare = { ...originalFare, ...newFare };

          let cabinBag = '7 KG Cabin, 1 Pc';
          let checkInBag = '15 KG Check-in, 1 Pc';

          try {
            let bagArr: any[] = [];

            // Try new API format
            if (fare.subTravelOptionBenefits) {
              const travelOption = Object.values(fare.subTravelOptionBenefits)[0] as any;
              const flightBens = travelOption?.benefits?.flightBenefits;
              if (flightBens) {
                const firstFlight = Object.values(flightBens)[0] as any;
                const bagId = firstFlight?.baggageAllowances?.[0]?.baggageAllowanceId;
                if (bagId) bagArr = baggageMap[bagId] || [];
              }
            }

            // Fallback to old format
            if (bagArr.length === 0 && fare.subTravelOptionFare) {
              const bagId = fare.subTravelOptionFare[0].flightFare[0].baggageAllowances[0].baggageAllowanceId;
              if (bagId) bagArr = baggageMap[bagId] || [];
            }

            const cabinInfo = bagArr.find((b: any) => b.type === 'BAGGAGE_CABIN');
            const checkinInfo = bagArr.find((b: any) => b.type === 'BAGGAGE_CHECK_IN');

            if (cabinInfo && cabinInfo.allowedBaggages?.length > 0) {
              cabinBag = `${cabinInfo.allowedBaggages[0].quantity} ${cabinInfo.allowedBaggages[0].unit} Cabin, ${cabinInfo.allowedBaggages[0].piece} Pc`;
            }
            if (checkinInfo && checkinInfo.allowedBaggages?.length > 0) {
              checkInBag = `${checkinInfo.allowedBaggages[0].quantity} ${checkinInfo.allowedBaggages[0].unit} Check-in, ${checkinInfo.allowedBaggages[0].piece} Pc`;
            }
          } catch (e) { }

          let seatText = 'Paid Seat';
          let mealText = 'Paid Meal';
          let refundText = 'Cancellation fee from ₹4899';
          let dateChangeText = 'Date change fee from ₹2999';

          let benefitIds: string[] = [];
          let penaltyIds: string[] = [];

          if (fare.subTravelOptionBenefits) {
            const travelOption = Object.values(fare.subTravelOptionBenefits)[0] as any;
            if (travelOption?.benefits) {
              benefitIds = travelOption.benefits.benefitIds || [];
              penaltyIds = travelOption.benefits.penaltyIds || [];
            }
          } else {
            benefitIds = fare.benefitIds || [];
            penaltyIds = fare.penaltyIds || [];
          }

          benefitIds.forEach((bId: string) => {
            const b = benefitsMap[bId];
            if (!b) return;

            if (b.benefitType === 'SEAT') {
              seatText = b.shortDescription || b.description || 'Free Seat';
            }
            if (b.benefitType === 'MEAL') {
              mealText = b.shortDescription || b.description || 'Free Meal';
            }
            if (b.benefitType === 'FARE_RULE') {
              if (b.description?.includes('REFUND')) refundText = b.description;
              if (b.description?.includes('AMEND')) dateChangeText = b.description;
            }
          });

          let cancelRules: any[] = [];
          let dateChangeRules: any[] = [];

          penaltyIds.forEach((pId: string) => {
            const p = penaltiesMap[pId];
            if (!p) return;

            if (p.penaltyType === 'CANCEL') {
              cancelRules = p.timeLines || [];
            }
            if (p.penaltyType === 'AMEND_SAME_FARE' || p.penaltyType === 'AMEND_HIGHER_FARE') {
              const prefix = p.penaltyType === 'AMEND_SAME_FARE' ? 'Same Fare' : 'Higher Fare';
              const mappedLines = (p.timeLines || []).map((tl: any) => ({ ...tl, typePrefix: prefix }));
              dateChangeRules = [...dateChangeRules, ...mappedLines];
            }

            try {
              // Find lowest available charge
              let amount: number | undefined;
              for (const timeLine of p.timeLines || []) {
                const charge = timeLine?.passengerFareRuleCharges?.ADT?.charges?.[0]?.amount;
                if (charge !== undefined && charge > 0 && (amount === undefined || charge < amount)) {
                  amount = charge;
                }
              }
              if (amount !== undefined) {
                if (p.penaltyType === 'CANCEL') refundText = `Cancellation fee from ₹${amount}`;
                if (p.penaltyType === 'AMEND_SAME_FARE' || p.penaltyType === 'AMEND_HIGHER_FARE') dateChangeText = `Date change fee from ₹${amount}`;
              }
            } catch (e) { }
          });

          const priceVal = fare.pricing?.totalPrice || 0;
          const price = `₹${priceVal.toLocaleString('en-IN')}`;

          let brandName = fare.fareCategory || 'FARE';
          try {
            const apiBrand = fare.subTravelOptionFare[0].flightFare[0].identifiers.brandName;
            if (apiBrand) brandName = apiBrand;
          } catch (e) { }

          let promoCodeText = '';
          if (fare.pricing?.discount && fare.pricing.discount > 0) {
            promoCodeText = `₹${fare.pricing.discount} off applied`;
          }

          return {
            id: key,
            type: brandName.toUpperCase(),
            price: price,
            promoCodeText: promoCodeText,
            cancellationText: refundText,
            dateChangeText: dateChangeText,
            mealText: mealText,
            seatText: seatText,
            cabinBaggage: cabinBag,
            checkInBaggage: checkInBag,
            gradient: false,
            benefitText: undefined,
            cancelRules,
            dateChangeRules,
          };
        });
      };

      const initialFares = generateFares(initialBenefitsMap, initialBaggageMap, initialPenaltiesMap, faresMap);
      setFareOptions(initialFares);
      setSelectedOption(initialFares[0]);

      const fetchBenefits = async () => {
        const dataId = data.dataId || data.searchId;
        if (!dataId || fareKeys.length === 0) return;

        try {
          setLoadingBenefits(true);
          const searchId = data.searchId || dataId;
          
          const response = await flightService.getBulkBenefits({
            dataId: dataId,
            fareIds: fareKeys,
            searchId: searchId
          });

          // Create session AFTER bulk benefits
          try {
            const sessionRes = await flightService.createSession(searchId);
            const extractedSessionId = sessionRes?.data?.sessionId || sessionRes?.data?.data?.sessionId || sessionRes?.sessionId;
            if (extractedSessionId) {
              setSessionId(extractedSessionId);
            }
          } catch (e) {
            console.warn('Failed to create session', e);
          }

          if (response?.data) {
            const apiData = response.data.data || response.data;
            const apiBenefits = apiData.benefits || {};
            const apiBaggage = apiData.baggageAllowances || {};
            const apiPenalties = apiData.penalties || {};
            const apiFares = apiData.fares || {};

            const updatedFares = generateFares(
              { ...initialBenefitsMap, ...apiBenefits },
              { ...initialBaggageMap, ...apiBaggage },
              { ...initialPenaltiesMap, ...apiPenalties },
              { ...faresMap, ...apiFares }
            );
            setFareOptions(updatedFares);
            setSelectedOption(prev => updatedFares.find(f => f.id === prev?.id) || updatedFares[0]);
          }
        } catch (err) {
          console.error('Error fetching bulk benefits:', err);
        } finally {
          setLoadingBenefits(false);
        }
      };

      fetchBenefits();
  }, [searchResults, selectedFlight]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  }, [slideAnim, fadeAnim]);

  const [rulesModalVisible, setRulesModalVisible] = useState(false);
  const [selectedRulesOption, setSelectedRulesOption] = useState<any>(null);

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

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleContinue = async () => {
    const data = searchResults?.data?.dataId ? searchResults.data : (searchResults?.dataId ? searchResults : (searchResults?.data || {}));
    const searchId = data.searchId || data.dataId;

    let currentSessionId = sessionId;
    if (!currentSessionId && searchId) {
      try {
        const sRes = await flightService.createSession(searchId);
        currentSessionId = sRes?.data?.sessionId || sRes?.data?.data?.sessionId || sRes?.sessionId;
        if (currentSessionId) setSessionId(currentSessionId);
      } catch (sErr) {
        console.warn('Fallback session creation failed:', sErr);
      }
    }

    if (onContinue) {
      onContinue(selectedOption, currentSessionId);
    } else {
      handleClose();
    }
  };

  const formatDuration = (ptString: string) => {
    if (!ptString) return '';
    let s = ptString.replace('PT', '');
    if (s === '0S') return '0 Hours';
    s = s.replace('S', ' Seconds').replace('H', ' Hours');
    return s;
  };

  const renderTimelineRow = (timeline: any, index: number) => {
    const start = formatDuration(timeline.startTime);
    const end = formatDuration(timeline.endTime);
    const amount = timeline.passengerFareRuleCharges?.ADT?.charges?.[0]?.amount;
    let timeStr = `${start} to ${end}`;
    if (timeline.typePrefix) {
      timeStr = `${timeline.typePrefix}: ${timeStr}`;
    }
    const priceStr = amount !== undefined ? `₹${amount}` : 'N/A';

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }} key={index}>
        <Text style={{ fontSize: 12, color: '#475569', fontFamily: FONT_FAMILY }}>{timeStr}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', fontFamily: FONT_FAMILY }}>{priceStr}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Rules Modal */}
      <Modal visible={rulesModalVisible} transparent={true} animationType="fade" onRequestClose={() => setRulesModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', width: '100%', borderRadius: 16, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY, color: '#0f172a' }}>Detailed Fare Rules</Text>
              <TouchableOpacity onPress={() => setRulesModalVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Text style={{ fontSize: 24, color: '#64748b' }}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedRulesOption?.cancelRules?.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, color: '#ea580c', fontFamily: FONT_FAMILY }}>Cancellation Penalty</Text>
                  <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    {selectedRulesOption.cancelRules.map((t: any, i: number) => renderTimelineRow(t, i))}
                  </View>
                </View>
              )}
              {selectedRulesOption?.dateChangeRules?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, color: '#ea580c', fontFamily: FONT_FAMILY }}>Date Change Penalty</Text>
                  <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    {selectedRulesOption.dateChangeRules.map((t: any, i: number) => renderTimelineRow(t, i))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: Animated.multiply(fadeAnim, 0.5) }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
      </Animated.View>

      <Animated.View style={[styles.modalPanel, { transform: [{ translateY: slideAnim }] }]}>

        {/* Header with Title and Circle Close Button */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{searchIntentString}</Text>
            {loadingBenefits && (
              <ActivityIndicator size="small" color="#E75B49" style={{ marginLeft: 8 }} />
            )}
          </View>
          <TouchableOpacity style={styles.closeBtnCircle} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll options list */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {fareOptions.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#E75B49" />
            </View>
          ) : (
            <>
              {fareOptions.map((option, index) => {
                const isSelected = selectedOption?.id === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      option.gradient && styles.gradientCard
                    ]}
                    onPress={() => setSelectedOption(option)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderRow}>
                      {/* Left info */}
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.optionTypeTitle}>{option.type}</Text>
                        <View style={styles.priceLineRow}>
                          <Text style={styles.priceText}>{option.price}</Text>
                          {option.originalPrice && (
                            <Text style={styles.originalPriceText}>{option.originalPrice}</Text>
                          )}
                        </View>
                        {option.appliedPromo && (
                          <Text style={styles.appliedPromoText}>{option.appliedPromo}</Text>
                        )}
                        {!!option.promoCodeText && (
                          <Text style={styles.promoLabel}>{option.promoCodeText}</Text>
                        )}
                      </View>

                      {/* Right Button */}
                      <TouchableOpacity
                        style={[
                          styles.selectBtn,
                          selectedOption?.id === option.id ? styles.selectBtnActive : styles.selectBtnOutline
                        ]}
                        onPress={() => setSelectedOption(option)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.selectBtnText,
                          selectedOption?.id === option.id ? styles.selectBtnTextActive : styles.selectBtnTextOutline
                        ]}>
                          {selectedOption?.id === option.id ? '✓ Selected' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Grid features info */}
                    <View style={styles.featuresGrid}>
                      <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                          <Text style={styles.yellowCircle}>🔸</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.cancellationText}</Text>
                            {(option.cancelRules?.length ?? 0) > 0 && (
                              <TouchableOpacity onPress={() => { setSelectedRulesOption(option); setRulesModalVisible(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={{ fontSize: 10, color: '#2563eb', marginLeft: 4, fontWeight: '700' }}>View Rules</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <View style={styles.featureItem}>
                          <Text style={styles.yellowCircle}>🔸</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.dateChangeText}</Text>
                            {(option.dateChangeRules?.length ?? 0) > 0 && (
                              <TouchableOpacity onPress={() => { setSelectedRulesOption(option); setRulesModalVisible(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={{ fontSize: 10, color: '#2563eb', marginLeft: 4, fontWeight: '700' }}>View Rules</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                          <Text style={styles.yellowCircle}>🔸</Text>
                          <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.mealText}</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Text style={styles.yellowCircle}>🔸</Text>
                          <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.seatText}</Text>
                        </View>
                      </View>

                      <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                          <Text style={styles.greenCheck}>✓</Text>
                          <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.cabinBaggage}</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Text style={styles.greenCheck}>✓</Text>
                          <Text style={[styles.featureLabel, { flexShrink: 1 }]} numberOfLines={1}>{option.checkInBaggage}</Text>
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
            </>
          )}
        </ScrollView>

        {/* Sticky bottom checkout bar */}
        <View style={styles.checkoutFooter}>
          <View style={styles.checkoutLeft}>
            <Text style={styles.checkoutPrice}>{selectedOption?.price}</Text>
            <Text style={styles.checkoutPromo}>{selectedOption?.promoCodeText}</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.9} disabled={loadingPreview}>
            {loadingPreview ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalPanel: {
    backgroundColor: '#f6f8fb',
    width: '100%',
    height: '85%',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
