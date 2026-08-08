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
  Alert,
  Modal,
  Image,
} from 'react-native';
import BottomTabNavigation, { BottomTabType } from '../components/BottomTabNavigation';
import FilterScreen from './FilterScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface HotelProperty {
  id: string;
  name: string;
  location: string;
  rating: string;
  reviewsCount: string;
  price: string;
  originalPrice: string;
  discount: string;
  amenities: string[];
  imageUrl: string;
  isFavorite?: boolean;
}

const HOTEL_PROPERTIES: HotelProperty[] = [
  {
    id: '1',
    name: 'The Grand Palace',
    location: 'Colaba, Mumbai',
    rating: '4.5',
    reviewsCount: '1,240',
    price: '₹7,499',
    originalPrice: '₹9,399',
    discount: '-20%',
    amenities: ['📶 Wi-Fi', '☕ Breakfast', '🅿 Parking', '❄ AC'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    name: 'Sea View Residency',
    location: 'Juhu, Mumbai',
    rating: '4.2',
    reviewsCount: '890',
    price: '₹5,999',
    originalPrice: '₹7,099',
    discount: '-15%',
    amenities: ['📶 Wi-Fi', '☕ Breakfast', '🏊 Pool', '❄ AC'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    name: 'Hotel Prime Residency',
    location: 'Andheri East, Mumbai',
    rating: '4.0',
    reviewsCount: '640',
    price: '₹4,299',
    originalPrice: '₹4,799',
    discount: '-10%',
    amenities: ['📶 Wi-Fi', '☕ Breakfast', '🅿 Parking', '❄ AC'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    name: 'Urban Stays',
    location: 'Andheri West, Mumbai',
    rating: '4.3',
    reviewsCount: '1,092',
    price: '₹6,199',
    originalPrice: '₹8,299',
    discount: '-25%',
    amenities: ['📶 Wi-Fi', '☕ Breakfast', '❄ AC'],
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80',
  },
];

interface HotelListScreenProps {
  onBack?: () => void;
  onChangeSearch?: () => void;
  onBookHotel?: (hotelName: string) => void;
}

export default function HotelListScreen({ onBack, onChangeSearch, onBookHotel }: HotelListScreenProps) {
  const [activeTab, setActiveTab] = useState<BottomTabType>('Home');
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [activeFilter, setActiveFilter] = useState<string>('rec');

  // Edit Search State Variables
  const [showEditSearchModal, setShowEditSearchModal] = useState<boolean>(false);
  const [searchCity, setSearchCity] = useState<string>('Mumbai');
  const [checkInDate, setCheckInDate] = useState<string>('12 Aug, Wed');
  const [checkOutDate, setCheckOutDate] = useState<string>('15 Aug, Sat');
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [guestsCount, setGuestsCount] = useState<number>(2);

  // Filter Modal State Variables
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('Sort');
  const [selectedSort, setSelectedSort] = useState<string>('popularity');
  const [selectedPrice, setSelectedPrice] = useState<string>('under-5k');
  const [selectedRating, setSelectedRating] = useState<string>('4plus');
  const [selectedStars, setSelectedStars] = useState<string>('4star');

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Custom slide-down animation value for Edit Search Modal
  const slideDownAnim = useRef(new Animated.Value(-600)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
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

  const handleOpenEditSearch = () => {
    setShowEditSearchModal(true);
    Animated.timing(slideDownAnim, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseEditSearch = () => {
    Animated.timing(slideDownAnim, {
      toValue: -600,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setShowEditSearchModal(false);
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectHotel = (hotel: HotelProperty) => {
    if (onBookHotel) {
      onBookHotel(hotel.name);
    } else {
      Alert.alert('Hotel Selected 🏨', `Opening profile for ${hotel.name}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Top Header Summary Bar */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {/* Back button */}
            <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.headerBackArrow}>←</Text>
            </TouchableOpacity>

            {/* Title & Subtitle column */}
            <TouchableOpacity 
              style={styles.headerTitleContainer} 
              onPress={handleOpenEditSearch}
              activeOpacity={0.85}
            >
              <Text style={styles.headerTitleText}>{searchCity}</Text>
              <Text style={styles.headerSubtitleText}>
                {checkInDate.split(',')[0]} - {checkOutDate.split(',')[0]}  •  {roomsCount} room  •  {guestsCount} guest{guestsCount > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>

            {/* Edit Icon */}
            <TouchableOpacity style={styles.headerEditBtn} onPress={handleOpenEditSearch} activeOpacity={0.7}>
              <Text style={styles.editIcon}>✏</Text>
            </TouchableOpacity>
          </View>

          {/* Subheader Controls (Stays count & Sort/Filter) */}
          <View style={styles.subheaderRow}>
            <Text style={styles.staysCountText}>132 stays found</Text>
            
            <View style={styles.headerRightControls}>
              <TouchableOpacity 
                style={styles.headerControlBtn} 
                onPress={() => { setFilterCategory('Sort'); setShowFilterModal(true); }}
                activeOpacity={0.7}
              >
                <Text style={styles.headerControlText}>Sort ⇅</Text>
              </TouchableOpacity>
              <View style={styles.headerControlDivider} />
              <TouchableOpacity 
                style={styles.headerControlBtn} 
                onPress={() => { setFilterCategory('Price'); setShowFilterModal(true); }}
                activeOpacity={0.7}
              >
                <Text style={styles.headerControlText}>Filter ⚙</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hotels Properties Cards List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollListContent}
        >
          {HOTEL_PROPERTIES.map((hotel) => {
            const isFav = !!favorites[hotel.id];
            return (
              <TouchableOpacity 
                key={hotel.id} 
                style={styles.hotelCard}
                onPress={() => handleSelectHotel(hotel)}
                activeOpacity={0.9}
              >
                {/* Hotel Banner Image Area */}
                <View style={styles.imageBannerContainer}>
                  <Image 
                    source={{ uri: hotel.imageUrl }} 
                    style={styles.imageBanner} 
                    resizeMode="cover"
                  />

                  {/* Top Left Discount Badge */}
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>{hotel.discount}</Text>
                  </View>

                  {/* Top Right Star Rating Badge */}
                  <View style={styles.ratingGroupRow}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingBadgeText}>★ {hotel.rating}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => toggleFavorite(hotel.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.heartIcon}>{isFav ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Hotel Details Area */}
                <View style={styles.cardBody}>
                  {/* Title */}
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <Text style={styles.hotelLocation}>📍 {hotel.location}</Text>
                  </View>

                  {/* Amenities Row */}
                  <View style={styles.amenitiesRow}>
                    {hotel.amenities.map((amenity, idx) => (
                      <View key={idx} style={styles.amenityChip}>
                        <Text style={styles.amenityChipText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer Price & Book Now Action */}
                  <View style={styles.cardFooter}>
                    <View>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{hotel.price}</Text>
                        <Text style={styles.originalPriceText}>{hotel.originalPrice}</Text>
                      </View>
                      <Text style={styles.perNightText}>per night</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookNowBtn}
                      onPress={() => handleSelectHotel(hotel)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.bookNowBtnText}>Book Now ›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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

      {/* Edit Search Modal */}
      <Modal visible={showEditSearchModal} animationType="none" transparent={true}>
        <View style={styles.editModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleCloseEditSearch}
            activeOpacity={1}
          />
          <SafeAreaView style={styles.editModalSafeArea} pointerEvents="box-none">
            <Animated.View 
              style={[
                styles.editModalCard,
                { transform: [{ translateY: slideDownAnim }] }
              ]}
            >
              {/* Edit Modal Header */}
              <View style={styles.editModalHeader}>
                <TouchableOpacity 
                  style={styles.editModalCloseBtn} 
                  onPress={handleCloseEditSearch}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editModalCloseText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.editModalHeaderTitle}>Edit search</Text>
                <View style={{ width: 32 }} />
              </View>

              {/* Combined Input Outline Box */}
              <View style={styles.combinedOutlineBox}>
                {/* Destination Input Row */}
                <View style={styles.combinedRowSingle}>
                  <Text style={styles.combinedIcon}>🔍</Text>
                  <View style={styles.combinedInputContainer}>
                    <Text style={styles.combinedLabel}>City, area or hotel name</Text>
                    <TextInput
                      style={styles.combinedTextInput}
                      value={searchCity}
                      onChangeText={setSearchCity}
                      placeholder="Enter destination"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.outlineDividerHorizontal} />

                {/* Dates split row */}
                <View style={styles.combinedRowSplit}>
                  {/* Check In */}
                  <View style={styles.combinedColSplit}>
                    <Text style={styles.combinedIconSmall}>📅</Text>
                    <View style={styles.combinedInputContainer}>
                      <Text style={styles.combinedLabel}>Check in</Text>
                      <TextInput
                        style={styles.combinedTextInput}
                        value={checkInDate}
                        onChangeText={setCheckInDate}
                      />
                    </View>
                  </View>

                  <View style={styles.outlineDividerVertical} />

                  {/* Check Out */}
                  <View style={styles.combinedColSplit}>
                    <View style={styles.combinedInputContainer}>
                      <Text style={styles.combinedLabel}>Check out</Text>
                      <TextInput
                        style={styles.combinedTextInput}
                        value={checkOutDate}
                        onChangeText={setCheckOutDate}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.outlineDividerHorizontal} />

                {/* Rooms & Guests Row */}
                <View style={styles.combinedRowSingle}>
                  <Text style={styles.combinedIcon}>👥</Text>
                  <View style={styles.combinedInputContainer}>
                    <Text style={styles.combinedLabel}>No. of rooms & guests</Text>
                    <Text style={styles.combinedStaticValue}>
                      {roomsCount} room • {guestsCount} Adult{guestsCount > 1 ? 's' : ''} • 0 Children
                    </Text>
                  </View>
                </View>
              </View>

              {/* Red Action Search Button (matches brand blue theme) */}
              <TouchableOpacity 
                style={styles.redSearchBtn}
                onPress={() => {
                  handleCloseEditSearch();
                  Alert.alert('Search Updated 🔍', `Showing hotels in ${searchCity}`);
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.redSearchBtnText}>Search</Text>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Filter Screen Modal */}
      <FilterScreen
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        selectedPrice={selectedPrice}
        setSelectedPrice={setSelectedPrice}
        selectedRating={selectedRating}
        setSelectedRating={setSelectedRating}
        selectedStars={selectedStars}
        setSelectedStars={setSelectedStars}
        onApply={() => {
          setShowFilterModal(false);
          Alert.alert('Filters Applied 🎉', 'Showing updated stays list.');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 44 : 32,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBackArrow: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '800',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  headerEditBtn: {
    padding: 6,
  },
  editIcon: {
    fontSize: 18,
    color: '#0f172a',
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  staysCountText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerControlBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerControlText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  headerControlDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  hotelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imageBannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#cbd5e1',
  },
  imageBanner: {
    width: '100%',
    height: '100%',
  },
  discountTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  ratingGroupRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: FONT_FAMILY,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  cardBody: {
    padding: 16,
  },
  cardTitleRow: {
    marginBottom: 10,
  },
  hotelName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  hotelLocation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  amenityChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  originalPriceText: {
    fontSize: 13,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  perNightText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  bookNowBtn: {
    backgroundColor: '#0000cd',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#0000cd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookNowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },

  // Edit Search Modal Styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
  },
  editModalSafeArea: {
    width: '100%',
  },
  editModalCard: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editModalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalCloseText: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '600',
  },
  editModalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  combinedOutlineBox: {
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 20,
  },
  combinedRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  combinedRowSplit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  combinedColSplit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  combinedIcon: {
    fontSize: 18,
    marginRight: 14,
    color: '#64748b',
  },
  combinedIconSmall: {
    fontSize: 16,
    marginRight: 12,
    color: '#64748b',
  },
  combinedInputContainer: {
    flex: 1,
  },
  combinedLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  combinedTextInput: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    padding: 0,
    marginTop: 4,
  },
  combinedStaticValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
  outlineDividerHorizontal: {
    height: 1.2,
    backgroundColor: '#cbd5e1',
  },
  outlineDividerVertical: {
    width: 1.2,
    height: '100%',
    backgroundColor: '#cbd5e1',
  },
  redSearchBtn: {
    backgroundColor: '#0b2e66',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b2e66',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  redSearchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
});
