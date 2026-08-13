import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Modal,
} from 'react-native';
import { hotelService } from '../api';
import { flightService } from '../api/flightService';
import { BASE_URL, getAuthToken } from '../api/apiClient';

const Skeleton = ({ width, height, borderRadius = 8, style = {} }: any) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e2e8f0',
          opacity,
        },
        style,
      ]}
    />
  );
};

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface BookingDetailsProps {
  tripId: string;
  category?: 'Flight' | 'Hotel';
  onBack: () => void;
}

export default function BookingDetails({ tripId, category, onBack }: BookingDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reasonsModalVisible, setReasonsModalVisible] = useState(false);
  const [cancelReasonsList, setCancelReasonsList] = useState<any[]>([]);
  const [cancellingFlight, setCancellingFlight] = useState(false);

  const isFlight = category === 'Flight' || tripId.startsWith('DC_') || tripId.includes('-');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getAuthToken();
      const downloadUrl = isFlight 
        ? `${BASE_URL}/flights/trip/${tripId}/download-receipt?token=${token || ''}`
        : `${BASE_URL}/hotels/trip/${tripId}/download-receipt?token=${token || ''}`;
      
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
    if (isFlight) {
      setCancelling(true);
      try {
        console.log('[BookingDetails] Fetching cancel reasons from API...');
        const resReasons = await flightService.getCancelReasons(tripId);
        const reasons = resReasons.reasons || resReasons.data?.reasons || [];
        
        if (reasons.length === 0) {
          const fallbackReasons = [
            { reason: "My plans changed", reason_code: "PassengerDecidedNotToTravel" },
            { reason: "I directly cancelled with airline", reason_code: "FlightDelayOrCancellationByAirline" },
            { reason: "Flight rescheduled by airline", reason_code: "MedicalEmergency" },
            { reason: "Flight cancelled by airline", reason_code: "Other" }
          ];
          setCancelReasonsList(fallbackReasons);
        } else {
          setCancelReasonsList(reasons);
        }
        setReasonsModalVisible(true);
      } catch (err: any) {
        console.error('[BookingDetails] Get reasons error:', err);
        const fallbackReasons = [
          { reason: "My plans changed", reason_code: "PassengerDecidedNotToTravel" },
          { reason: "I directly cancelled with airline", reason_code: "FlightDelayOrCancellationByAirline" },
          { reason: "Flight rescheduled by airline", reason_code: "MedicalEmergency" },
          { reason: "Flight cancelled by airline", reason_code: "Other" }
        ];
        setCancelReasonsList(fallbackReasons);
        setReasonsModalVisible(true);
      } finally {
        setCancelling(false);
      }
    } else {
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
    }
  };

  const [checkingRefund, setCheckingRefund] = useState(false);

  const handleCheckRefund = async () => {
    setCheckingRefund(true);
    try {
      if (isFlight) {
        const res = await flightService.getRefundInfo(tripId);
        if (res && res.success && res.data) {
          const rd = res.data;
          const refundInfo = rd.refund_info || {};
          const keys = Object.keys(refundInfo);
          const refundDetails = keys.length > 0 ? refundInfo[keys[0]] : [];
          
          if (refundDetails.length > 0) {
            const totalRefund = refundDetails.reduce((sum: number, item: any) => sum + (Number(item.refund_amount) || 0), 0);
            const status = refundDetails[0]?.booking_status || 'N/A';
            const cancelledTime = refundDetails[0]?.cancelled_time || 'N/A';
            const sector = refundDetails[0]?.sector || '';
            
            Alert.alert(
              'Refund Details',
              `Status: ${status}\nTotal Refund: ₹${totalRefund}\nSector: ${sector}\nCancelled Time: ${cancelledTime}\nRef ID: ${keys[0]}`,
              [{ text: 'OK' }]
            );
          } else if (rd.status) {
            Alert.alert('Refund Details', `Refund Status: ${rd.status}\n${rd.message || ''}`);
          } else {
            Alert.alert('Refund Details', 'No refund details found for this cancelled trip.');
          }
        } else {
          Alert.alert('Refund Details', 'No refund details found.');
        }
      } else {
        const res = await hotelService.getRefundInfo(tripId);
        if (res && res.success && res.data) {
          Alert.alert(
            'Refund Details',
            `Refund Amount: ₹${res.data.refundAmount || '0.00'}\nStatus: ${res.data.status || 'N/A'}`
          );
        } else {
          Alert.alert('Refund Details', 'No refund details found.');
        }
      }
    } catch (err: any) {
      console.error('Failed to get refund info:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch refund details.';
      Alert.alert('Refund Details Error', errMsg);
    } finally {
      setCheckingRefund(false);
    }
  };

  useEffect(() => {
    const fetchTripAndRefundDetails = async () => {
      setLoading(true);
      try {
        if (isFlight) {
          const res = await flightService.getTripDetails(tripId);
          if (res && res.success && res.data) {
            setTripData(res.data);
            
            const bd = res.data.booking_details || res.data || {};
            const status = bd.booking_status || '';
            const isCancelled = status === 'Cancelled' || status === 'CANCELLED' || status === 'C' || status === 'Q';
            if (!isCancelled) {
              try {
                const refundRes = await flightService.getRefundInfo(tripId);
                if (refundRes && refundRes.success && refundRes.data) {
                  const rd = refundRes.data;
                  const refundInfo = rd.refund_info || {};
                  const keys = Object.keys(refundInfo);
                  const refundDetails = keys.length > 0 ? refundInfo[keys[0]] : [];
                  if (refundDetails.length > 0) {
                    const totalRefund = refundDetails.reduce((sum: number, item: any) => sum + (Number(item.refund_amount) || 0), 0);
                    setRefundAmount(String(totalRefund));
                  }
                }
              } catch (err) {
                console.error('Failed to fetch flight refund details:', err);
              }
            }
          } else {
            Alert.alert('Error', 'Failed to retrieve flight trip details.');
          }
        } else {
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
            Alert.alert('Error', 'Failed to retrieve hotel trip details.');
          }
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Header skeleton */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={140} height={20} />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Main Card Skeleton */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Skeleton width={100} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={160} height={24} />
              </View>
              <Skeleton width={80} height={30} borderRadius={15} />
            </View>

            {/* Banner/Image skeleton */}
            <Skeleton width="100%" height={180} borderRadius={16} style={{ marginBottom: 24 }} />

            {/* Grid details skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={110} height={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={110} height={16} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={110} height={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={110} height={16} />
              </View>
            </View>

            <Skeleton width="100%" height={1} style={{ backgroundColor: '#f1f5f9', marginBottom: 24 }} />

            {/* Bottom buttons skeleton */}
            <Skeleton width="100%" height={50} borderRadius={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={50} borderRadius={16} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Data Mapping
  const hotelName = tripData?.hotelDetail?.name || 'Hotel Europe Plaza';
  const hotelAddress = tripData?.hotelDetail?.address || '';
  const hotelCity = tripData?.hotelDetail?.city || 'Goa';
  const checkIn = tripData?.hotelDetail?.checkInDate || '2026-08-25';
  const checkOut = tripData?.hotelDetail?.checkOutDate || '2026-08-26';

  const guestTitle = tripData?.contactDetail?.title || 'Mr.';
  const guestFirstName = tripData?.contactDetail?.firstName || 'Rutuja';
  const guestLastName = tripData?.contactDetail?.lastName || 'Dhayatidak';

  const hotelBookingStatus = tripData?.bookingInfo?.bookingStatus || 'Confirmed';
  const voucherNo = tripData?.bookingInfo?.voucherNumber || '7397419607830';
  const roomName = tripData?.rooms?.[0]?.roomName || tripData?.rooms?.[0]?.roomTypeName || 'Standard Room';
  const hotelIdValue = tripData?.hotelDetail?.hotelId || '1352788';

  const formatDateShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  const cityCode = hotelCity.slice(0, 3).toUpperCase();

  // Flight Data Mapping
  const bd = tripData?.booking_details || tripData || {};
  const jd = bd.journey_details || {};
  const firstFlight = jd.flight_details?.[0] || {};
  const segmentsList = firstFlight.segment_details || [];
  const firstSegment = segmentsList[0] || {};
  const lastSegment = segmentsList[segmentsList.length - 1] || firstSegment;
  const paxList = jd.traveller_details || tripData?.passengers || [];

  const liveStatus = bd.booking_status || '';
  const flightStatus = (liveStatus === 'Cancelled' || liveStatus === 'CANCELLED' || liveStatus === 'C' || liveStatus === 'Q') 
    ? 'Cancelled' 
    : (liveStatus === 'Z' ? 'Pending' : (liveStatus === 'P' || liveStatus === 'B' || liveStatus === 'CONFIRMED' ? 'Confirmed' : 'Confirmed'));

  const segmentStr = segmentsList.map((s: any) => `${s.al || s.oa || 'SG'} ${s.fn || ''}`).join(' + ') || 'SG 106';

  const origCode = firstSegment.dep || 'DEL';
  const destCode = lastSegment.arr || 'PNQ';
  const origCity = jd.meta_data?.airports?.[origCode]?.city || 'Delhi';
  const destCity = jd.meta_data?.airports?.[destCode]?.city || 'Pune';

  const depDateTime = firstSegment.dd ? new Date(Number(firstSegment.dd)) : (firstSegment.dt ? new Date(firstSegment.dt) : null);
  const arrDateTime = lastSegment.ad ? new Date(Number(lastSegment.ad)) : (lastSegment.at ? new Date(lastSegment.at) : null);

  const depTime = depDateTime && !isNaN(depDateTime.getTime()) 
    ? depDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
    : '12:00 PM';
  const arrTime = arrDateTime && !isNaN(arrDateTime.getTime()) 
    ? arrDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
    : '02:00 PM';
  const depDate = depDateTime && !isNaN(depDateTime.getTime()) 
    ? depDateTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : 'Aug 28, 2026';
  const arrDate = arrDateTime && !isNaN(arrDateTime.getTime()) 
    ? arrDateTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : 'Aug 28, 2026';

  const pnrVal = firstSegment.booking_infos?.[0]?.pnr || bd.pnr || tripData?.pnr || 'N/A';
  
  // Dynamic Traveller names join
  const travellerName = paxList.map((p: any) => `${p.title ? p.title + ' ' : ''}${p.fn || p.first_name || p.firstName || ''} ${p.ln || p.last_name || p.lastName || ''}`.trim()).join(', ') || 'Traveller';

  const cabinVal = firstSegment.booking_infos?.[0]?.cabin_type === 'E' ? 'Economy' : 'Business';
  
  // Dynamic Seat display
  const seatNumber = paxList.map((p: any) => p.seatNumber || p.selectedSeat || '').filter(Boolean).join(', ') || 'Not Selected';
  
  // Dynamic Terminal and Gate
  const terminalVal = firstSegment.booking_infos?.[0]?.terminal || tripData?.flightDetails?.terminal || 'N/A';
  const gateVal = firstSegment.booking_infos?.[0]?.gate || 'N/A';

  const baggageObj = firstSegment.baggage?.ADT || {};
  const cabBag = baggageObj.cab || '7 kg';
  const cibBag = baggageObj.cib || '15 kg';
  const baggageStr = `Cabin ${cabBag}, Check-in ${cibBag}`;

  const airlineCode = firstSegment.al || firstSegment.oa || 'SG';
  const airlineName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || tripData?.flightDetails?.airline || airlineCode;
  const themeBg = airlineCode === '6E' ? '#1e3a8a' : (airlineCode === 'AI' ? '#c2185b' : '#ef4444');

  const displayStatus = isFlight ? flightStatus : hotelBookingStatus;

  const bookedDateVal = bd.booked_date ? bd.booked_date : (tripData?.createdAt || Date.now());
  const formatDateFull = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const d = new Date(Number(timestamp));
    if (isNaN(d.getTime())) return String(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minStr} ${ampm}`;
  };
  const bookedOnStr = formatDateFull(bookedDateVal);

  return (
    <SafeAreaView style={[styles.container, isFlight && { backgroundColor: themeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={isFlight ? themeBg : "#ef4444"} />

      {/* Header */}
      <View style={[styles.header, isFlight && { backgroundColor: themeBg }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Ticket</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Ticket Card Container */}
        <View style={styles.ticketCard}>
          {/* Top Section */}
          <View style={styles.ticketTop}>
            {/* JFK / LHR Flow */}
            <View style={styles.routeContainer}>
              <View style={styles.routeNode}>
                <Text style={styles.airportCode}>{isFlight ? origCode : 'GOA'}</Text>
                <Text style={styles.cityName}>{isFlight ? origCity : 'GOAIR HQ'}</Text>
                <Text style={styles.dateTimeText}>{isFlight ? depDate : formatDateShort(checkIn)}</Text>
                <Text style={styles.dateTimeText}>{isFlight ? depTime : '12:00 PM'}</Text>
              </View>

              <View style={styles.routeSeparator}>
                <View style={styles.dotLine} />
                <Text style={styles.planeIcon}>✈️</Text>
                <View style={styles.dotLine} />
              </View>

              <View style={[styles.routeNode, { alignItems: 'flex-end' }]}>
                <Text style={styles.airportCode}>{isFlight ? destCode : cityCode}</Text>
                <Text style={styles.cityName} numberOfLines={1}>{isFlight ? destCity : hotelCity.toUpperCase()}</Text>
                <Text style={styles.dateTimeText}>{isFlight ? arrDate : formatDateShort(checkOut)}</Text>
                <Text style={styles.dateTimeText}>{isFlight ? arrTime : '11:00 AM'}</Text>
              </View>
            </View>

            {/* Passenger Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Passenger</Text>
                  <Text style={styles.gridValue} numberOfLines={2}>
                    {isFlight ? travellerName : `${guestTitle} ${guestFirstName} ${guestLastName}`}
                  </Text>
                </View>
                <View style={[styles.gridCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.gridLabel}>{isFlight ? 'Airline / Flight' : 'Hotel / Voucher'}</Text>
                  <Text style={styles.gridValue} numberOfLines={1}>
                    {isFlight ? `${airlineName} (${segmentStr})` : hotelName.slice(0, 15)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>{isFlight ? 'Cabin / Seat' : 'Room Type'}</Text>
                  <Text style={styles.gridValue} numberOfLines={1}>
                    {isFlight ? `${cabinVal} / ${seatNumber}` : roomName}
                  </Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>{isFlight ? 'Terminal / Gate' : 'Hotel ID'}</Text>
                  <Text style={styles.gridValue}>{isFlight ? `${terminalVal} / ${gateVal}` : hotelIdValue}</Text>
                </View>
                <View style={[styles.gridCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.gridLabel}>Status</Text>
                  <Text style={[styles.gridValue, { color: displayStatus.toLowerCase() === 'cancelled' ? '#94a3b8' : '#ef4444' }]}>{displayStatus}</Text>
                </View>
              </View>

              {isFlight && (
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Baggage Allowance</Text>
                    <Text style={styles.gridValue}>{baggageStr}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Ticket punch notches & dashed line */}
          <View style={styles.punchContainer}>
            <View style={styles.leftNotch} />
            <View style={styles.dashedLine} />
            <View style={styles.rightNotch} />
          </View>

          {/* Bottom Section */}
          <View style={styles.ticketBottom}>
            {/* Mock Barcode */}
            <View style={styles.barcodeContainer}>
              <View style={styles.barcodeLines}>
                {[2, 4, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1].map((width, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.barcodeBar,
                      { width: width * 1.5, marginRight: idx % 3 === 0 ? 3 : 1.5 },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.voucherLabel}>{isFlight ? `PNR: ${pnrVal}` : `VOUCHER: ${voucherNo}`}</Text>
            </View>

            {/* Download Ticket Button */}
            <TouchableOpacity
              style={[styles.downloadBtn, downloading && { opacity: 0.8 }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.9}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.downloadBtnText}>DOWNLOAD TICKET</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Journey Timeline Card (For Multi-segment / Stop flights) */}
        {isFlight && segmentsList.length > 0 && (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
              ✈️ FLIGHT JOURNEY TIMELINE
            </Text>
            {segmentsList.map((segment: any, index: number) => {
              const segDepDate = segment.dd ? new Date(Number(segment.dd)) : (segment.dt ? new Date(segment.dt) : null);
              const segArrDate = segment.ad ? new Date(Number(segment.ad)) : (segment.at ? new Date(segment.at) : null);
              const depT = segDepDate && !isNaN(segDepDate.getTime()) ? segDepDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
              const arrT = segArrDate && !isNaN(segArrDate.getTime()) ? segArrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
              const depD = segDepDate && !isNaN(segDepDate.getTime()) ? segDepDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A';
              const arrD = segArrDate && !isNaN(segArrDate.getTime()) ? segArrDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A';
              
              const segAirline = jd.meta_data?.airlines?.[segment.al || segment.oa]?.name || segment.al || segment.oa || 'Airline';
              const flightNo = `${segment.al || segment.oa} ${segment.fn}`;
              
              // Calculate layover if not the last segment
              let layoverText = '';
              if (index < segmentsList.length - 1) {
                const nextSeg = segmentsList[index + 1];
                const nextSegDep = nextSeg.dd ? Number(nextSeg.dd) : (nextSeg.dt ? new Date(nextSeg.dt).getTime() : null);
                const currentSegArr = segment.ad ? Number(segment.ad) : (segment.at ? new Date(segment.at).getTime() : null);
                if (nextSegDep && currentSegArr) {
                  const diffMs = nextSegDep - currentSegArr;
                  const hrs = Math.floor(diffMs / (1000 * 60 * 60));
                  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  layoverText = `Layover at ${segment.arr}: ${hrs}h ${mins}m`;
                }
              }

              return (
                <View key={index} style={{ marginBottom: index === segmentsList.length - 1 ? 0 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>Segment {index + 1}: {flightNo}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>({segAirline})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: '#ef4444' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{segment.dep} ➔ {segment.arr}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Dep: {depD} at {depT}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>Arr: {arrD} at {arrT}</Text>
                    </View>
                  </View>
                  {layoverText ? (
                    <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginTop: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444', textAlign: 'center' }}>🕒 {layoverText}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Booking Details Metadata Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
            📋 BOOKING SUMMARY
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Trip ID</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{tripId}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Booked Date</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{bookedOnStr}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Booking Type</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{bd.booking_type || 'ONLINE'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Selected Insurance</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
              {bd.selected_insurances && bd.selected_insurances.length > 0 ? bd.selected_insurances.join(', ') : 'None'}
            </Text>
          </View>

          {/* User Details / Contact Section */}
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1e293b', marginTop: 14, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
            👤 CONTACT DETAILS
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Name</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
              {bd.user_details?.title || 'MR'} {bd.user_details?.first_name || ''} {bd.user_details?.last_name || ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Phone</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{bd.user_details?.phone || 'N/A'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Email</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{bd.user_details?.email || 'N/A'}</Text>
          </View>
        </View>

        {/* Payment & Transaction Details Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
            💳 PAYMENT BREAKDOWN
          </Text>

          {(() => {
            const pricing = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0] || {};
            const total = bd.payment_details?.booking_payment_breakup?.total || tripData?.fareDetails?.totalAmount || 0;
            const base = pricing.base_fare || tripData?.fareDetails?.baseFare || 0;
            const tax = pricing.total_taxes || pricing.total_tax || tripData?.fareDetails?.taxes || 0;
            const conv = pricing.convenience_fees || 0;
            const brand = pricing.fare_group?.brand_name || 'ECO FLEX';

            const fwdTxn = tripData?.fwd_txns?.[0] || bd.fwd_txns?.[0] || {};
            const txnTime = fwdTxn.transaction_time ? formatDateFull(fwdTxn.transaction_time) : 'N/A';
            const txnStatus = fwdTxn.status === 'S' ? 'SUCCESSFUL' : (fwdTxn.status || 'SUCCESSFUL');

            return (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Base Fare</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>₹{base.toLocaleString('en-IN')}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Taxes & Fees</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>₹{tax.toLocaleString('en-IN')}</Text>
                </View>

                {conv > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>Convenience Fee</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>₹{conv.toLocaleString('en-IN')}</Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Fare Brand</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0ea5e9' }}>{brand}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>Total Paid</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#16a34a' }}>₹{total.toLocaleString('en-IN')}</Text>
                </View>

                {/* Transaction status */}
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1e293b', marginTop: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
                  🔗 TRANSACTION INFORMATION
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Payment Status</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>{txnStatus}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Transaction Time</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{txnTime}</Text>
                </View>

                {/* Reversal / Refund transactions */}
                {(() => {
                  const revTxnsList = tripData?.rev_txns || bd.rev_txns || [];
                  if (revTxnsList.length > 0) {
                    return (
                      <View>
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1e293b', marginTop: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
                          🔄 REFUND ACTIVITY (rev_txns)
                        </Text>
                        {revTxnsList.map((txn: any, idx: number) => (
                          <View key={idx} style={{ marginTop: 6, paddingVertical: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 13, color: '#64748b' }}>Refund Amount</Text>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>₹{txn.amount}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 13, color: '#64748b' }}>Refund Status</Text>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#3b82f6' }}>{txn.status === 'S' ? 'SUCCESS' : (txn.status || 'PENDING')}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  } else {
                    return (
                      <View style={{ marginTop: 10 }}>
                        <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, color: '#64748b' }}>Refund Activity (rev_txns)</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>None</Text>
                        </View>
                      </View>
                    );
                  }
                })()}
              </View>
            );
          })()}
        </View>

        {/* Extra Action: Cancel Booking */}
        {displayStatus.toLowerCase() !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancelBooking}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Extra Action: Check Refund Details */}
        {displayStatus.toLowerCase() === 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelBtn, checkingRefund && { opacity: 0.6 }]}
            onPress={handleCheckRefund}
            disabled={checkingRefund}
            activeOpacity={0.8}
          >
            {checkingRefund ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.cancelBtnText}>Check Refund Details</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Select Cancellation Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reasonsModalVisible}
        onRequestClose={() => setReasonsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Select Cancellation Reason</Text>
              <TouchableOpacity onPress={() => setReasonsModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 20, color: '#64748b', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable list of reasons */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {cancelReasonsList.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    backgroundColor: '#ffffff',
                  }}
                  onPress={async () => {
                    setReasonsModalVisible(false);
                    setCancelling(true);
                    try {
                      console.log('[BookingDetails] Fetching refund preview for reason:', item.reason_code);
                      const refundRes = await flightService.getCancelRefundInfo(tripId, item.reason_code);
                      console.log('[BookingDetails] Refund preview response:', refundRes);

                      const preview = refundRes?.data || refundRes || {};
                      const totalFare = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group?.total_fare || tripData?.fareDetails?.totalAmount || 0;
                      const gross = preview.gross_amount ?? totalFare;
                      const penalty = preview.airline_charge ?? 3000;
                      const partner = preview.partner_fee ?? 0;
                      const refund = preview.refund_amount ?? Math.max(0, gross - penalty - partner);

                      Alert.alert(
                        'Confirm Cancellation & Refund',
                        `Refund Breakdown:\n\n• Gross Ticket Fare: ₹${gross.toLocaleString('en-IN')}\n• Airline Penalty: ₹${penalty.toLocaleString('en-IN')}\n• Convenience Fee: ₹${partner.toLocaleString('en-IN')}\n• Est. Refund Amount: ₹${refund.toLocaleString('en-IN')}\n\nAre you sure you want to proceed?`,
                        [
                          {
                            text: 'Keep Booking',
                            style: 'cancel',
                            onPress: () => setCancelling(false)
                          },
                          {
                            text: 'Cancel Flight',
                            style: 'destructive',
                            onPress: async () => {
                              setCancelling(true);
                              try {
                                const cancelRes = await flightService.cancelFlight(
                                  tripId,
                                  item.reason_code,
                                  'User confirmed cancellation after previewing refund details.'
                                );
                                if (cancelRes && cancelRes.success) {
                                  Alert.alert('Success', 'Flight booking has been cancelled successfully.');
                                  onBack();
                                } else {
                                  Alert.alert('Error', cancelRes.error || 'Failed to cancel flight.');
                                }
                              } catch (err: any) {
                                console.error('Cancellation execution error:', err);
                                Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to execute cancellation.');
                              } finally {
                                setCancelling(false);
                              }
                            }
                          }
                        ]
                      );
                    } catch (err: any) {
                      console.error('Refund preview fetch error:', err);
                      // Fallback warning dialog to allow proceeding if preview API fails
                      Alert.alert(
                        'Preview Failed',
                        'Failed to fetch live refund calculations. Would you like to proceed with standard cancellation rules?',
                        [
                          {
                            text: 'Keep Booking',
                            style: 'cancel',
                            onPress: () => setCancelling(false)
                          },
                          {
                            text: 'Cancel Flight',
                            style: 'destructive',
                            onPress: async () => {
                              setCancelling(true);
                              try {
                                const cancelRes = await flightService.cancelFlight(
                                  tripId,
                                  item.reason_code,
                                  'User proceeded with cancellation without preview.'
                                );
                                if (cancelRes && cancelRes.success) {
                                  Alert.alert('Success', 'Flight booking has been cancelled successfully.');
                                  onBack();
                                } else {
                                  Alert.alert('Error', cancelRes.error || 'Failed to cancel flight.');
                                }
                              } catch (err: any) {
                                Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to execute cancellation.');
                              } finally {
                                setCancelling(false);
                              }
                            }
                          }
                        ]
                      );
                    }
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#334155', fontWeight: '600' }}>
                    {item.reason || item.reason_code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ef4444', // Red themed outer background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ef4444',
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
    backgroundColor: '#ef4444',
    ...Platform.select({
      ios: { paddingTop: 10 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backArrow: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: 24,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  routeNode: {
    flex: 1,
  },
  airportCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
    fontFamily: FONT_FAMILY,
  },
  cityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  dateTimeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  routeSeparator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dotLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderStyle: 'dashed',
  },
  planeIcon: {
    fontSize: 18,
    color: '#ef4444',
    marginHorizontal: 6,
  },
  infoGrid: {
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCol: {
    flex: 1,
    marginRight: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  punchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    backgroundColor: 'transparent',
  },
  leftNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    marginLeft: -12,
  },
  rightNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    marginRight: -12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  ticketBottom: {
    padding: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  barcodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#1e293b',
  },
  voucherLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY,
  },
  downloadBtn: {
    width: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  cancelBtn: {
    marginTop: 20,
    borderColor: '#ffffff',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
});
