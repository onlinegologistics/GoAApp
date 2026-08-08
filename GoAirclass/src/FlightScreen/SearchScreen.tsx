import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import BottomTabNavigation, { BottomTabType } from '../components/BottomTabNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

type CategoryType = 'Flights' | 'Hotels' | 'My Trips';
type TripType = 'One Way' | 'Round Trip' | 'Multi City';

interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
}

const OFFERS: Offer[] = [
  {
    id: '1',
    title: 'Flat 20% Off',
    description: 'On Canada Airways bookings',
    code: 'GOAIR20',
    discount: '20% OFF',
  },
  {
    id: '2',
    title: 'Save up to $150',
    description: 'On United Emirates flights',
    code: 'FLYUAE',
    discount: '$150 OFF',
  },
  {
    id: '3',
    title: 'Air India Special',
    description: 'Get extra baggage allowance',
    code: 'BAGFREE',
    discount: 'FREE BAG',
  },
];

interface IconProps {
  active?: boolean;
  color?: string;
}

// Vector Icon Drawings

const PlaneIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <Text style={[styles.planeGlyph, { color }]}>✈</Text>
  </View>
);

const HotelIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <Text style={[styles.hotelGlyph, { color }]}>🏨</Text>
  </View>
);

const BriefcaseIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <View style={[styles.suitcaseHandle, { borderColor: color }]}>
      <View style={[styles.suitcaseBody, { borderColor: color }]} />
    </View>
  </View>
);

interface SearchScreenProps {
  onSearch: () => void;
  onBack?: () => void;
  onSelectHotels?: () => void;
}

