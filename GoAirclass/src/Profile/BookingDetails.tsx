import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  BackHandler,
} from 'react-native';
import { hotelService } from '../api';
import { BASE_URL, getAuthToken } from '../api/apiClient';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface BookingDetailsProps {
  tripId: string;
  onBack: () => void;
}

export default function BookingDetails({ tripId, onBack }: BookingDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getAuthToken();
      const downloadUrl = `${BASE_URL}/hotels/trip/${tripId}/download-receipt?token=${token || ''}`;
      
      console.log('Opening download url:', downloadUrl);
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert('Error', 'Unable to open download link in default browser.');
      }
    } catch (err: any) {
      console.error('Download Receipt error:', err);
      Alert.alert('Error', err.message || 'Failed to trigger receipt download.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking?\nEstimated Refund: ₹${refundAmount || '0.00'}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await hotelService.cancelBooking(tripId);
              if (res && res.success) {
                Alert.alert('Cancelled Successfully', 'Your hotel booking has been cancelled.');
                onBack();
              } else {
                Alert.alert('Cancellation Failed', res.error || 'Unable to cancel booking.');
              }
            } catch (err: any) {
              console.error('Cancel booking error:', err);
              Alert.alert('Error', err.response?.data?.error || 'Failed to request cancellation.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const fetchTripAndRefundDetails = async () => {
      setLoading(true);
      try {
        const res = await hotelService.getTripDetails(tripId);
        if (res && res.success && res.data) {
          setTripData(res.data);
          
          const status = res.data.bookingInfo?.status || '';
          if (String(status).toLowerCase() !== 'cancelled') {
            try {
              const refundRes = await hotelService.getRefundInfo(tripId);
              if (refundRes && refundRes.success && refundRes.data) {
                setRefundAmount(refundRes.data.refundAmount);
              }
            } catch (err) {
              console.error('Failed to fetch refund details:', err);
            }
          }
        } else {
          Alert.alert('Error', 'Failed to retrieve trip details.');
        }
      } catch (err: any) {
        console.error('getTripDetails error:', err);
        Alert.alert('Error', err.response?.data?.error || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTripAndRefundDetails();
  }, [tripId]);
  useEffect(() => {
    const handleBackPress = () => {
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [onBack]);
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  // Fallback / mapping Cleartrip v4 schema
  const hotelName = tripData?.hotelDetail?.name || 'Hotel Europe Plaza';
  const hotelAddress = tripData?.hotelDetail?.address || '';
  const hotelCity = tripData?.hotelDetail?.city || '';
  const checkIn = tripData?.hotelDetail?.checkInDate || '2026-08-25';
  const checkOut = tripData?.hotelDetail?.checkOutDate || '2026-08-26';

  const guestTitle = tripData?.contactDetail?.title || 'Mr.';
  const guestFirstName = tripData?.contactDetail?.firstName || 'Rutuja';
  const guestLastName = tripData?.contactDetail?.lastName || 'Dhayatidak';
  const guestEmail = tripData?.contactDetail?.email || 'rdhayatidak@gmail.com';
  const guestPhone = tripData?.contactDetail?.mobile || '9876543210';
  const guestLandline = tripData?.contactDetail?.landline || '';

  const paymentType = tripData?.paymentDetail?.paymentType || 'DA';
  const paymentAmount = tripData?.paymentDetail?.amount || '3087.00';
  const paymentCurrency = tripData?.paymentDetail?.currency || 'INR';
  const paymentStatus = tripData?.paymentDetail?.status || 'SUCCESS';

  const roomRate = tripData?.pricing?.roomRate ? `₹${Math.round(tripData.pricing.roomRate)}` : '₹3,279.5';
  const hotelTaxes = tripData?.pricing?.hotelTaxes ? `₹${Math.round(tripData.pricing.hotelTaxes)}` : '₹157.5';
  const discount = tripData?.pricing?.discount ? `₹${Math.round(tripData.pricing.discount)}` : '₹350';
  const cashback = tripData?.pricing?.cashback ? `₹${Math.round(tripData.pricing.cashback)}` : '₹0';
  const totalFare = tripData?.pricing?.totalFare ? `₹${Math.round(tripData.pricing.totalFare)}` : '₹3,087';
  const totalFee = tripData?.pricing?.totalFee ? `₹${Math.round(tripData.pricing.totalFee)}` : '₹0';
  const serviceTax = tripData?.pricing?.serviceTax ? `₹${Math.round(tripData.pricing.serviceTax)}` : '₹0';

  const bookingStatus = tripData?.bookingInfo?.bookingStatus || 'Confirmed';
  const voucherNo = tripData?.bookingInfo?.voucherNumber || '7397419607830';

  const roomName = tripData?.rooms?.[0]?.roomName || tripData?.rooms?.[0]?.roomTypeName || 'Standard Room with Window';
  const adultsCount = tripData?.rooms?.[0]?.guests?.adults || 2;

  const cancellationPolicyText = tripData?.cancellationPolicy?.text || '';
  const cancellationPolicySlabs = tripData?.cancellationPolicy?.cancellationPolicySlabs || [];
  const panCardNumber = tripData?.panCardNumber || '';
  const hotelIdValue = tripData?.hotelDetail?.hotelId || '1352788';

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  const formatTimestamp = (ts: number) => {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return String(ts);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barcode Mock Card */}
        <View style={styles.barcodeCard}>
          <View style={styles.barcodeLinesContainer}>
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((width, idx) => (
              <View
                key={idx}
                style={[
                  styles.barcodeLine,
                  { width: width * 1.8, marginRight: idx % 3 === 0 ? 3 : 1.5 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.barcodeFooterText}>VOUCHER NO: {voucherNo}</Text>
        </View>

        {/* Section 1: Hotel & Stay Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hotel & Stay Details</Text>
          <View style={styles.cardDivider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hotel Name</Text>
            <Text style={styles.value}>{hotelName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hotel ID</Text>
            <Text style={styles.value}>{hotelIdValue}</Text>
          </View>
          {hotelAddress ? (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.label}>Address</Text>
              <Text style={[styles.value, { fontSize: 13, textAlign: 'right', flex: 1, paddingLeft: 12 }]}>
                {hotelAddress}
              </Text>
            </View>
          ) : null}
          {hotelCity ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>City</Text>
              <Text style={styles.value}>{hotelCity}</Text>
            </View>
          ) : null}
          
          <View style={styles.dashedDividerMini} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Check In</Text>
            <Text style={styles.value}>{formatDate(checkIn)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Check Out</Text>
            <Text style={styles.value}>{formatDate(checkOut)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Room Type</Text>
            <Text style={styles.value}>{roomName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Guests</Text>
            <Text style={styles.value}>{adultsCount} Adults</Text>
          </View>
        </View>

        {/* Section 2: Contact & Voucher Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact & Guest Details</Text>
          <View style={styles.cardDivider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Guest Name</Text>
            <Text style={styles.value}>{guestTitle} {guestFirstName} {guestLastName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{guestEmail}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{guestPhone}</Text>
          </View>
          {guestLandline ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Landline</Text>
              <Text style={styles.value}>{guestLandline}</Text>
            </View>
          ) : null}
          {panCardNumber ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>PAN Card Number</Text>
              <Text style={styles.value}>{panCardNumber}</Text>
            </View>
          ) : null}
          
          <View style={styles.dashedDividerMini} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Trip ID</Text>
            <Text style={[styles.value, { color: '#2563eb' }]}>{tripId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Booking Status</Text>
            <Text style={[styles.value, { color: '#16a34a', fontWeight: '800' }]}>{bookingStatus}</Text>
          </View>
        </View>

        {/* Section 3: Billing & Price Breakup Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment & Fare Breakup</Text>
          <View style={styles.cardDivider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Room Rate</Text>
            <Text style={styles.value}>{roomRate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hotel Taxes</Text>
            <Text style={styles.value}>{hotelTaxes}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Discount</Text>
            <Text style={[styles.value, { color: '#16a34a' }]}>-{discount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Cashback</Text>
            <Text style={styles.value}>{cashback}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service Tax</Text>
            <Text style={styles.value}>{serviceTax}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total Fee</Text>
            <Text style={styles.value}>{totalFee}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment Status</Text>
            <Text style={[styles.value, { color: '#16a34a', fontWeight: '800' }]}>{paymentStatus}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment Type</Text>
            <Text style={styles.value}>{paymentType}</Text>
          </View>
          
          <View style={styles.dashedDividerTotal} />
          
          <View style={[styles.detailRow, { paddingTop: 6 }]}>
            <Text style={[styles.label, { fontWeight: '800', color: '#0f172a', fontSize: 14.5 }]}>Total Paid</Text>
            <Text style={[styles.value, { fontWeight: '900', color: '#2563eb', fontSize: 18.5 }]}>
              {paymentCurrency} {totalFare}
            </Text>
          </View>
        </View>

        {/* Section 3.5: Cancellation Refund Summary Card */}
        {bookingStatus.toLowerCase() !== 'cancelled' && refundAmount !== null ? (
          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <Text style={styles.refundTitle}>Estimated Refund Value</Text>
              <Text style={styles.refundBadge}>Estimation</Text>
            </View>
            <View style={styles.refundDivider} />
            <Text style={styles.refundDescription}>
              If you request cancellation for this booking now, your estimated refund amount will be:
            </Text>
            <Text style={styles.refundValueText}>
              ₹{refundAmount}
            </Text>
            <Text style={styles.refundSubText}>
              *Calculated in real-time according to hotel cancellation policies.
            </Text>
          </View>
        ) : null}

        {/* Section 4: Cancellation Policy Card */}
        {cancellationPolicyText ? (
          <View style={[styles.card, { borderColor: '#fbcfe8', backgroundColor: '#fffdfd' }]}>
            <Text style={[styles.cardTitle, { color: '#9d174d' }]}>Cancellation Policy</Text>
            <View style={[styles.cardDivider, { backgroundColor: '#fbcfe8' }]} />
            
            <Text style={styles.policyText}>
              {cancellationPolicyText}
            </Text>
            
            {cancellationPolicySlabs.length > 0 ? (
              <View style={styles.policySlabContainer}>
                <Text style={styles.policySlabTitle}>Cancellation Penalty Matrix:</Text>
                {cancellationPolicySlabs.map((slab: any, idx: number) => (
                  <View key={idx} style={styles.policySlabRow}>
                    <Text style={styles.policySlabPeriod}>
                      {formatTimestamp(slab.startTime)} to {formatTimestamp(slab.endTime)}
                    </Text>
                    <Text style={styles.policySlabPenalty}>
                      ₹{slab.penaltyAmount}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footerBar}>
        {bookingStatus.toLowerCase() !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancelBooking}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#e11d48" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.downloadBtn, 
            downloading && { opacity: 0.6 },
            bookingStatus.toLowerCase() === 'cancelled' && { marginLeft: 0 }
          ]}
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.85}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.downloadBtnText}>Download E-Receipt</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14.5,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  barcodeCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  barcodeLinesContainer: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#0f172a',
  },
  barcodeFooterText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 1.5,
    fontFamily: FONT_FAMILY,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  value: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    maxWidth: '70%',
  },
  dashedDividerMini: {
    height: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  dashedDividerTotal: {
    height: 1.5,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  policyText: {
    fontSize: 12.5,
    color: '#9d174d',
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  policySlabContainer: {
    borderTopWidth: 0.5,
    borderColor: '#fbcfe8',
    paddingTop: 10,
    marginTop: 8,
  },
  policySlabTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9d174d',
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  policySlabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  policySlabPeriod: {
    fontSize: 11.5,
    color: '#9d174d',
    fontFamily: FONT_FAMILY,
  },
  policySlabPenalty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e11d48',
    fontFamily: FONT_FAMILY,
  },
  footerBar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
  cancelBtn: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#e11d48',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
  refundCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refundTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  refundBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  refundDivider: {
    height: 1,
    backgroundColor: '#fde68a',
    marginBottom: 12,
  },
  refundDescription: {
    fontSize: 12.5,
    color: '#78350f',
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  refundValueText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#d97706',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  refundSubText: {
    fontSize: 10.5,
    color: '#b45309',
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY,
  },
});
