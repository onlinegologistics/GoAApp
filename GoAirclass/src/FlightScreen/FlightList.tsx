import React, { useState, useEffect, useRef } from 'react';
import {
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

interface FlightListProps {
  onBack: () => void;
  onSelectFlight: () => void;
}

interface FlightListing {
  id: string;
  airline: string;
  code: string;
  depTime: string;
  arrTime: string;
  duration: string;
  stops: string;
  price: string;
  promoCodeText: string;
  logoBg: string;
  logoChar: string;
}

const FLIGHT_LISTINGS: FlightListing[] = [
  {
    id: '1',
    airline: 'Akasa Air',
    code: 'QP-1940',
    depTime: '14:10',
    arrTime: '16:20',
    duration: '02h 10m',
    stops: 'Non stop',
    price: '₹6,040',
    promoCodeText: '₹565 off with CTFKSBIC',
    logoBg: '#ff6600',
    logoChar: 'A',
  },
  {
    id: '2',
    airline: 'IndiGo',
    code: '6E-5198',
    depTime: '14:35',
    arrTime: '16:45',
    duration: '02h 10m',
    stops: 'Non stop',
    price: '₹6,040',
    promoCodeText: '₹565 off with CTFKSBIC',
    logoBg: '#0b2e66',
    logoChar: 'I',
  },
  {
    id: '3',
    airline: 'Akasa Air',
    code: 'QP-1942',
    depTime: '21:05',
    arrTime: '23:20',
    duration: '02h 15m',
    stops: 'Non stop',
    price: '₹6,040',
    promoCodeText: '₹565 off with CTFKSBIC',
    logoBg: '#ff6600',
    logoChar: 'A',
  },
  {
    id: '4',
    airline: 'Air India Express',
    code: 'IX-1395',
    depTime: '19:15',
    arrTime: '21:40',
    duration: '02h 25m',
    stops: 'Non stop',
    price: '₹6,140',
    promoCodeText: '₹574 off with CTFKSBIC',
    logoBg: '#e11d48',
    logoChar: 'IX',
  },
];

const PencilIcon = () => (
  <View style={styles.pencilWrapper}>
    <View style={styles.pencilBody} />
    <View style={styles.pencilUnderline} />
  </View>
);

const CalendarIcon = () => (
  <View style={styles.calendarWrapper}>
    <View style={styles.calendarRingsRow}>
      <View style={styles.calendarRing} />
      <View style={styles.calendarRing} />
    </View>
    <View style={styles.calendarBody}>
      <View style={styles.calendarHeaderLine} />
      <View style={styles.calendarGrid}>
        <View style={styles.calendarRow}>
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
        </View>
        <View style={styles.calendarRow}>
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
        </View>
      </View>
    </View>
  </View>
);

interface DateChip {
  day: string;
  date: string;
  price: string;
  isCheap?: boolean;
}

const DATE_CHIPS: DateChip[] = [
  { day: 'Fri', date: '7 Aug', price: '₹6,183' },
  { day: 'Sat', date: '8 Aug', price: '₹6,079', isCheap: true },
  { day: 'Sun', date: '9 Aug', price: '₹6,183' },
  { day: 'Mon', date: '10 Aug', price: '₹6,079', isCheap: true },
];

export default function FlightList({ onBack, onSelectFlight }: FlightListProps) {
  const [selectedDate, setSelectedDate] = useState<string>('Sun, 9 Aug');
  const [activeFilter, setActiveFilter] = useState<string>('Smart Filter');

  // Entrance slide animation
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 45,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animationWrapper, { transform: [{ translateY: slideAnim }] }]}>

        {/* Compact Header Summary Row */}
        <View style={styles.headerWrapper}>
          <View style={styles.searchCapsule}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerMiddle}>
              <Text style={styles.routeTitle}>DEL New Delhi → BOM Mumbai</Text>
              <Text style={styles.routeSubtitle}>09 Aug • 👤 1 • Economy</Text>
            </View>

            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <PencilIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Body */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Horizontal Date Selector Strip */}
          <View style={styles.dateSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {DATE_CHIPS.map((chip) => {
                const key = `${chip.day}, ${chip.date}`;
                const isSelected = selectedDate === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => setSelectedDate(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>
                      {chip.day}, {chip.date}
                    </Text>
                    <Text style={[
                      styles.dateChipPrice,
                      chip.isCheap && styles.cheapPriceText,
                      isSelected && styles.dateChipTextSelected
                    ]}>
                      {chip.price}
                    </Text>
                    {isSelected && <View style={styles.activeUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Calendar Icon Button */}
            <TouchableOpacity style={styles.calendarIconBtn} activeOpacity={0.7}>
              <CalendarIcon />
            </TouchableOpacity>
          </View>

          {/* Filter Pills Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {/* Smart Filter gradient pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                styles.smartFilterPill,
                activeFilter === 'Smart Filter' && styles.smartFilterPillActive
              ]}
              onPress={() => setActiveFilter('Smart Filter')}
              activeOpacity={0.8}
            >
              <Text style={styles.smartFilterPillText}>✨ Smart Filter</Text>
            </TouchableOpacity>

            {[
              { name: 'Sort ▾' },
              { name: 'Filter (2) ▾' },
              { name: 'Non-stop' },
            ].map((pill) => {
              const isSelected = activeFilter === pill.name;
              return (
                <TouchableOpacity
                  key={pill.name}
                  style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                  onPress={() => setActiveFilter(pill.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterPillText}>{pill.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Price Range Advisor Banner Card */}
          <View style={styles.advisorCard}>
            <View style={styles.advisorHeader}>
              <Text style={styles.advisorTitle}>
                Current prices are in the <Text style={styles.higherText}>higher</Text> range
              </Text>
              <Text style={styles.advisorArrow}>▾</Text>
            </View>
            <View style={styles.advisorContent}>
              <Text style={styles.advisorTrendIcon}>📈</Text>
              <Text style={styles.advisorDesc}>
                Prices are likely to increase in the next few days. Book now
              </Text>
            </View>
          </View>

          {/* Listings & In-list Offers */}
          <View style={styles.listingsList}>
            {FLIGHT_LISTINGS.map((flight, idx) => {
              const element = (
                <TouchableOpacity
                  key={flight.id}
                  style={styles.flightCard}
                  onPress={onSelectFlight}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardTopRow}>
                    {/* Left: Brand info */}
                    <View style={styles.brandContainer}>
                      <View style={[styles.brandLogoCircle, { backgroundColor: flight.logoBg }]}>
                        <Text style={styles.logoText}>{flight.logoChar}</Text>
                      </View>
                      <View style={styles.brandTextCol}>
                        <Text style={styles.airlineName}>{flight.airline}</Text>
                        <Text style={styles.flightCode}>{flight.code}</Text>
                      </View>
                    </View>

                    {/* Middle: Timings Timeline */}
                    <View style={styles.timelineContainer}>
                      <Text style={styles.timeValue}>{flight.depTime}</Text>
                      <View style={styles.lineWrapper}>
                        <Text style={styles.durationLabel}>{flight.duration}</Text>
                        <View style={styles.horizontalBar} />
                        <Text style={styles.stopsLabel}>{flight.stops}</Text>
                      </View>
                      <Text style={styles.timeValue}>{flight.arrTime}</Text>
                    </View>

                    {/* Right: Price */}
                    <Text style={styles.priceValue}>{flight.price}</Text>
                  </View>

                  {/* Promo Green Label at bottom right */}
                  <View style={styles.cardPromoRow}>
                    <Text style={styles.promoText}>{flight.promoCodeText}</Text>
                  </View>
                </TouchableOpacity>
              );

              // Render In-list Bank Offers scroll row after the 2nd flight card
              if (idx === 1) {
                return (
                  <View key="combined-block">
                    {element}
                    {/* Horizontal Green Bank Offers Section */}
                    <View style={styles.greenOffersSection}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.greenOffersScroll}>

                        {/* Offer Card 1 */}
                        <View style={styles.bankOfferCard}>
                          <View style={[styles.bankLogoBadge, styles.bankLogoAxis]}>
                            <Text style={styles.bankLogoText}>A</Text>
                          </View>
                          <View style={styles.bankOfferTexts}>
                            <View style={styles.bankOfferHeaderRow}>
                              <Text style={styles.bankOfferTitle}>Flat 12% off</Text>
                              <View style={styles.bankPromoLabel}>
                                <Text style={styles.bankPromoText}>AXISCC</Text>
                              </View>
                            </View>
                            <Text style={styles.bankOfferSub}>with Axis Credit Cards</Text>
                          </View>
                        </View>

                        {/* Offer Card 2 */}
                        <View style={styles.bankOfferCard}>
                          <View style={[styles.bankLogoBadge, styles.bankLogoRbl]}>
                            <Text style={styles.bankLogoText}>R</Text>
                          </View>
                          <View style={styles.bankOfferTexts}>
                            <View style={styles.bankOfferHeaderRow}>
                              <Text style={styles.bankOfferTitle}>Flat 12% off</Text>
                              <View style={styles.bankPromoLabel}>
                                <Text style={styles.bankPromoText}>RBLCC</Text>
                              </View>
                            </View>
                            <Text style={styles.bankOfferSub}>with RBL Credit Cards</Text>
                          </View>
                        </View>

                      </ScrollView>
                    </View>
                  </View>
                );
              }

              return element;
            })}
          </View>

          {/* Accent Blue Bottom Banner */}
          <View style={styles.accentBannerCard}>
            <Text style={styles.accentBannerTitle}>Fly cheaper on a different date?</Text>
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb', // Soft light background
  },
  animationWrapper: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  searchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 22,
    color: '#1e293b',
    fontWeight: 'bold',
    fontFamily: FONT_FAMILY,
  },
  headerMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  routeSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  editButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editIcon: {
    fontSize: 16,
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  dateSelectorContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  dateScroll: {
    paddingLeft: 16,
    paddingVertical: 0,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  dateChipSelected: {
    // Underlined indicator styling below
  },
  dateChipDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  dateChipPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  cheapPriceText: {
    color: '#16a34a', // Green price tag
  },
  dateChipTextSelected: {
    color: '#0f172a',
    fontWeight: '700',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0f172a', // Solid black line matching mockup
  },
  calendarIconBtn: {
    borderLeftWidth: 1,
    borderLeftColor: '#eceff3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarEmoji: {
    fontSize: 16,
  },
  filterPillsScroll: {
    paddingLeft: 16,
    paddingVertical: 12,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  filterPillSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0052cc',
  },
  smartFilterPill: {
    backgroundColor: '#7c3aed', // Purple background
    borderColor: '#7c3aed',
  },
  smartFilterPillActive: {
    backgroundColor: '#6d28d9',
  },
  smartFilterPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  advisorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
  },
  advisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  higherText: {
    color: '#b91c1c', // dark red
  },
  advisorArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  advisorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  advisorTrendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  advisorDesc: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    lineHeight: 15,
    fontFamily: FONT_FAMILY,
  },
  listingsList: {
    paddingHorizontal: 16,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  brandLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 8, // Rounded square
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  brandTextCol: {
    flex: 1,
  },
  airlineName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  flightCode: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  timelineContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  lineWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  durationLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 3,
    fontFamily: FONT_FAMILY,
  },
  horizontalBar: {
    height: 1.5,
    backgroundColor: '#cbd5e1',
    width: '100%',
  },
  stopsLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 3,
    fontFamily: FONT_FAMILY,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1.1,
    textAlign: 'right',
    fontFamily: FONT_FAMILY,
  },
  cardPromoRow: {
    alignItems: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  promoText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  greenOffersSection: {
    backgroundColor: '#e6f4ea', // Light green ads section
    marginHorizontal: -16,
    paddingVertical: 12,
    paddingLeft: 16,
    marginBottom: 12,
  },
  greenOffersScroll: {
    paddingRight: 16,
  },
  bankOfferCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    width: 200,
  },
  bankLogoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bankLogoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  bankOfferTexts: {
    flex: 1,
  },
  bankOfferHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankOfferTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  bankPromoLabel: {
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bankPromoText: {
    fontSize: 8,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  bankOfferSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  bankLogoAxis: {
    backgroundColor: '#be123c',
  },
  bankLogoRbl: {
    backgroundColor: '#0284c7',
  },
  accentBannerCard: {
    backgroundColor: '#e0f2fe', // Soft blue accent background
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 8,
  },
  accentBannerTitle: {
    color: '#0369a1',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  pencilWrapper: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pencilBody: {
    width: 13,
    height: 5,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    top: 4,
    left: 2,
  },
  pencilUnderline: {
    width: 8,
    height: 1.5,
    backgroundColor: '#1e293b',
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  calendarWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  calendarRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  calendarRing: {
    width: 1.5,
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 0.75,
  },
  calendarBody: {
    width: 18,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 3,
    backgroundColor: '#ffffff',
    paddingTop: 3,
    alignItems: 'center',
  },
  calendarHeaderLine: {
    height: 1.5,
    backgroundColor: '#1e293b',
    width: '100%',
    marginBottom: 2,
  },
  calendarGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  calendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 1.5,
  },
});
