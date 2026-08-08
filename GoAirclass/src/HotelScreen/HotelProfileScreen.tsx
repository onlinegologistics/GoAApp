import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  Animated,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

// JSON Static Data extracted from user payload
const HOTEL_DATA = {
  hotelId: '1324888',
  name: 'Brahma Inn Executive Rooms',
  propertyType: 'Resort / Executive',
  rating: '4.2',
  reviewsCount: '128',
  discount: '15% Off',
  locality: 'Panduranga Nagar, Bangalore',
  fullAddress: '1st Floor, Sadguru Complex, Plot No.65-66, Bannerghatta Rd, Krishnaraju Layout, Panduranga Nagar, Bengaluru, Karnataka 560076',
  description:
    'Brahma Inn provides guests with complimentary Wi-Fi connectivity. The property is roughly 1 km from IIMB Bus Stop and 7 km from Lalbagh Botanical Garden. The hotel has 9 well-maintained guestrooms equipped with bottled drinking water and wardrobe. Each attached bathroom is provided with toiletries and supplied with hot/cold running water. Travel assistance and room service are also provided.',
  nearbySpots: '1 km from IIMB • 4 km from JP Nagar Metro • 7 km from Lalbagh Botanical Garden',
  media: [
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_c215b8c5-2faf-41e3-902f-a828c95f72e0.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_e2de462b-5b47-4291-8c51-25db84a77454_proc.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_b147c69a-6604-4f0f-aa5f-d123ee2bc219_proc.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_585eddae-1300-47d7-8db7-10654a7a0ef4.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_a656e9a2-02b9-4d45-9bd5-bf7c37aaa99d_proc.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_6456c54d-414d-4420-a075-417ded58acff_proc.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_4796de6b-8266-4548-9088-a6521cf89f2e_proc.jpeg',
    'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_eaa8c64b-55ef-4d72-8cfd-89bbf2c77591_proc.jpeg',
  ],
  amenities: [
    { icon: '📶', label: 'Free WiFi Services' },
    { icon: '❄️', label: 'Air Conditioning' },
    { icon: '🛎️', label: '24-Hour Front Desk' },
    { icon: '🛡️', label: '24-Hour Security & CCTV' },
    { icon: '☕', label: 'Breakfast Services' },
    { icon: '🅿️', label: 'On-site Parking' },
    { icon: '🛗', label: 'Lift / Elevator' },
    { icon: '⚡', label: 'Power Back up' },
    { icon: '🧹', label: 'Housekeeping & Room Service' },
    { icon: '🩺', label: 'Medical Facilities' },
  ],
  rooms: [
    {
      id: '2593967',
      name: 'Executive AC Room',
      area: '130 sq.ft',
      bedType: 'Double Bed',
      occupancy: 'Max 3 Adults, 2 Children',
      price: '₹2,499',
      originalPrice: '₹2,999',
      views: 'City view',
      features: ['Air Conditioning', 'Free WiFi Access', 'TV', 'Attached Bathroom', 'Bottle of Water'],
      imageUrl:
        'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_6456c54d-414d-4420-a075-417ded58acff_proc.jpeg',
    },
    {
      id: '2593966',
      name: 'Deluxe Room Non Ac',
      area: '100 sq.ft',
      bedType: 'Double Bed',
      occupancy: 'Max 3 Adults, 2 Children',
      price: '₹1,899',
      originalPrice: '₹2,299',
      views: 'City view',
      features: ['Attached Bathroom', 'Fan & Desk', 'TV', 'Bottle of Water', 'Blanket'],
      imageUrl:
        'https://rukmini-ct.flixcart.com/w_2048,f_auto,q_auto/ct-hotel-images/places/hotels/cms/1324/1324888/images/image_1324888_5d55244a-1ec5-405d-9e03-d9e82fd7435a_proc.jpeg',
    },
  ],
  policies: {
    checkin: '12:00 PM',
    checkout: '12:00 PM',
    rules: [
      'Unmarried couples allowed',
      'Outside food is allowed',
      'Non-veg food & Food delivery (Zomato) allowed',
      'Govt. ID (Aadhar, Driving License) accepted',
      'Pets are not allowed',
    ],
  },
};

