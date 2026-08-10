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
  Modal,
  BackHandler,
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

import { ActivityIndicator } from 'react-native';
import { hotelService } from '../api';

const convertToApiDate = (dateStr: string) => {
  try {
    const cleanStr = dateStr.replace(',', '');
    const parts = cleanStr.split(' ');
    const day = parseInt(parts[0], 10);
    const months: { [key: string]: string } = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const month = months[parts[1]];
    let year = new Date().getFullYear();
    for (const part of parts) {
      if (part.length === 4 && !isNaN(parseInt(part, 10))) {
        year = parseInt(part, 10);
      }
    }
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${month}-${dayStr}`;
  } catch (e) {
    return dateStr;
  }
};

interface HotelProfileScreenProps {
  onBack?: () => void;
  onConfirmBooking?: () => void;
  hotelId?: string;
  searchParams?: {
    city?: string;
    checkIn: string;
    checkOut: string;
    rooms?: number;
    guests?: number;
  };
  onProceedToBooking?: (hotel: any, room: any, ratePlan: any) => void;
}

export default function HotelProfileScreen({ onBack, onConfirmBooking, hotelId, searchParams, onProceedToBooking }: HotelProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'About' | 'Gallery' | 'Amenities'>('About');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRateCode, setSelectedRateCode] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [roomViewerImages, setRoomViewerImages] = useState<string[] | null>(null);
  const [roomViewerIndex, setRoomViewerIndex] = useState<number>(0);

  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (loading) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [loading]);

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
 
  // Handle Android hardware back press
  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };
 
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
 
    return () => backHandler.remove();
  }, [onBack]);

  // Fetch hotel details from API
  useEffect(() => {
    const fetchDetails = async () => {
      if (!hotelId) return;
      setLoading(true);
      try {
        const cityName = searchParams?.city || 'Bangalore';
        const rawCheckIn = searchParams?.checkIn || '12 Aug, Wed';
        const rawCheckOut = searchParams?.checkOut || '15 Aug, Sat';
        const checkIn = convertToApiDate(rawCheckIn);
        const checkOut = convertToApiDate(rawCheckOut);
        const guests = searchParams?.guests || 2;
        const rooms = searchParams?.rooms || 1;

        const data = await hotelService.getHotelDetails(hotelId, {
          cityName,
          checkIn,
          checkOut,
          guests,
          rooms,
        });

        if (data?.success && data?.hotel) {
          setHotel(data.hotel);
          if (data.hotel.rooms && data.hotel.rooms.length > 0) {
            const firstRoom = data.hotel.rooms[0];
            const firstRoomId = firstRoom.roomId || firstRoom.id || '';
            setSelectedRoomId(firstRoomId);
            if (firstRoom.rates && firstRoom.rates.length > 0) {
              setSelectedRateCode(firstRoom.rates[0].bookingCode || '');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching hotel details:', err);
        Alert.alert('Error', 'Failed to load live hotel details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [hotelId, searchParams]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        {/* Top Hero Image Placeholder */}
        <Animated.View style={[styles.skeletonHero, { opacity: shimmerAnim }]} />

        {/* Back action overlay placeholder */}
        <View style={[styles.topActionsRow, { position: 'absolute', top: 50, left: 0, right: 0 }]}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header Summary Block Placeholder */}
          <View style={[styles.stickyHeaderBlock, { marginTop: 0 }]}>
            <Animated.View style={[styles.skeletonTitle, { opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonSubtitle, { opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonBadgeRow, { opacity: shimmerAnim }]} />

            {/* Navigation Tabs Bar Placeholder */}
            <View style={[styles.tabsRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              {['About', 'Gallery', 'Amenities'].map((tab, idx) => (
                <View key={idx} style={[styles.tabBtn, { borderBottomColor: 'transparent' }]}>
                  <Animated.View style={[styles.skeletonTab, { opacity: shimmerAnim }]} />
                </View>
              ))}
            </View>
          </View>

          {/* Body Content Section Placeholder */}
          <View style={[styles.bodyContentSection, { marginTop: 10 }]}>
            {/* Description placeholder */}
            <View style={styles.descriptionContainer}>
              <Animated.View style={[styles.skeletonSectionTitle, { opacity: shimmerAnim }]} />
              <Animated.View style={[styles.skeletonLine, { opacity: shimmerAnim }]} />
              <Animated.View style={[styles.skeletonLine, { width: '85%', opacity: shimmerAnim }]} />
              <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: shimmerAnim }]} />
            </View>

            {/* Room cards placeholder */}
            <View style={styles.roomsSection}>
              <Animated.View style={[styles.skeletonSectionTitle, { opacity: shimmerAnim }]} />
              
              {[1, 2].map((i) => (
                <View key={i} style={[styles.roomCard, { padding: 12 }]}>
                  <View style={styles.roomCardHeader}>
                    <Animated.View style={[styles.skeletonRoomThumb, { opacity: shimmerAnim }]} />
                    <View style={[styles.roomCardInfo, { justifyContent: 'center' }]}>
                      <Animated.View style={[styles.skeletonRoomTitle, { opacity: shimmerAnim }]} />
                      <Animated.View style={[styles.skeletonRoomSpecs, { opacity: shimmerAnim }]} />
                    </View>
                  </View>
                  <Animated.View style={[styles.skeletonRoomRates, { opacity: shimmerAnim }]} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Map fields with fallback to static data
  const hotelName = hotel?.name || HOTEL_DATA.name;
  const hotelImages = hotel?.images && hotel.images.length > 0 ? hotel.images : HOTEL_DATA.media;
  const hotelRating = hotel?.rating || HOTEL_DATA.rating;
  const hotelReviewsCount = hotel?.reviewsCount || HOTEL_DATA.reviewsCount;
  const hotelLocality = hotel?.locality || hotel?.address || HOTEL_DATA.locality;
  const hotelFullAddress = hotel?.address || HOTEL_DATA.fullAddress;
  const hotelDescription = hotel?.description || HOTEL_DATA.description;
  const hotelPropertyType = hotel?.stars ? `${hotel.stars} Star Property` : HOTEL_DATA.propertyType;
  const hotelRooms = hotel?.rooms && hotel.rooms.length > 0 ? hotel.rooms : HOTEL_DATA.rooms;

  const hotelPincode = hotel?.pincode || '';
  const hotelState = hotel?.state || '';
  const hotelCountry = hotel?.country || '';
  const hotelContacts = hotel?.contacts || [
    {
      contactEmail: 'dummy@example.com',
      contactMobileNo: ['+91-0000000000']
    }
  ];
  const hotelOtherInfo = hotel?.otherInfo || {
    numberOfFloors: 3,
    numberOfRooms: 24
  };

  const mappedAmenities = (hotel?.amenities || []).length > 0
    ? hotel.amenities.map((amt: any) => {
        if (typeof amt === 'string') return { icon: '✓', label: amt };
        return { icon: amt.icon || '✓', label: amt.name || amt.label || String(amt) };
      })
    : HOTEL_DATA.amenities;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.length === 4) {
      return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    }
    return timeStr;
  };

  let policyGroups: { title: string; rules: string[] }[] = [];
  if (hotel?.policyInfo?.guidelinesAndPolicies && hotel.policyInfo.guidelinesAndPolicies.length > 0) {
    policyGroups = hotel.policyInfo.guidelinesAndPolicies.map((group: any) => ({
      title: group.title || 'General Guideline',
      rules: group.description || []
    }));
  } else if (hotel?.policyInfo?.knowBeforeYouGo) {
    let rulesList: string[] = [];
    if (Array.isArray(hotel.policyInfo.knowBeforeYouGo)) {
      rulesList = hotel.policyInfo.knowBeforeYouGo;
    } else if (typeof hotel.policyInfo.knowBeforeYouGo === 'string') {
      rulesList = hotel.policyInfo.knowBeforeYouGo.split('\n').filter(Boolean);
    }
    policyGroups = [{ title: 'Know Before You Go', rules: rulesList }];
  } else {
    policyGroups = [{ title: 'Hotel Policies', rules: HOTEL_DATA.policies.rules }];
  }

  const rawCheckin = hotel?.policyInfo?.checkinTime || hotel?.policyInfo?.checkInTime || HOTEL_DATA.policies.checkin;
  const rawCheckout = hotel?.policyInfo?.checkoutTime || hotel?.policyInfo?.checkOutTime || HOTEL_DATA.policies.checkout;
  const checkinTime = formatTime(rawCheckin);
  const checkoutTime = formatTime(rawCheckout);

  // Selected room details
  const selectedRoom = hotelRooms.find((r: any) => (r.roomId || r.id) === selectedRoomId) || hotelRooms[0];

  let displayPrice = '';
  if (selectedRoom) {
    if (selectedRoom.rates && selectedRoom.rates.length > 0) {
      const activeRate = selectedRoom.rates.find((ratePlan: any) => (ratePlan.bookingCode || '') === selectedRateCode) || selectedRoom.rates[0];
      if (activeRate) {
        const ratePrice = activeRate.price?.amount || activeRate.price?.net || activeRate.price?.total || activeRate.amount || 
          (activeRate.pricing?.totals ? (activeRate.pricing.totals.baseFare + (activeRate.pricing.totals.tax || 0) + (activeRate.pricing.totals.discount || 0)) : 0);
        displayPrice = ratePrice ? `₹${Math.round(ratePrice)}` : (selectedRoom.price || '');
      }
    } else {
      displayPrice = selectedRoom.price || '';
    }
  }

  const handleBookNowPress = () => {
    const activeRatePlan = selectedRoom?.rates?.find((ratePlan: any) => (ratePlan.bookingCode || '') === selectedRateCode) || selectedRoom?.rates?.[0];
    if (onProceedToBooking) {
      onProceedToBooking(hotel, selectedRoom, activeRatePlan);
    } else {
      Alert.alert(
        'Proceed to Booking',
        `Reserve ${selectedRoom?.roomName || selectedRoom?.name || 'room'} at ${hotelName} for ${displayPrice}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm & Continue',
            onPress: () => {
              if (onConfirmBooking) {
                onConfirmBooking();
              } else {
                Alert.alert('Booking Confirmed! 🎉', `Your reservation is complete.`);
              }
            },
          },
        ]
      );
    }
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
              source={{ uri: hotelImages[activeImageIndex] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' }}
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
                  onPress={() => Alert.alert('Share', `Share ${hotelName} with friends`)}
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
                {hotelImages.slice(0, 5).map((imgUrl: string, index: number) => (
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
                    {index === 4 && hotelImages.length > 5 && (
                      <View style={styles.thumbnailMoreOverlay}>
                        <Text style={styles.thumbnailMoreText}>+{hotelImages.length - 5}</Text>
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
                <Text style={styles.discountText}>{hotel?.discount || 'Special Offer'}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>
                  {' '}
                  {hotelRating} ({hotelReviewsCount} reviews)
                </Text>
              </View>
            </View>

            {/* Hotel Title & Location with Navigation FAB */}
            <View style={styles.titleLocationRow}>
              <View style={styles.titleCol}>
                <Text style={styles.titleText}>{hotelName}</Text>
                <Text style={styles.locationText}>📍 {hotelLocality}</Text>
              </View>

              <TouchableOpacity
                style={styles.fabBtn}
                onPress={() => Alert.alert('Location Map', hotelFullAddress)}
                activeOpacity={0.8}
              >
                <Text style={styles.fabIcon}>🧭</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Tabs Bar */}
            <View style={styles.tabsRow}>
              {(['About', 'Gallery', 'Amenities'] as const).map((tab) => (
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
                    <Text style={styles.featureText}>{hotelPropertyType}</Text>
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
                      ? hotelDescription
                      : `${hotelDescription.slice(0, 160)}... `}
                    <Text
                      style={styles.readMoreText}
                      onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? ' Show less' : 'Read more'}
                    </Text>
                  </Text>
                </View>

                {/* Contact & General Info Section */}
                <View style={styles.descriptionContainer}>
                  <Text style={styles.sectionTitle}>Contact & General Info</Text>
                  
                  {hotelContacts && hotelContacts.map((contact: any, cIdx: number) => (
                    <View key={cIdx} style={{ marginBottom: 8 }}>
                      {contact.contactEmail ? (
                        <Text style={styles.descriptionText}>
                          ✉️ <Text style={{ fontWeight: '600' }}>Email:</Text> {contact.contactEmail}
                        </Text>
                      ) : null}
                      {contact.contactMobileNo && contact.contactMobileNo.length > 0 ? (
                        <Text style={styles.descriptionText}>
                          📞 <Text style={{ fontWeight: '600' }}>Phone:</Text> {contact.contactMobileNo.join(', ')}
                        </Text>
                      ) : null}
                    </View>
                  ))}

                  {hotelOtherInfo && (hotelOtherInfo.numberOfRooms > 0 || hotelOtherInfo.numberOfFloors > 0) ? (
                    <View style={{ marginBottom: 8 }}>
                      {hotelOtherInfo.numberOfRooms > 0 ? (
                        <Text style={styles.descriptionText}>
                          🏨 <Text style={{ fontWeight: '600' }}>Total Rooms:</Text> {hotelOtherInfo.numberOfRooms}
                        </Text>
                      ) : null}
                      {hotelOtherInfo.numberOfFloors > 0 ? (
                        <Text style={styles.descriptionText}>
                          🏢 <Text style={{ fontWeight: '600' }}>Total Floors:</Text> {hotelOtherInfo.numberOfFloors}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {(hotelPincode || hotelState || hotelCountry) ? (
                    <Text style={styles.descriptionText}>
                      📍 <Text style={{ fontWeight: '600' }}>Location Details:</Text> {[hotelState, hotelCountry, hotelPincode].filter(Boolean).join(', ')}
                    </Text>
                  ) : null}
                </View>

                {/* Select Room Options */}
                <View style={styles.roomsSection}>
                  <Text style={styles.sectionTitle}>Available Room Types</Text>

                  {hotelRooms.map((room: any) => {
                    const roomId = room.roomId || room.id;
                    const isSelected = selectedRoomId === roomId;
                    const roomName = room.roomName || room.name;
                    const roomImage = (room.images && room.images.length > 0) ? room.images[0] : (room.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80');
                    const roomArea = typeof room.area === 'string' ? room.area : (room.area?.value ? `${room.area.value} ${room.area.unit || 'sq.ft'}` : '130 sq.ft');
                    const roomBed = room.bedType || (room.bedGroups && room.bedGroups.length > 0 ? room.bedGroups.join(', ') : 'Double Bed');
                    const roomOccupancy = room.maxOccupancy ? 
                      `Max Guests: ${room.maxOccupancy.totalMaxOccupancy || 3} (Adults: ${room.maxOccupancy.maxAdultOccupancy || 3}${room.maxOccupancy.maxChildOccupancy ? `, Child: ${room.maxOccupancy.maxChildOccupancy}` : ''})` : 
                      (room.occupancy || 'Max 3 Adults');
                    const roomFeatures = room.roomAmenities || room.features || ['Air Conditioning', 'Free WiFi', 'TV'];

                    return (
                      <TouchableOpacity
                        key={roomId}
                        style={[styles.roomCard, isSelected && styles.roomCardSelected]}
                        onPress={() => {
                          setSelectedRoomId(roomId);
                          if (room.rates && room.rates.length > 0) {
                            setSelectedRateCode(room.rates[0].bookingCode || '');
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.roomCardHeader}>
                          <TouchableOpacity
                            style={{ position: 'relative' }}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (room.images && room.images.length > 0) {
                                setRoomViewerImages(room.images);
                                setRoomViewerIndex(0);
                              } else if (roomImage) {
                                setRoomViewerImages([roomImage]);
                                setRoomViewerIndex(0);
                              }
                            }}
                          >
                            <Image source={{ uri: roomImage }} style={styles.roomCardThumb} />
                            {room.images && room.images.length > 1 && (
                              <View style={styles.photoCountBadge}>
                                <Text style={styles.photoCountText}>📷 {room.images.length}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          <View style={styles.roomCardInfo}>
                            <Text style={styles.roomCardTitle}>{roomName}</Text>
                            <Text style={styles.roomCardSpecs}>
                              📐 {roomArea}  •  🛏 {roomBed}
                            </Text>
                            <Text style={styles.roomCardOccupancy}>👥 {roomOccupancy}</Text>
                          </View>
                        </View>

                        <View style={styles.roomFeaturesPills}>
                          {roomFeatures.slice(0, 4).map((feat: any, idx: number) => {
                            const featText = typeof feat === 'string' ? feat : (feat?.name || feat?.label || '');
                            if (!featText) return null;
                            return (
                              <View key={idx} style={styles.roomFeaturePill}>
                                <Text style={styles.roomFeaturePillText}>✓ {featText}</Text>
                              </View>
                            );
                          })}
                        </View>

                        {/* Live Rate Plans inside Room Card */}
                        {room.rates && room.rates.length > 0 ? (
                          <View style={styles.ratesContainer}>
                            <Text style={styles.ratesTitle}>Select Rate Plan:</Text>
                            {room.rates.map((ratePlan: any, rIdx: number) => {
                              const planCode = ratePlan.bookingCode || `${roomId}-${rIdx}`;
                              const isRateSelected = selectedRateCode === planCode && isSelected;
                              const ratePlanName = ratePlan.ratePlanName || ratePlan.mealPlan || ratePlan.description || 'Room Only';
                              const ratePrice = ratePlan.price?.amount || ratePlan.price?.net || ratePlan.price?.total || ratePlan.amount || 
                                (ratePlan.pricing?.totals ? (ratePlan.pricing.totals.baseFare + (ratePlan.pricing.totals.tax || 0) + (ratePlan.pricing.totals.discount || 0)) : 0);
                              const displayRatePrice = ratePrice ? `₹${Math.round(ratePrice)}` : (room.price || 'N/A');
                              const originalPrice = ratePrice ? Math.round(ratePrice * 1.11) : null;
                              const discountPercent = 10;
                              
                              // Check if cancellation policy mentions Free Cancellation or Refundable
                              const isFreeCancellation = ratePlan.cancellationPolicy?.text?.toLowerCase().includes('free cancellation') ||
                                                         ratePlan.cancellationPolicy?.text?.toLowerCase().includes('fully refundable') ||
                                                         ratePlan.cancellationPolicy?.text?.toLowerCase().includes('refundable');
                              
                              // Check meal plan details
                              const hasMeals = ratePlan.mealPlan && !ratePlan.mealPlan.toLowerCase().includes('no meal');
                              const mealText = ratePlan.mealPlan || 'No meals included';

                              return (
                                <View
                                  key={planCode}
                                  style={[
                                    styles.premiumRateCard,
                                    isRateSelected && styles.premiumRateCardActive
                                  ]}
                                >
                                  {/* Left Details Column */}
                                  <View style={styles.rateDetailsCol}>
                                    <Text style={styles.premiumRateTitle}>{ratePlanName.toUpperCase()}</Text>
                                    
                                    {isFreeCancellation ? (
                                      <View style={styles.bulletRow}>
                                        <Text style={[styles.bulletDot, { color: '#16a34a' }]}>•</Text>
                                        <Text style={[styles.bulletText, { color: '#16a34a', fontWeight: '700' }]}>Free Cancellation</Text>
                                      </View>
                                    ) : null}

                                    <View style={styles.bulletRow}>
                                      <Text style={[styles.bulletDot, { color: '#64748b' }]}>•</Text>
                                      <Text style={[styles.bulletText, { color: '#64748b' }]}>{mealText}</Text>
                                    </View>

                                    {ratePlan.cancellationPolicy?.text ? (
                                      <View style={styles.bulletRow}>
                                        <Text style={[styles.bulletDot, { color: '#16a34a' }]}>•</Text>
                                        <Text style={[styles.bulletText, { color: '#16a34a', fontSize: 11, lineHeight: 15 }]}>
                                          {ratePlan.cancellationPolicy.text}
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>

                                  {/* Right Pricing & Action Column */}
                                  <View style={styles.ratePricingCol}>
                                    {originalPrice ? (
                                      <View style={styles.strikethroughRow}>
                                        <Text style={styles.originalPriceTextStrikethrough}>₹{originalPrice}</Text>
                                        <View style={styles.discountBadgeBox}>
                                          <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                                        </View>
                                      </View>
                                    ) : null}

                                    <Text style={styles.premiumRatePrice}>{displayRatePrice}</Text>
                                    <Text style={styles.premiumRateUnit}>/night • Incl. taxes</Text>

                                    <TouchableOpacity
                                      style={[
                                        styles.premiumSelectBtn,
                                        isRateSelected && styles.premiumSelectBtnActive
                                      ]}
                                      onPress={() => {
                                        setSelectedRoomId(roomId);
                                        setSelectedRateCode(planCode);
                                      }}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.premiumSelectBtnText}>
                                        {isRateSelected ? 'SELECTED' : 'SELECT'}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.roomCardFooter}>
                            <View>
                              <View style={styles.roomPriceRow}>
                                <Text style={styles.roomPriceText}>{room.price}</Text>
                                <Text style={styles.roomOriginalPriceText}>{room.originalPrice || ''}</Text>
                              </View>
                              <Text style={styles.taxText}>+ taxes & fees / night</Text>
                            </View>

                            <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                              <Text style={[styles.selectRadioText, isSelected && styles.selectRadioTextActive]}>
                                {isSelected ? 'Selected ✓' : 'Select'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>



                 {/* Guidelines & Policies */}
                 <View style={styles.policiesSection}>
                   <Text style={styles.sectionTitle}>Hotel Rules & Policies</Text>
                   <View style={styles.policyTimesRow}>
                     <Text style={styles.policyTimeText}>🕒 Check-in: {checkinTime}</Text>
                     <Text style={styles.policyTimeText}>🕒 Check-out: {checkoutTime}</Text>
                   </View>
 
                   {policyGroups.map((group: any, gIdx: number) => (
                     <View key={gIdx} style={styles.policyGroupContainer}>
                       <Text style={styles.policyGroupTitle}>{group.title}</Text>
                       {group.rules.map((rule: string, rIdx: number) => (
                         <View key={rIdx} style={styles.ruleBulletRow}>
                           <Text style={styles.ruleBulletDot}>•</Text>
                           <Text style={styles.ruleBulletText}>{rule}</Text>
                         </View>
                       ))}
                     </View>
                   ))}
                 </View>

                {/* Full Address Location Card */}
                <View style={styles.contactContainer}>
                  <Text style={styles.sectionTitle}>Property Location & Address</Text>
                  <View style={styles.addressCard}>
                    <Text style={styles.addressTitle}>📍 {hotelName}</Text>
                    <Text style={styles.addressBody}>{hotelFullAddress}</Text>
                    {hotel?.nearbySpots && <Text style={styles.nearbySpotsText}>Landmarks: {hotel.nearbySpots}</Text>}
                  </View>
                </View>
              </View>
            )}

            {/* GALLERY TAB CONTENT */}
            {activeTab === 'Gallery' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Property & Room Photos ({hotelImages.length})</Text>
                <View style={styles.galleryGrid}>
                  {hotelImages.map((mediaUrl: string, idx: number) => (
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

            {/* AMENITIES TAB CONTENT */}
            {activeTab === 'Amenities' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Top Amenities & Facilities</Text>
                <View style={styles.amenitiesGrid}>
                  {mappedAmenities.map((item: any, idx: number) => (
                    <View key={idx} style={styles.amenityItem}>
                      <Text style={styles.amenityIcon}>{item.icon}</Text>
                      <Text style={styles.amenityLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Booking Bar */}
        <View style={styles.bottomStickyBar}>
          <View>
            <View style={styles.bottomPriceRow}>
              <Text style={styles.bottomPriceText}>{displayPrice}</Text>
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
 
      {/* Room Image Viewer Modal */}
      {roomViewerImages && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setRoomViewerImages(null)}
        >
          <View style={styles.modalBg}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRoomViewerImages(null)}>
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
            
            <View style={styles.modalSliderContainer}>
              <Image 
                source={{ uri: roomViewerImages[roomViewerIndex] }} 
                style={styles.modalLargeImage} 
                resizeMode="contain" 
              />
              
              {/* Image Indicators / Index */}
              <Text style={styles.modalIndexText}>
                {roomViewerIndex + 1} / {roomViewerImages.length}
              </Text>
            </View>
 
            {/* Thumbnail Navigation Row */}
            <ScrollView horizontal style={styles.modalThumbScroll} contentContainerStyle={{ alignItems: 'center' }}>
              {roomViewerImages.map((img: string, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => setRoomViewerIndex(idx)}
                  style={[styles.modalThumbWrapper, roomViewerIndex === idx && styles.modalThumbActive]}
                >
                  <Image source={{ uri: img }} style={styles.modalThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
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
  ratesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  ratesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  rateRowActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  rateRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rateRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rateRadioActive: {
    borderColor: '#2563eb',
  },
  rateRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  ratePlanName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  ratePlanPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  cancellationPolicyText: {
    fontSize: 10.5,
    color: '#16a34a',
    marginTop: 6,
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    paddingLeft: 28,
  },
  policyGroupContainer: {
    marginTop: 14,
    marginBottom: 6,
  },
  policyGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 4,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCountText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 10,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  modalSliderContainer: {
    width: '100%',
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalLargeImage: {
    width: '90%',
    height: '100%',
    borderRadius: 12,
  },
  modalIndexText: {
    position: 'absolute',
    bottom: -30,
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalThumbScroll: {
    maxHeight: 80,
    marginTop: 50,
    width: '100%',
  },
  modalThumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  modalThumbActive: {
    borderColor: '#3b82f6',
  },
  modalThumb: {
    width: '100%',
    height: '100%',
  },
  skeletonHero: {
    width: '100%',
    height: 300,
    backgroundColor: '#cbd5e1',
  },
  skeletonTitle: {
    width: '70%',
    height: 24,
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonBadgeRow: {
    width: '55%',
    height: 18,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonTab: {
    width: 65,
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonSectionTitle: {
    width: '35%',
    height: 18,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  skeletonRoomThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  skeletonRoomTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonRoomSpecs: {
    width: '50%',
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonRoomRates: {
    width: '100%',
    height: 48,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    marginTop: 12,
  },
  premiumRateCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  premiumRateCardActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  rateDetailsCol: {
    flex: 1.2,
    paddingRight: 8,
  },
  ratePricingCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  premiumRateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 6,
    marginTop: -2,
  },
  bulletText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    fontFamily: FONT_FAMILY,
  },
  strikethroughRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  originalPriceTextStrikethrough: {
    fontSize: 12.5,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountBadgeBox: {
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  discountBadgeText: {
    fontSize: 9.5,
    color: '#15803d',
    fontWeight: '800',
  },
  premiumRatePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  premiumRateUnit: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  premiumSelectBtn: {
    backgroundColor: '#ff5a3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    width: 110,
    alignItems: 'center',
  },
  premiumSelectBtnActive: {
    backgroundColor: '#475569',
  },
  premiumSelectBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
