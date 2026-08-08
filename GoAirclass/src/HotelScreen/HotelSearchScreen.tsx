import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  BackHandler,
  Image,
} from 'react-native';
import BottomTabNavigation, { BottomTabType } from '../components/BottomTabNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface HotelSearchScreenProps {
  onSearchHotels?: () => void;
  onBack?: () => void;
  onSelectFlights?: () => void;
}

type HotelCategory = 'Flights' | 'Hotels';

interface PopularCity {
  id: string;
  name: string;
  country: string;
  icon: string;
  imageBg: string;
}

const POPULAR_CITIES: PopularCity[] = [
  { id: '1', name: 'Goa', country: 'India', icon: '🏖', imageBg: '#0ea5e9' },
  { id: '2', name: 'Mumbai', country: 'India', icon: '🏙', imageBg: '#1e293b' },
  { id: '3', name: 'Delhi NCR', country: 'India', icon: '🏛', imageBg: '#b45309' },
  { id: '4', name: 'Dubai', country: 'UAE', icon: '🌆', imageBg: '#6366f1' },
  { id: '5', name: 'Bangkok', country: 'Thailand', icon: '🌴', imageBg: '#059669' },
];

interface FeaturedHotel {
  id: string;
  name: string;
  location: string;
  rating: string;
  price: string;
  originalPrice: string;
  discount: string;
  tag: string;
  badgeBg: string;
}

const FEATURED_HOTELS: FeaturedHotel[] = [
  {
    id: '1',
    name: 'Taj Exotica Resort & Spa',
    location: 'Benaulim, Goa',
    rating: '4.9 ★ (1.2k reviews)',
    price: '₹14,500',
    originalPrice: '₹18,000',
    discount: '20% OFF',
    tag: '5 Star Luxury',
    badgeBg: '#16a34a',
  },
  {
    id: '2',
    name: 'The Oberoi Amarvilas',
    location: 'Agra, UP',
    rating: '4.8 ★ (980 reviews)',
    price: '₹22,000',
    originalPrice: '₹28,000',
    discount: '22% OFF',
    tag: 'Free Breakfast',
    badgeBg: '#2563eb',
  },
  {
    id: '3',
    name: 'Grand Hyatt Mumbai',
    location: 'Bandra East, Mumbai',
    rating: '4.7 ★ (2.1k reviews)',
    price: '₹9,800',
    originalPrice: '₹12,500',
    discount: '21% OFF',
    tag: 'Pool & Spa',
    badgeBg: '#9333ea',
  },
];

