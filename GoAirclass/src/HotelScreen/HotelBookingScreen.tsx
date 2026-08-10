import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  BackHandler,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { hotelService } from '../api';
import RazorpayCheckout from 'react-native-razorpay';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface HotelBookingScreenProps {
  hotel: any;
  room: any;
  ratePlan: any;
  searchParams: any;
  onBack: () => void;
  onSuccess: () => void;
}

export default function HotelBookingScreen({
  hotel,
  room,
  ratePlan,
  searchParams,
  onBack,
  onSuccess,
}: HotelBookingScreenProps) {
  // Form State
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('user@example.com');
  const [mobile, setMobile] = useState('9876543210');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);
  const [bookingConfirmedData, setBookingConfirmedData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  // Calculate pricing elements
  const pricing = ratePlan?.pricing?.totals || {
    baseFare: parseFloat(room?.price?.replace(/[^0-9]/g, '')) || 2000,
    tax: 0,
    discount: 0,
  };
  const totalAmount = pricing.baseFare + (pricing.tax || 0) + (pricing.discount || 0);

  const handleConfirmBooking = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required Info', 'Please enter First Name.');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Required Info', 'Please enter Last Name.');
      return;
    }
    if (!email.trim() || !mobile.trim()) {
      Alert.alert('Required Info', 'Please enter valid Email and Mobile number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hotelId: String(hotel.id),
        searchId: String(hotel.searchId || ratePlan.searchId || 'sid-dummy'),
        bookingCode: String(ratePlan.bookingCode),
        bookingAmount: totalAmount,
        checkIn: searchParams.checkInDate || searchParams.checkIn,
        checkOut: searchParams.checkOutDate || searchParams.checkOut,
        rooms: searchParams.rooms || 1,
        guests: searchParams.guests || 2,
        title,
        firstName,
        lastName,
        email,
        mobile,
        specialRequests: specialRequests || 'None',
      };

      const res = await hotelService.provisionalBook(payload);

      if (res && res.success) {
        setBookingSuccessData(res);
      } else {
        Alert.alert('Booking Failed', res.error || 'Something went wrong during booking.');
      }
    } catch (error: any) {
      console.error('Provisional booking error:', error);
      Alert.alert('Booking Error', error.response?.data?.error || error.message || 'Provisional booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndConfirm = async () => {
    if (!bookingSuccessData?.provisionalBookId) return;
    setConfirming(true);
    try {
      // 1. Create order on backend
      const orderRes = await hotelService.createPaymentOrder({
        amount: totalAmount,
        notes: {
          hotelId: String(hotel.id),
          hotelName: hotel.name,
          roomName: room.roomName || room.name,
          guestName: `${title} ${firstName} ${lastName}`,
          provisionalBookId: bookingSuccessData.provisionalBookId
        }
      });

      if (!orderRes.success) {
        Alert.alert('Order Creation Failed', orderRes.message || 'Failed to create payment order');
        return;
      }

      // 2. Options for Razorpay Checkout
      const options = {
        description: `Hotel Reservation - ${hotel.name}`,
        image: 'https://i.imgur.com/3g7uj6C.png',
        key: orderRes.key,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'GoAirClass',
        order_id: orderRes.orderId,
        prefill: {
          email: email,
          contact: mobile,
          name: `${title} ${firstName} ${lastName}`
        },
        theme: { color: '#ff5a3c' }
      };

      // 3. Open Razorpay Checkout modal
      const data = await RazorpayCheckout.open(options);

      // 4. Confirm Reservation on Backend
      const confirmPayload = {
        provisionalBookId: bookingSuccessData.provisionalBookId,
        hotelId: String(hotel.id),
        hotelName: hotel.name,
        roomName: room.roomName || room.name,
        guestName: `${title} ${firstName} ${lastName}`,
        totalAmount: totalAmount,
        razorpayOrderId: data.razorpay_order_id || orderRes.orderId,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature
      };

      const confirmRes = await hotelService.confirmBook(confirmPayload);

      if (confirmRes && confirmRes.success) {
        setBookingConfirmedData({
          tripId: confirmRes.tripId,
          confirmationNumber: confirmRes.confirmationNumber,
          hotelName: hotel.name,
          roomName: room.roomName || room.name,
          guestName: `${title} ${firstName} ${lastName}`,
          totalAmount: totalAmount
        });
        setBookingSuccessData(null); // Close provisional modal
      } else {
        Alert.alert('Booking Confirmation Failed', confirmRes.error || 'Failed to confirm booking. Please contact support.');
      }
    } catch (paymentError: any) {
      console.error('Payment Error:', paymentError);
      Alert.alert('Payment Failed', paymentError.description || paymentError.message || 'Payment was cancelled or failed.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2e66" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitleText}>Review Booking</Text>
          <Text style={styles.headerSubtitle}>Step 3 of 4 • Guest Details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hotel Details Summary Card */}
        <View style={styles.summaryCard}>
          <Image
            source={{
              uri: hotel.image || (hotel.images && hotel.images[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
            }}
            style={styles.summaryImage}
            resizeMode="cover"
          />
          <View style={styles.summaryBody}>
            <Text style={styles.hotelNameText}>{hotel.name}</Text>
            <Text style={styles.hotelAddressText}>📍 {hotel.address || hotel.locality}</Text>
            <View style={styles.roomBadgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{room.roomName || room.name}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.badgeText, { color: '#2563eb' }]}>
                  {ratePlan.ratePlanName || ratePlan.mealPlan || 'Room Only'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stay Details Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Stay Information</Text>
          <View style={styles.stayDetailsGrid}>
            <View style={styles.stayDetailItem}>
              <Text style={styles.gridLabel}>Check-In</Text>
              <Text style={styles.gridValue}>{searchParams.checkIn}</Text>
            </View>
            <View style={styles.stayDetailItem}>
              <Text style={styles.gridLabel}>Check-Out</Text>
              <Text style={styles.gridValue}>{searchParams.checkOut}</Text>
            </View>
            <View style={styles.stayDetailItem}>
              <Text style={styles.gridLabel}>Rooms</Text>
              <Text style={styles.gridValue}>{searchParams.rooms || 1}</Text>
            </View>
            <View style={styles.stayDetailItem}>
              <Text style={styles.gridLabel}>Guests</Text>
              <Text style={styles.gridValue}>{searchParams.guests || 2}</Text>
            </View>
          </View>
        </View>

        {/* Guest Details Form */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Guest Information</Text>

          {/* Salutation Selector */}
          <Text style={styles.inputLabel}>Salutation *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowTitlePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{title}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Names */}
          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter First Name"
                placeholderTextColor="#94a3b8"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Last Name"
                placeholderTextColor="#94a3b8"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Contact Details */}
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter Email Address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Mobile Number *</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="phone-pad"
            placeholder="Enter Mobile Number"
            placeholderTextColor="#94a3b8"
            value={mobile}
            onChangeText={setMobile}
          />

          <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
          <TextInput
            style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
            multiline
            numberOfLines={3}
            placeholder="e.g. Twin beds, Late check-in, Airport pickup request"
            placeholderTextColor="#94a3b8"
            value={specialRequests}
            onChangeText={setSpecialRequests}
          />
        </View>

        {/* Pricing Fare Breakup */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Fare Summary</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Room Base Fare</Text>
            <Text style={styles.fareValue}>₹{Math.round(pricing.baseFare)}</Text>
          </View>
          {pricing.tax > 0 && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Taxes & Fees</Text>
              <Text style={styles.fareValue}>₹{Math.round(pricing.tax)}</Text>
            </View>
          )}
          {pricing.discount !== 0 && (
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: '#16a34a' }]}>Discounts</Text>
              <Text style={[styles.fareValue, { color: '#16a34a' }]}>-₹{Math.round(Math.abs(pricing.discount))}</Text>
            </View>
          )}
          <View style={[styles.fareRow, styles.totalFareRow]}>
            <Text style={styles.totalFareLabel}>Total Cost</Text>
            <Text style={styles.totalFareValue}>₹{Math.round(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Booking Confirm Button Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarTotalLabel}>Total Pay</Text>
          <Text style={styles.bottomBarPriceText}>₹{Math.round(totalAmount)}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmBooking}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking ›</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Salutation Title Picker Modal */}
      <Modal visible={showTitlePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTitlePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Title</Text>
            {['Mr', 'Mrs', 'Ms'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOpt}
                onPress={() => {
                  setTitle(opt);
                  setShowTitlePicker(false);
                }}
              >
                <Text style={styles.modalOptText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Booking Success Modal */}
      <Modal visible={!!bookingSuccessData} transparent animationType="slide">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            {/* Clock Icon Circle */}
            <View style={styles.clockCircle}>
              <Text style={styles.clockEmoji}>🕒</Text>
            </View>

            <Text style={styles.heldTitle}>Room Temporarily Held!</Text>
            <Text style={styles.heldSubtitle}>
              Cleartrip has held your room for 15 minutes. Complete payment to finalize booking.
            </Text>

            {/* Held Info Box */}
            <View style={styles.heldInfoBox}>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Provisional ID:</Text>
                <Text style={styles.heldValue}>{bookingSuccessData?.provisionalBookId}</Text>
              </View>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Hotel:</Text>
                <Text style={styles.heldValue}>{hotel.name}</Text>
              </View>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Guest:</Text>
                <Text style={styles.heldValue}>{title} {firstName} {lastName}</Text>
              </View>
              <View style={[styles.heldRow, { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.heldLabel, { fontWeight: '800', color: '#0f172a' }]}>Total Amount:</Text>
                <Text style={styles.heldPrice}>₹{Math.round(totalAmount)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.payBtn, confirming && { opacity: 0.6 }]}
              onPress={handlePayAndConfirm}
              disabled={confirming}
              activeOpacity={0.9}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.payBtnText}>PAY & CONFIRM BOOKING</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelExitBtn}
              onPress={() => {
                setBookingSuccessData(null);
                onBack();
              }}
              disabled={confirming}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelExitBtnText}>CANCEL & EXIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Final Booking Confirmed Modal */}
      <Modal visible={!!bookingConfirmedData} transparent animationType="slide">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={[styles.clockCircle, { backgroundColor: '#d1fae5' }]}>
              <Text style={[styles.clockEmoji, { color: '#059669' }]}>✓</Text>
            </View>

            <Text style={styles.heldTitle}>Booking Confirmed!</Text>
            <Text style={styles.heldSubtitle}>
              Your reservation is guaranteed. A voucher has been sent to your email.
            </Text>

            <View style={styles.heldInfoBox}>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Trip ID:</Text>
                <Text style={[styles.heldValue, { color: '#059669', fontWeight: '800' }]}>
                  {bookingConfirmedData?.tripId}
                </Text>
              </View>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Confirmation No:</Text>
                <Text style={styles.heldValue}>{bookingConfirmedData?.confirmationNumber}</Text>
              </View>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Hotel:</Text>
                <Text style={styles.heldValue}>{bookingConfirmedData?.hotelName}</Text>
              </View>
              <View style={styles.heldRow}>
                <Text style={styles.heldLabel}>Guest:</Text>
                <Text style={styles.heldValue}>{bookingConfirmedData?.guestName}</Text>
              </View>
              <View style={[styles.heldRow, { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.heldLabel, { fontWeight: '800', color: '#0f172a' }]}>Paid Amount:</Text>
                <Text style={styles.heldPrice}>₹{Math.round(bookingConfirmedData?.totalAmount || 0)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: '#0f172a' }]}
              onPress={() => {
                setBookingConfirmedData(null);
                onSuccess();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.payBtnText}>BACK TO HOME</Text>
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
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: '#0b2e66',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { paddingTop: 48 },
    }),
  },
  backBtn: {
    marginRight: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#93c5fd',
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryImage: {
    width: 110,
    height: 110,
  },
  summaryBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  hotelNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  hotelAddressText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
    fontFamily: FONT_FAMILY,
  },
  stayDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stayDetailItem: {
    width: '50%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    fontFamily: FONT_FAMILY,
  },
  dropdownTrigger: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  textInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fareLabel: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  fareValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  totalFareRow: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalFareLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  totalFareValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0b2e66',
    fontFamily: FONT_FAMILY,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomBarTotalLabel: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  bottomBarPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0b2e66',
    fontFamily: FONT_FAMILY,
  },
  confirmBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  modalOpt: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalOptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  clockCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6fcf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clockEmoji: {
    fontSize: 28,
    color: '#0ca678',
  },
  heldTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  heldSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
    paddingHorizontal: 8,
  },
  heldInfoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  heldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  heldLabel: {
    fontSize: 12.5,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  heldValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    maxWidth: '65%',
  },
  heldPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ff5a3c',
    fontFamily: FONT_FAMILY,
  },
  payBtn: {
    backgroundColor: '#ff5a3c',
    paddingVertical: 14,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  payBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.5,
  },
  cancelExitBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  cancelExitBtnText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.5,
  },
});