export default function SearchScreen({ onSearch, onBack, onSelectHotels }: SearchScreenProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Flights');
  const [activeTab, setActiveTab] = useState<BottomTabType>('Home');
  const [tripType, setTripType] = useState<TripType>('One Way');

  // Location Input States
  const [fromLocation, setFromLocation] = useState<string>('United States of America');
  const [toLocation, setToLocation] = useState<string>('United Arab Emirates');

  // Passenger Count State
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [showTravelerDropdown, setShowTravelerDropdown] = useState<boolean>(false);

  // Stepper Functions
  const incrementAdults = () => setAdults((prev) => Math.min(prev + 1, 9));
  const decrementAdults = () => setAdults((prev) => Math.max(prev - 1, 1)); // min 1 adult

  const incrementChildren = () => setChildren((prev) => Math.min(prev + 1, 9));
  const decrementChildren = () => setChildren((prev) => Math.max(prev - 1, 0));

  const incrementInfants = () => setInfants((prev) => Math.min(prev + 1, 9));
  const decrementInfants = () => setInfants((prev) => Math.max(prev - 1, 0));

  // Sliding Indicator Animation
  const slideX = useRef(new Animated.Value(0)).current;
  const tabWidth = (SCREEN_WIDTH - 44) / 3;

  useEffect(() => {
    let toIndex = 0;
    if (activeCategory === 'Hotels') toIndex = 1;
    if (activeCategory === 'My Trips') toIndex = 2;

    Animated.spring(slideX, {
      toValue: toIndex * tabWidth,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [activeCategory, slideX, tabWidth]);

  // Screen entrance landing animations
  const entranceSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.spring(entranceSlide, {
      toValue: 0,
      tension: 40,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [entranceSlide]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animationWrapper, { transform: [{ translateY: entranceSlide }] }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Navy Header Section */}
          <View style={styles.header}>
            {/* Subtle background concentric circles */}
            <View style={styles.concentricRing1} />
            <View style={styles.concentricRing2} />
            <View style={styles.concentricRing3} />

            <View style={styles.headerContent}>
              <View style={styles.userInfoRow}>
                {onBack && (
                  <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                )}
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                  style={styles.avatarImage}
                />
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingLabel}>Good Morning</Text>
                  <Text style={styles.greetingName}>Shahinur Rahman</Text>
                </View>
              </View>

              {/* Notification Badge */}
              <TouchableOpacity style={styles.notificationBadge} activeOpacity={0.8}>
                <View style={styles.bellIconVector}>
                  <View style={styles.bellCap} />
                  <View style={styles.bellBody} />
                  <View style={styles.bellClapper} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Large Header Title */}
            <Text style={styles.headerTitle}>
              Securely Book{'\n'}your Flight Ticket
            </Text>
          </View>

          {/* Categories Tab selector overlapping header */}
          <View style={styles.categoryCard}>
            {/* Smooth sliding active indicator */}
            <Animated.View style={[styles.slidingIndicator, { width: tabWidth, transform: [{ translateX: slideX }] }]} />

            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => setActiveCategory('Flights')}
                activeOpacity={0.7}
              >
                <PlaneIcon color={activeCategory === 'Flights' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'Flights' && styles.categoryTextActive]}>Flights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => {
                  setActiveCategory('Hotels');
                  if (onSelectHotels) {
                    onSelectHotels();
                  }
                }}
                activeOpacity={0.7}
              >
                <HotelIcon color={activeCategory === 'Hotels' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'Hotels' && styles.categoryTextActive]}>Hotels</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => setActiveCategory('My Trips')}
                activeOpacity={0.7}
              >
                <BriefcaseIcon color={activeCategory === 'My Trips' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'My Trips' && styles.categoryTextActive]}>My Trips</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Flight Search Form Card */}
          <View style={styles.searchCard}>
            {/* Trip Type Selector */}
            <View style={styles.tripTypeRow}>
              {(['One Way', 'Round Trip', 'Multi City'] as TripType[]).map((type) => {
                const isActive = tripType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.tripTypeTab, isActive && styles.tripTypeTabActive]}
                    onPress={() => setTripType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tripTypeText, isActive && styles.tripTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Stacked From Field */}
            <View style={styles.inputBlock}>
              <View style={styles.planeIconCircle}>
                <Text style={styles.planeIconGlyph}>🛫</Text>
              </View>
              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>From</Text>
                <TextInput
                  style={styles.inputField}
                  value={fromLocation}
                  onChangeText={setFromLocation}
                  placeholder="Enter departure city/country"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Stacked To Field */}
            <View style={styles.inputBlock}>
              <View style={styles.planeIconCircle}>
                <Text style={styles.planeIconGlyph}>🛬</Text>
              </View>
              <View style={styles.inputTextContainer}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  style={styles.inputField}
                  value={toLocation}
                  onChangeText={setToLocation}
                  placeholder="Enter destination city/country"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Side by Side Dates */}
            <View style={styles.datesRow}>
              <View style={[styles.inputBlockHalf, tripType !== 'One Way' && styles.marginRightCell]}>
                <Text style={styles.inputLabel}>Departure</Text>
                <Text style={styles.dateValue}>10 June 2023</Text>
              </View>
              {tripType !== 'One Way' && (
                <View style={styles.inputBlockHalf}>
                  <Text style={styles.inputLabel}>Return</Text>
                  <Text style={styles.dateValue}>12 Jun 2023</Text>
                </View>
              )}
            </View>

            {/* Travelers Row (Click to open dropdown) */}
            <TouchableOpacity
              style={styles.travelersContainer}
              onPress={() => setShowTravelerDropdown(!showTravelerDropdown)}
              activeOpacity={0.8}
            >
              <View style={styles.travelersLeft}>
                <Text style={styles.inputLabel}>Travelers</Text>
                <Text style={styles.travelersValue}>
                  {adults + children + infants} Person ({adults} Adt, {children} Chd, {infants} Inf)
                </Text>
              </View>
              <View style={styles.dropdownArrowContainer}>
                <Text style={styles.dropdownArrowGlyph}>▾</Text>
              </View>
            </TouchableOpacity>

            {/* Traveler Stepper Dropdown Popover */}
            {showTravelerDropdown && (
              <View style={styles.travelerDropdown}>
                {/* Adults Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Adults</Text>
                    <Text style={styles.dropdownItemSub}>Age 12 or above</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementAdults} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{adults}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementAdults} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Children Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Children</Text>
                    <Text style={styles.dropdownItemSub}>Age 2 - 12</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementChildren} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{children}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementChildren} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Infants Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Infants</Text>
                    <Text style={styles.dropdownItemSub}>Under age 2</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementInfants} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{infants}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementInfants} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  style={styles.dropdownDoneBtn}
                  onPress={() => setShowTravelerDropdown(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Button */}
            <TouchableOpacity style={styles.searchBtn} onPress={onSearch} activeOpacity={0.9}>
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Offers Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offers</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.flightsList}>
            {OFFERS.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerLeft}>
                  <View style={styles.offerTagBadge}>
                    <Text style={styles.offerTagIcon}>🏷️</Text>
                  </View>
                  <View style={styles.offerTextCol}>
                    <Text style={styles.offerCardTitle}>{offer.title}</Text>
                    <Text style={styles.offerCardDesc}>{offer.description}</Text>
                  </View>
                </View>
                <View style={styles.offerRight}>
                  <View style={styles.couponCodeContainer}>
                    <Text style={styles.couponCodeText}>{offer.code}</Text>
                  </View>
                  <Text style={styles.offerDiscountText}>{offer.discount}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Reusable Bottom Navigation Component */}
        <BottomTabNavigation activeTab={activeTab} onChangeTab={setActiveTab} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  animationWrapper: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  header: {
    height: 310,
    backgroundColor: '#0e1626', // Charcoal dark navy
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 55,
  },
  concentricRing1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  concentricRing2: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  concentricRing3: {
    position: 'absolute',
    right: -80,
    top: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    },
  greetingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
    },
  notificationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 36,
    letterSpacing: -0.5,
    },
  categoryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -85,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 101,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 12,
    backgroundColor: '#0f172a', // Solid black active background
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 102,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 100,
  },
  tripTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tripTypeTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tripTypeTextActive: {
    color: '#0052cc',
  },
  inputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  planeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planeIconGlyph: {
    fontSize: 14,
    color: '#0052cc',
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  inputValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },
  inputField: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
    padding: 0,
    height: 20,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputBlockHalf: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  marginRightCell: {
    marginRight: 12,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  travelersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  travelersLeft: {
    flex: 1,
  },
  travelersValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepperNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 12,
  },
  searchBtn: {
    backgroundColor: '#0e1626',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  seeAllLink: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  flightsList: {
    marginHorizontal: 20,
  },
  offerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offerTagBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  offerTagIcon: {
    fontSize: 18,
  },
  offerTextCol: {
    flex: 1,
  },
  offerCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  offerCardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  offerRight: {
    alignItems: 'flex-end',
  },
  couponCodeContainer: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f8fafc',
  },
  couponCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0052cc',
  },
  offerDiscountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c5221f',
    marginTop: 4,
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },
  navTextActive: {
    color: '#0052cc',
  },

  // Vector Styles
  vectorIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#94a3b8',
  },
  houseBody: {
    width: 12,
    height: 9,
    backgroundColor: '#94a3b8',
    marginTop: 1,
  },
  ticketShape: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ticketLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#94a3b8',
  },
  ticketDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#94a3b8',
    top: 3,
  },
  clockCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHourHand: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: '#94a3b8',
    top: 3,
  },
  clockMinuteHand: {
    position: 'absolute',
    width: 4,
    height: 2,
    backgroundColor: '#94a3b8',
    right: 3,
    top: 5,
  },
  settingsOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
  },
  blueBackground: {
    backgroundColor: '#0052cc',
  },
  blueBorder: {
    borderColor: '#0052cc',
  },
  blueBackgroundBorder: {
    backgroundColor: '#0052cc',
    borderBottomColor: '#0052cc',
  },
  grayBackground: {
    backgroundColor: '#94a3b8',
  },
  grayBorder: {
    borderColor: '#94a3b8',
  },
  grayBackgroundBorder: {
    backgroundColor: '#94a3b8',
    borderBottomColor: '#94a3b8',
  },

  // Notification Bell Vector
  bellIconVector: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCap: {
    width: 4,
    height: 3,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: -1,
  },
  bellBody: {
    width: 12,
    height: 9,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  bellClapper: {
    width: 4,
    height: 2,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    marginTop: 1,
  },
  planeGlyph: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  hotelGlyph: {
    fontSize: 16,
    color: '#64748b',
  },
  suitcaseHandle: {
    width: 8,
    height: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  suitcaseBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 2,
  },
  dropdownArrowContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrowGlyph: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'bold',
  },
  travelerDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: -8,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dropdownRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownLabelCol: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  dropdownDoneBtn: {
    backgroundColor: '#0e1626',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dropdownDoneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