export default function HotelSearchScreen({ onSearchHotels, onBack, onSelectFlights }: HotelSearchScreenProps) {
  const [activeCategory, setActiveCategory] = useState<HotelCategory>('Hotels');
  const [activeTab, setActiveTab] = useState<BottomTabType>('Home');

  // Search State
  const [destination, setDestination] = useState<string>('Goa, India');
  const [checkInDate, setCheckInDate] = useState<string>('12 Aug 2026');
  const [checkInDay, setCheckInDay] = useState<string>('Wednesday');
  const [checkOutDate, setCheckOutDate] = useState<string>('15 Aug 2026');
  const [checkOutDay, setCheckOutDay] = useState<string>('Saturday');
  const [nightsCount, setNightsCount] = useState<number>(3);

  // Guests & Rooms State
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  // Modals & Pickers
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [searchCityQuery, setSearchCityQuery] = useState<string>('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const ringsScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Concentric rings slow breathing loop animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringsScale, {
          toValue: 1.08,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(ringsScale, {
          toValue: 1.0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [ringsScale]);

  // Back handler for Android
  useEffect(() => {
    const backAction = () => {
      if (showCityModal) {
        setShowCityModal(false);
        return true;
      }
      if (showGuestModal) {
        setShowGuestModal(false);
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showCityModal, showGuestModal, onBack]);

  const handleSelectCity = (cityName: string, countryName: string) => {
    setDestination(`${cityName}, ${countryName}`);
    setShowCityModal(false);
  };

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchCityQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchCityQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2e66" />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Premium Header Banner */}
          <View style={styles.topHeaderBanner}>
            {/* Subtle background concentric circles */}
            <Animated.View style={[styles.concentricRing1, { transform: [{ scale: ringsScale }] }]} />
            <Animated.View style={[styles.concentricRing2, { transform: [{ scale: ringsScale }] }]} />
            <Animated.View style={[styles.concentricRing3, { transform: [{ scale: ringsScale }] }]} />

            {/* Header Content Row */}
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
              Find and Book{'\n'}your Perfect Stay
            </Text>

            {/* Category Tabs (Flights, Hotels) */}
            <View style={styles.categoryContainer}>
              {(['Flights', 'Hotels'] as HotelCategory[]).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => {
                      if (cat === 'Flights') {
                        if (onSelectFlights) onSelectFlights();
                      } else {
                        setActiveCategory(cat);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {cat === 'Flights' ? '✈ ' : '🏨 '}
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Main Hotel Search Card */}
          <View style={styles.searchCard}>
            {/* Destination / City Block */}
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.inputIconCircle}>
                <Text style={styles.inputIconText}>📍</Text>
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>CITY / DESTINATION / HOTEL</Text>
                <Text style={styles.inputValueLarge}>{destination}</Text>
                <Text style={styles.inputSubtext}>India • 420+ Luxury & Budget Stay Options</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Check-In and Check-Out Dates Block */}
            <View style={styles.dateRow}>
              {/* Check In */}
              <TouchableOpacity style={styles.dateBox} activeOpacity={0.8}>
                <View style={styles.dateIconCircle}>
                  <Text style={styles.dateIconText}>📅</Text>
                </View>
                <View>
                  <Text style={styles.inputLabel}>CHECK-IN DATE</Text>
                  <Text style={styles.dateValue}>{checkInDate}</Text>
                  <Text style={styles.dateDayText}>{checkInDay}</Text>
                </View>
              </TouchableOpacity>

              {/* Night Counter Badge */}
              <View style={styles.nightsBadge}>
                <Text style={styles.nightsBadgeText}>{nightsCount} Nights</Text>
              </View>

              {/* Check Out */}
              <TouchableOpacity style={styles.dateBox} activeOpacity={0.8}>
                <View style={styles.dateIconCircle}>
                  <Text style={styles.dateIconText}>🗓</Text>
                </View>
                <View>
                  <Text style={styles.inputLabel}>CHECK-OUT DATE</Text>
                  <Text style={styles.dateValue}>{checkOutDate}</Text>
                  <Text style={styles.dateDayText}>{checkOutDay}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Guests & Rooms Block */}
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowGuestModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.inputIconCircle}>
                <Text style={styles.inputIconText}>👥</Text>
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>ROOMS & GUESTS</Text>
                <Text style={styles.inputValueLarge}>
                  {rooms} {rooms === 1 ? 'Room' : 'Rooms'}, {adults + children} {adults + children === 1 ? 'Guest' : 'Guests'}
                </Text>
                <Text style={styles.inputSubtext}>
                  {adults} {adults === 1 ? 'Adult' : 'Adults'}{children > 0 ? `, ${children} Children` : ''}
                </Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>



            {/* Search Hotels Action Button */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                if (onSearchHotels) onSearchHotels();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.searchButtonText}>SEARCH HOTELS 🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Popular Destinations Quick Pick Horizontal List */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Popular Stay Destinations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularCitiesScroll}>
              {POPULAR_CITIES.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.cityCard}
                  onPress={() => handleSelectCity(city.name, city.country)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.cityCardBg, { backgroundColor: city.imageBg }]}>
                    <Text style={styles.cityCardIcon}>{city.icon}</Text>
                  </View>
                  <Text style={styles.cityCardName}>{city.name}</Text>
                  <Text style={styles.cityCardCountry}>{city.country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Hotel Recommendations */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Handpicked Hotel Deals</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {FEATURED_HOTELS.map((hotel) => (
              <TouchableOpacity key={hotel.id} style={styles.hotelRecommendationCard} activeOpacity={0.9}>
                <View style={styles.hotelHeaderRow}>
                  <View style={styles.hotelTitleGroup}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <Text style={styles.hotelLocation}>📍 {hotel.location}</Text>
                  </View>
                  <View style={[styles.hotelTagBadge, { backgroundColor: hotel.badgeBg }]}>
                    <Text style={styles.hotelTagText}>{hotel.tag}</Text>
                  </View>
                </View>

                <View style={styles.hotelFooterRow}>
                  <Text style={styles.hotelRatingText}>{hotel.rating}</Text>
                  <View style={styles.hotelPriceGroup}>
                    <Text style={styles.originalPriceText}>{hotel.originalPrice}</Text>
                    <Text style={styles.hotelPriceText}>{hotel.price}</Text>
                    <Text style={styles.discountBadge}>{hotel.discount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Tab Navigation */}
        <BottomTabNavigation
          activeTab={activeTab}
          onChangeTab={(tab: BottomTabType) => {
            setActiveTab(tab);
            if (tab === 'Home' && onBack) {
              onBack();
            }
          }}
        />
      </Animated.View>

      {/* City Selection Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCityModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Select City / Destination</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.modalSearchBox}>
            <Text style={styles.modalSearchIcon}>🔍</Text>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search city, area or hotel name..."
              placeholderTextColor="#94a3b8"
              value={searchCityQuery}
              onChangeText={setSearchCityQuery}
              autoFocus
            />
          </View>

          <ScrollView style={styles.modalCityList}>
            {filteredCities.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={styles.modalCityItem}
                onPress={() => handleSelectCity(city.name, city.country)}
              >
                <Text style={styles.modalCityIcon}>{city.icon}</Text>
                <View style={styles.modalCityTextGroup}>
                  <Text style={styles.modalCityName}>{city.name}</Text>
                  <Text style={styles.modalCityCountry}>{city.country}</Text>
                </View>
                <Text style={styles.modalSelectArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Guest & Room Selector Modal */}
      <Modal visible={showGuestModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.guestModalCard}>
            <Text style={styles.guestModalTitle}>Rooms & Guests</Text>
            <Text style={styles.guestModalSubtitle}>Select number of guests and rooms required</Text>

            {/* Room Row */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterLabel}>Rooms</Text>
                <Text style={styles.counterSublabel}>Minimum 1 room</Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  style={[styles.counterBtn, rooms <= 1 && styles.counterBtnDisabled]}
                  onPress={() => setRooms(Math.max(1, rooms - 1))}
                  disabled={rooms <= 1}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{rooms}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setRooms(rooms + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dividerLight} />

            {/* Adults Row */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterLabel}>Adults</Text>
                <Text style={styles.counterSublabel}>Age 12+ years</Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  style={[styles.counterBtn, adults <= 1 && styles.counterBtnDisabled]}
                  onPress={() => setAdults(Math.max(1, adults - 1))}
                  disabled={adults <= 1}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adults}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setAdults(adults + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dividerLight} />

            {/* Children Row */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterLabel}>Children</Text>
                <Text style={styles.counterSublabel}>Age 0-11 years</Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  style={[styles.counterBtn, children <= 0 && styles.counterBtnDisabled]}
                  onPress={() => setChildren(Math.max(0, children - 1))}
                  disabled={children <= 0}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{children}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setChildren(children + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.guestApplyBtn}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={styles.guestApplyBtnText}>Apply Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f4fc',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  topHeaderBanner: {
    backgroundColor: '#0b2e66',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 60,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  concentricRing1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  concentricRing2: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  concentricRing3: {
    position: 'absolute',
    right: -80,
    top: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    color: '#cbd5e1',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 36,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    },
  categoryTabTextActive: {
    color: '#0b2e66',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: -42,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  inputIconText: {
    fontSize: 20,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    },
  inputValueLarge: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    },
  inputSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    },
  chevronIcon: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateIconText: {
    fontSize: 16,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    },
  dateDayText: {
    fontSize: 11,
    color: '#64748b',
    },
  nightsBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  nightsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    },
  filterChipsRow: {
    flexDirection: 'row',
    marginVertical: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    },
  searchButton: {
    backgroundColor: '#0000cd',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0000cd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    },
  popularCitiesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cityCard: {
    width: 100,
    marginRight: 14,
    alignItems: 'center',
  },
  cityCardBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cityCardIcon: {
    fontSize: 32,
  },
  cityCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    },
  cityCardCountry: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    },
  hotelRecommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hotelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hotelTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    },
  hotelLocation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    },
  hotelTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotelTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    },
  hotelFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  hotelRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    },
  hotelPriceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPriceText: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 6,
    },
  hotelPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0b2e66',
    },
  discountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
    marginLeft: 6,
    },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  modalSearchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    },
  modalCityList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalCityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  modalCityIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  modalCityTextGroup: {
    flex: 1,
  },
  modalCityName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    },
  modalCityCountry: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    },
  modalSelectArrow: {
    fontSize: 22,
    color: '#cbd5e1',
  },

  // Guest Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guestModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  guestModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    },
  guestModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 20,
    },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  counterLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    },
  counterSublabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 16,
    },
  dividerLight: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  guestApplyBtn: {
    backgroundColor: '#0000cd',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  guestApplyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    },
});