interface HotelProfileScreenProps {
  onBack?: () => void;
  onConfirmBooking?: () => void;
}

export default function HotelProfileScreen({ onBack, onConfirmBooking }: HotelProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'About' | 'Gallery' | 'Review'>('About');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('2593967');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY >= 300) {
      if (!isHeaderStuck) setIsHeaderStuck(true);
    } else {
      if (isHeaderStuck) setIsHeaderStuck(false);
    }
  };

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const selectedRoom = HOTEL_DATA.rooms.find((r) => r.id === selectedRoomId) || HOTEL_DATA.rooms[0];

  const handleBookNowPress = () => {
    Alert.alert(
      'Proceed to Booking',
      `Reserve ${selectedRoom.name} at ${HOTEL_DATA.name} for ${selectedRoom.price} / night?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Continue',
          onPress: () => {
            if (onConfirmBooking) {
              onConfirmBooking();
            } else {
              Alert.alert('Booking Confirmed! 🎉', `Your reservation for ${HOTEL_DATA.name} is complete.`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {/* CHILD 0: Top Hero Image Section (Scrolls naturally) */}
          <View style={styles.heroSection}>
            <Image
              source={{ uri: HOTEL_DATA.media[activeImageIndex] }}
              style={styles.heroImage}
              resizeMode="cover"
            />

            {/* Top Floating Action Buttons */}
            <View style={styles.topActionsRow}>
              <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.8}>
                <Text style={styles.iconText}>←</Text>
              </TouchableOpacity>

              <View style={styles.topRightActions}>
                <TouchableOpacity
                  style={[styles.iconButton, { marginRight: 10 }]}
                  onPress={() => Alert.alert('Share', `Share ${HOTEL_DATA.name} with friends`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.iconText}>🔗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsFavorite(!isFavorite)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.iconText}>{isFavorite ? '❤️' : '♡'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Overlay Gallery Thumbnails */}
            <View style={styles.thumbnailOverlayContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScroll}>
                {HOTEL_DATA.media.slice(0, 5).map((imgUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnailWrapper,
                      activeImageIndex === index && styles.thumbnailActiveBorder,
                    ]}
                    onPress={() => setActiveImageIndex(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: imgUrl }} style={styles.thumbnailImage} />
                    {index === 4 && HOTEL_DATA.media.length > 5 && (
                      <View style={styles.thumbnailMoreOverlay}>
                        <Text style={styles.thumbnailMoreText}>+{HOTEL_DATA.media.length - 5}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* CHILD 1: Sticky Header Block (Pins to top when scrolled) */}
          <View style={[
            styles.stickyHeaderBlock,
            isHeaderStuck && styles.stickyHeaderBlockStuck
          ]}>
            {/* Discount & Rating Row */}
            <View style={styles.infoTopRow}>
              <View style={styles.discountPill}>
                <Text style={styles.discountText}>{HOTEL_DATA.discount}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>
                  {' '}
                  {HOTEL_DATA.rating} ({HOTEL_DATA.reviewsCount} reviews)
                </Text>
              </View>
            </View>

            {/* Hotel Title & Location with Navigation FAB */}
            <View style={styles.titleLocationRow}>
              <View style={styles.titleCol}>
                <Text style={styles.titleText}>{HOTEL_DATA.name}</Text>
                <Text style={styles.locationText}>📍 {HOTEL_DATA.locality}</Text>
              </View>

              <TouchableOpacity
                style={styles.fabBtn}
                onPress={() => Alert.alert('Location Map', HOTEL_DATA.fullAddress)}
                activeOpacity={0.8}
              >
                <Text style={styles.fabIcon}>🧭</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Tabs Bar */}
            <View style={styles.tabsRow}>
              {(['About', 'Gallery', 'Review'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CHILD 2: Scrollable Body Content Section */}
          <View style={styles.bodyContentSection}>
            {/* ABOUT TAB CONTENT */}
            {activeTab === 'About' && (
              <View style={styles.tabContent}>
                {/* Highlights Specs Row */}
                <View style={styles.featuresRow}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🛏</Text>
                    <Text style={styles.featureText}>Double Beds</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🏨</Text>
                    <Text style={styles.featureText}>{HOTEL_DATA.propertyType}</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>⛶</Text>
                    <Text style={styles.featureText}>130 sq.ft</Text>
                  </View>
                </View>

                {/* Description Section */}
                <View style={styles.descriptionContainer}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>
                    {isDescriptionExpanded
                      ? HOTEL_DATA.description
                      : `${HOTEL_DATA.description.slice(0, 160)}... `}
                    <Text
                      style={styles.readMoreText}
                      onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? ' Show less' : 'Read more'}
                    </Text>
                  </Text>
                </View>

                {/* Select Room Options */}
                <View style={styles.roomsSection}>
                  <Text style={styles.sectionTitle}>Available Room Types</Text>

                  {HOTEL_DATA.rooms.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={[styles.roomCard, isSelected && styles.roomCardSelected]}
                        onPress={() => setSelectedRoomId(room.id)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.roomCardHeader}>
                          <Image source={{ uri: room.imageUrl }} style={styles.roomCardThumb} />
                          <View style={styles.roomCardInfo}>
                            <Text style={styles.roomCardTitle}>{room.name}</Text>
                            <Text style={styles.roomCardSpecs}>
                              📐 {room.area}  •  🛏 {room.bedType}
                            </Text>
                            <Text style={styles.roomCardOccupancy}>👥 {room.occupancy}</Text>
                          </View>
                        </View>

                        <View style={styles.roomFeaturesPills}>
                          {room.features.map((feat, idx) => (
                            <View key={idx} style={styles.roomFeaturePill}>
                              <Text style={styles.roomFeaturePillText}>✓ {feat}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.roomCardFooter}>
                          <View>
                            <View style={styles.roomPriceRow}>
                              <Text style={styles.roomPriceText}>{room.price}</Text>
                              <Text style={styles.roomOriginalPriceText}>{room.originalPrice}</Text>
                            </View>
                            <Text style={styles.taxText}>+ taxes & fees / night</Text>
                          </View>

                          <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                            <Text style={[styles.selectRadioText, isSelected && styles.selectRadioTextActive]}>
                              {isSelected ? 'Selected ✓' : 'Select'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Popular Amenities & Facilities */}
                <View style={styles.amenitiesSection}>
                  <Text style={styles.sectionTitle}>Top Amenities</Text>
                  <View style={styles.amenitiesGrid}>
                    {HOTEL_DATA.amenities.map((item, idx) => (
                      <View key={idx} style={styles.amenityItem}>
                        <Text style={styles.amenityIcon}>{item.icon}</Text>
                        <Text style={styles.amenityLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Guidelines & Policies */}
                <View style={styles.policiesSection}>
                  <Text style={styles.sectionTitle}>Hotel Rules & Policies</Text>
                  <View style={styles.policyTimesRow}>
                    <Text style={styles.policyTimeText}>🕒 Check-in: {HOTEL_DATA.policies.checkin}</Text>
                    <Text style={styles.policyTimeText}>🕒 Check-out: {HOTEL_DATA.policies.checkout}</Text>
                  </View>

                  {HOTEL_DATA.policies.rules.map((rule, idx) => (
                    <View key={idx} style={styles.ruleBulletRow}>
                      <Text style={styles.ruleBulletDot}>•</Text>
                      <Text style={styles.ruleBulletText}>{rule}</Text>
                    </View>
                  ))}
                </View>

                {/* Full Address Location Card */}
                <View style={styles.contactContainer}>
                  <Text style={styles.sectionTitle}>Property Location & Address</Text>
                  <View style={styles.addressCard}>
                    <Text style={styles.addressTitle}>📍 Brahma Inn Executive Rooms</Text>
                    <Text style={styles.addressBody}>{HOTEL_DATA.fullAddress}</Text>
                    <Text style={styles.nearbySpotsText}>Landmarks: {HOTEL_DATA.nearbySpots}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* GALLERY TAB CONTENT */}
            {activeTab === 'Gallery' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Property & Room Photos ({HOTEL_DATA.media.length})</Text>
                <View style={styles.galleryGrid}>
                  {HOTEL_DATA.media.map((mediaUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.galleryGridWrapper}
                      onPress={() => setActiveImageIndex(idx)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: mediaUrl }} style={styles.galleryGridImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* REVIEW TAB CONTENT */}
            {activeTab === 'Review' && (
              <View style={styles.tabContent}>
                <View style={styles.reviewSummaryHeader}>
                  <View style={styles.reviewScoreBadge}>
                    <Text style={styles.reviewScoreText}>{HOTEL_DATA.rating}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewSummaryTitle}>Very Good Stay</Text>
                    <Text style={styles.reviewSummarySub}>Based on {HOTEL_DATA.reviewsCount} verified reviews</Text>
                  </View>
                </View>

                <View style={styles.userReviewCard}>
                  <View style={styles.reviewUserHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>R</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>Rahul Sharma</Text>
                      <Text style={styles.userStayInfo}>Stayed in Executive AC Room</Text>
                    </View>
                    <Text style={styles.userRatingStar}>⭐ 5.0</Text>
                  </View>
                  <Text style={styles.userReviewText}>
                    "Clean rooms, great WiFi, and excellent location near Bannerghatta Road. Friendly staff and hassle-free check-in!"
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Booking Bar */}
        <View style={styles.bottomStickyBar}>
          <View>
            <View style={styles.bottomPriceRow}>
              <Text style={styles.bottomPriceText}>{selectedRoom.price}</Text>
              <Text style={styles.bottomPerNightText}>/ night</Text>
            </View>
            <Text style={styles.bottomTaxText}>+ taxes & fees</Text>
          </View>

          <TouchableOpacity
            style={styles.bottomContinueBtn}
            onPress={handleBookNowPress}
            activeOpacity={0.9}
          >
            <Text style={styles.bottomContinueBtnText}>Continue to Booking ›</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    height: 380,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topActionsRow: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topRightActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconText: {
    fontSize: 20,
    color: '#0f172a',
  },
  thumbnailOverlayContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  thumbnailScroll: {
    paddingHorizontal: 20,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#e2e8f0',
  },
  thumbnailActiveBorder: {
    borderColor: '#2563eb',
    borderWidth: 2.5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailMoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },

  // STICKY HEADER BLOCK (PINS TO TOP)
  stickyHeaderBlock: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 22 : 10,
    borderBottomWidth: 0,
    zIndex: 100,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  stickyHeaderBlockStuck: {
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 16,
    color: '#fbbf24',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  titleLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  titleCol: {
    flex: 1,
    paddingRight: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  fabBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },

  // BODY SCROLLABLE CONTENT SECTION
  bodyContentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
  },
  tabContent: {},
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontFamily: FONT_FAMILY,
  },
  readMoreText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  roomsSection: {
    marginBottom: 24,
  },
  roomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  roomCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fafc',
  },
  roomCardHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  roomCardThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 12,
  },
  roomCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roomCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  roomCardSpecs: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontFamily: FONT_FAMILY,
  },
  roomCardOccupancy: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  roomFeaturesPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roomFeaturePill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomFeaturePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    fontFamily: FONT_FAMILY,
  },
  roomCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  roomOriginalPriceText: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  taxText: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  selectRadio: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  selectRadioActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  selectRadioText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  selectRadioTextActive: {
    color: '#ffffff',
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  policiesSection: {
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  policyTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  policyTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  ruleBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  ruleBulletDot: {
    fontSize: 14,
    color: '#2563eb',
    marginRight: 8,
  },
  ruleBulletText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    fontFamily: FONT_FAMILY,
  },
  contactContainer: {
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  addressBody: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  nearbySpotsText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '700',
    marginTop: 8,
    fontFamily: FONT_FAMILY,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryGridWrapper: {
    width: (SCREEN_WIDTH - 50) / 2,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryGridImage: {
    width: '100%',
    height: '100%',
  },
  reviewSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewScoreBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  reviewScoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  reviewSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  reviewSummarySub: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  userReviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  userStayInfo: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  userRatingStar: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  userReviewText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bottomPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  bottomPerNightText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
  },
  bottomTaxText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  bottomContinueBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomContinueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
});
