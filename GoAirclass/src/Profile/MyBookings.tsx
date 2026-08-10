import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { hotelService, flightService } from '../api';
import BookingDetails from './BookingDetails';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface MyBookingsProps {
  onBack: () => void;
}

export default function MyBookings({ onBack }: MyBookingsProps) {
  const [activeCategory, setActiveCategory] = useState<'Flight' | 'Hotel'>('Hotel');
  const [activeTab, setActiveTab] = useState<'Booking' | 'Cancelled'>('Booking');
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({ 'golden-valley': true });
  const [loading, setLoading] = useState(true);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [flightBookings, setFlightBookings] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    const handleBackPress = () => {
      if (selectedTripId) {
        setSelectedTripId(null);
        return true;
      }
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [selectedTripId, onBack]);

  useEffect(() => {
    const fetchAllBookings = async () => {
      setLoading(true);
      try {
        const [hotelRes, flightRes] = await Promise.allSettled([
          hotelService.getMyBookings(),
          flightService.getMyBookings(),
        ]);

        if (hotelRes.status === 'fulfilled' && hotelRes.value?.success) {
          setHotelBookings(hotelRes.value.bookings || []);
        }
        if (flightRes.status === 'fulfilled' && flightRes.value?.success) {
          setFlightBookings(flightRes.value.bookings || []);
        }
      } catch (err) {
        console.error('Failed to load user bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllBookings();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const parseBookings = (list: any[], isFlight: boolean) => {
    const bookingList: any[] = [];
    const cancelledList: any[] = [];

    list.forEach((b) => {
      if (String(b.status).toLowerCase() === 'cancelled') {
        cancelledList.push(b);
      } else {
        bookingList.push(b);
      }
    });

    const defaultHotelBookings = [
      {
        id: 'golden-valley-up',
        name: 'GoldenValley',
        location: 'New York, USA',
        price: '₹12,400',
        rating: '4.9',
        discount: '10% Off',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
        buttonText: 'View Voucher',
      },
      {
        id: 'shelter-hotel',
        name: 'Shelter Hotel',
        location: 'Mumbai, India',
        price: '₹7,450',
        rating: '4.5',
        discount: '15% Off',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=300&q=80',
        buttonText: 'Write Review',
      },
    ];

    const defaultHotelCancelled = [
      {
        id: 'golden-valley',
        name: 'GoldenValley',
        location: 'New York, USA',
        price: '₹12,400',
        rating: '4.9',
        discount: '10% Off',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
        buttonText: 'Re-Book',
      },
    ];

    const defaultFlightBookings = [
      {
        id: 'flight-1',
        name: 'IndiGo Airlines',
        location: 'DEL ➔ BOM',
        price: '₹5,400',
        rating: '4.8',
        discount: 'Confirmed',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=300&q=80',
        buttonText: 'View Ticket',
      },
    ];

    const defaultFlightCancelled = [
      {
        id: 'flight-3',
        name: 'SpiceJet',
        location: 'BOM ➔ BLR',
        price: '₹4,800',
        rating: '4.2',
        discount: 'Cancelled',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=300&q=80',
        buttonText: 'Search Again',
      },
    ];

    if (isFlight) {
      return {
        Booking: bookingList.length > 0 ? bookingList.map(b => mapFlight(b, 'View Ticket')) : defaultFlightBookings,
        Cancelled: cancelledList.length > 0 ? cancelledList.map(b => mapFlight(b, 'Search Again')) : defaultFlightCancelled,
      };
    } else {
      return {
        Booking: bookingList.length > 0 ? bookingList.map(b => mapHotel(b, 'View Voucher')) : defaultHotelBookings,
        Cancelled: cancelledList.length > 0 ? cancelledList.map(b => mapHotel(b, 'Re-Book')) : defaultHotelCancelled,
      };
    }
  };

  const mapHotel = (b: any, buttonText: string) => {
    return {
      id: b._id || b.id || b.tripId || String(Math.random()),
      tripId: b.tripId,
      name: b.hotelName || 'Premium Hotel',
      location: b.hotelAddress || b.location || 'Location Info',
      price: b.totalAmount ? `₹${Math.round(b.totalAmount)}` : '₹1,500',
      rating: '4.7',
      discount: '10% Off',
      image: b.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      buttonText,
    };
  };

  const mapFlight = (b: any, buttonText: string) => {
    const flightName = b.airline || b.flightDetails?.airline || 'IndiGo';
    const source = b.from || b.flightDetails?.from || 'DEL';
    const dest = b.to || b.flightDetails?.to || 'BOM';
    return {
      id: b._id || b.id || b.tripId || String(Math.random()),
      tripId: b.tripId,
      name: flightName,
      location: `${source} ➔ ${dest}`,
      price: b.totalAmount ? `₹${Math.round(b.totalAmount)}` : '₹5,400',
      rating: '4.8',
      discount: b.status ? String(b.status).toUpperCase() : 'Confirmed',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=300&q=80',
      buttonText,
    };
  };

  const currentList = activeCategory === 'Hotel' ? hotelBookings : flightBookings;
  const bookingsData = parseBookings(currentList, activeCategory === 'Flight');

  if (selectedTripId) {
    if (activeCategory === 'Hotel') {
      return <BookingDetails tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
    } else {
      // Direct alert for flights receipt details
      Alert.alert('Flight Booking Details', `Trip ID: ${selectedTripId}\nDetails of this flight trip can be checked via PNR.`);
      setSelectedTripId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Tab Bar (Flight / Hotel) */}
      <View style={styles.categoryRow}>
        {(['Flight', 'Hotel'] as const).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryItem, isActive && styles.categoryItemActive]}
              onPress={() => {
                setActiveCategory(cat);
                setActiveTab('Booking'); // Default to Booking when category changes
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tabs Bar (Booking / Cancelled) */}
      <View style={styles.tabsRow}>
        {(['Booking', 'Cancelled'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {bookingsData[activeTab].map((booking) => {
            const isFav = !!favorites[booking.id];
            return (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  const b = booking as any;
                  if (b.tripId) {
                    setSelectedTripId(b.tripId);
                  } else {
                    Alert.alert('Mock Booking', 'This is a demo booking card details.');
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeaderRow}>
                  {/* Image Section */}
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: booking.image }} style={styles.hotelImage} />
                    <TouchableOpacity
                      style={styles.favButton}
                      onPress={() => toggleFavorite(booking.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.favIcon, isFav && styles.favIconActive]}>
                        {isFav ? '❤️' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Details Section */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.badgeRatingRow}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{booking.discount}</Text>
                      </View>
                      <Text style={styles.starText}>⭐ {booking.rating}</Text>
                    </View>

                    <Text style={styles.hotelName}>{booking.name}</Text>
                    <Text style={styles.locationText}>📍 {booking.location}</Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceValue}>{booking.price}</Text>
                      <Text style={styles.priceUnit}> {activeCategory === 'Hotel' ? '/night' : '/total'}</Text>
                    </View>
                  </View>
                </View>

              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    ...Platform.select({
      ios: { paddingTop: 10 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  backArrow: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  categoryItem: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryItemActive: {
    backgroundColor: '#2563eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  tabTextActive: {
    color: '#2563eb',
  },
  scrollContent: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
  },
  hotelImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  favIcon: {
    fontSize: 12,
    color: '#64748b',
  },
  favIconActive: {
    color: '#3b82f6',
  },
  detailsContainer: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'center',
  },
  badgeRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  discountBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: FONT_FAMILY,
  },
  starText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: FONT_FAMILY,
  },
  priceUnit: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
});
