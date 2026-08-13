import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Linking,
  Animated,
} from 'react-native';
import { hotelService, flightService } from '../api';
import BookingDetails from './BookingDetails';
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

const FONT_FAMILY = 'Outfit-Regular';
const FONT_BOLD = 'Outfit-Bold';
const FONT_SEMI = 'Outfit-SemiBold';

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
  const [selectedFlightTicket, setSelectedFlightTicket] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [cancellingFlight, setCancellingFlight] = useState(false);
  const [reasonsModalVisible, setReasonsModalVisible] = useState(false);
  const [cancelReasonsList, setCancelReasonsList] = useState<any[]>([]);
  const [refundPreview, setRefundPreview] = useState<any>(null);
  const [loadingRefundPreview, setLoadingRefundPreview] = useState(false);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string | null>(null);

  useEffect(() => {
    const handleBackPress = () => {
      if (selectedTripId) {
        setSelectedTripId(null);
        return true;
      }
      if (selectedFlightTicket) {
        setSelectedFlightTicket(null);
        return true;
      }
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [selectedTripId, selectedFlightTicket, onBack]);

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

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (selectedTripId) {
    return <BookingDetails tripId={selectedTripId} category={activeCategory} onBack={() => {
      setSelectedTripId(null);
      fetchAllBookings();
    }} />;
  }

  if (selectedFlightTicket) {
    const bd = selectedFlightTicket.booking_details || selectedFlightTicket;
    const jd = bd.journey_details || {};
    const firstFlight = jd.flight_details?.[0] || {};
    const segmentsList = firstFlight.segment_details || [];
    const firstSegment = segmentsList[0] || {};
    const paxList = jd.traveller_details || selectedFlightTicket.passengers || [];

    const tripId = bd.trip_id || selectedFlightTicket.tripId || 'N/A';
    const handleDownloadFlight = async () => {
      try {
        const token = getAuthToken();
        const downloadUrl = `${BASE_URL}/flights/trip/${tripId}/download-receipt?token=${token || ''}`;
        console.log('Opening flight ticket download url:', downloadUrl);
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          Alert.alert('Error', 'Unable to open download link in default browser.');
        }
      } catch (err: any) {
        console.error('Download ticket error:', err);
        Alert.alert('Error', err.message || 'Failed to download flight ticket.');
      }
    };
    const handleCancelFlight = async () => {
      console.log('[handleCancelFlight] Button clicked. tripId:', tripId);
      setCancellingFlight(true);
      try {
        console.log('[handleCancelFlight] Fetching cancel reasons from API...');
        const resReasons = await flightService.getCancelReasons(tripId);
        console.log('[handleCancelFlight] Response received:', resReasons);
        const reasons = resReasons.reasons || resReasons.data?.reasons || [];
        
        if (reasons.length === 0) {
          console.warn('[handleCancelFlight] No reasons returned. Using default local fallback reasons.');
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
        console.error('[handleCancelFlight] Get reasons error:', err);
        // Fallback reasons so modal still opens under network issues
        const fallbackReasons = [
          { reason: "My plans changed", reason_code: "PassengerDecidedNotToTravel" },
          { reason: "I directly cancelled with airline", reason_code: "FlightDelayOrCancellationByAirline" },
          { reason: "Flight rescheduled by airline", reason_code: "MedicalEmergency" },
          { reason: "Flight cancelled by airline", reason_code: "Other" }
        ];
        setCancelReasonsList(fallbackReasons);
        setReasonsModalVisible(true);
      } finally {
        setCancellingFlight(false);
      }
    };
    const handleSelectReason = async (reasonItem: any) => {
      setSelectedReasonCode(reasonItem.reason_code);
      setLoadingRefundPreview(true);
      try {
        console.log('[handleSelectReason] Querying refund preview for:', reasonItem.reason_code);
        const res = await flightService.getCancelRefundInfo(tripId, reasonItem.reason_code);
        console.log('[handleSelectReason] Refund preview response:', res);
        if (res && res.success && res.data) {
          setRefundPreview(res.data);
        } else {
          setRefundPreview({
            gross_amount: totalFare,
            airline_charge: 3000,
            partner_fee: 0,
            refund_amount: Math.max(0, totalFare - 3000)
          });
        }
      } catch (err) {
        console.error('[handleSelectReason] Failed to fetch refund preview:', err);
        setRefundPreview({
          gross_amount: totalFare,
          airline_charge: 3000,
          partner_fee: 0,
          refund_amount: Math.max(0, totalFare - 3000)
        });
      } finally {
        setLoadingRefundPreview(false);
      }
    };
    const handleViewRefundInfo = async () => {
      try {
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
          } else {
            Alert.alert('Refund Details', 'No refund details found for this cancelled trip.');
          }
        }
      } catch (err: any) {
        console.error('Failed to get refund info:', err);
        const errMsg = err.response?.data?.message || err.message || 'Failed to fetch refund details.';
        Alert.alert('Refund Details Error', errMsg);
      }
    };
    const liveStatus = bd.booking_status || '';
    const statusVal = (liveStatus === 'Cancelled' || liveStatus === 'CANCELLED' || liveStatus === 'C' || liveStatus === 'Q' || String(liveStatus).toLowerCase() === 'cancelled') 
      ? 'Cancelled' 
      : (liveStatus === 'Z' ? 'Pending' : (liveStatus === 'P' || liveStatus === 'B' || liveStatus === 'CONFIRMED' ? 'Confirmed' : 'Confirmed'));
    const journeyType = jd.journey_type === 'OW' ? 'One Way' : 'Round Trip';
    
    const segmentStr = segmentsList.map((s: any) => `${s.al || s.oa || 'SG'} ${s.fn || ''}`).join(' + ') || 'SG 106';

    const origCode = firstSegment.dep || 'DEL';
    const destCode = segmentsList[segmentsList.length - 1]?.arr || firstSegment.arr || 'PNQ';
    const origCity = jd.meta_data?.airports?.[origCode]?.city || 'Delhi';
    const destCity = jd.meta_data?.airports?.[destCode]?.city || 'Pune';
    const routeStr = `${origCity} (${origCode}) to ${destCity} (${destCode})`;

    let stopStr = 'Non-stop';
    if (segmentsList.length > 1) {
      const layoverCode = segmentsList[0].arr;
      stopStr = `${segmentsList.length - 1} stop via ${layoverCode}`;
    }

    const pnrVal = firstSegment.booking_infos?.[0]?.pnr || bd.pnr || selectedFlightTicket.pnr || 'N/A';
    
    const p = paxList[0];
    const travellerName = p ? `${p.title ? p.title + ' ' : ''}${p.fn || p.first_name || p.firstName || ''} ${p.ln || p.last_name || p.lastName || ''}`.trim() : 'Traveller';

    const fareBrand = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group?.brand_name || 'SPICE MAX';
    const cabinVal = firstSegment.booking_infos?.[0]?.cabin_type === 'E' ? 'Economy' : 'Business';
    const seatNumber = p?.seatNumber || p?.selectedSeat || '27F';
    const terminalVal = firstSegment.booking_infos?.[0]?.terminal || selectedFlightTicket.flightDetails?.terminal || '2A';
    const gateVal = firstSegment.booking_infos?.[0]?.gate || '18';

    const baggageObj = firstSegment.baggage?.ADT || {};
    const cabBag = baggageObj.cab || '7 kg';
    const cibBag = baggageObj.cib || '15 kg';
    const baggageStr = `Cabin ${cabBag}, Check-in ${cibBag}`;

    const airlineCode = firstSegment.al || firstSegment.oa || (selectedFlightTicket.flightDetails?.airline?.toLowerCase().includes('indigo') ? '6E' : (selectedFlightTicket.flightDetails?.airline?.toLowerCase().includes('india') ? 'AI' : ''));
    const airlineName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || selectedFlightTicket.flightDetails?.airline || '';
    const themeBg = airlineCode === '6E' ? '#1e3a8a' : (airlineCode === 'AI' ? '#c2185b' : '#ef4444');

    const middleCode = segmentsList.length > 1 ? segmentsList[0].arr : null;
    const middleAirportCity = middleCode ? jd.meta_data?.airports?.[middleCode]?.city || '' : '';
    const middleAirportName = middleCode ? jd.meta_data?.airports?.[middleCode]?.name || '' : '';
    
    let layoverStr = '';
    if (segmentsList.length > 1) {
      const depTime2 = new Date(segmentsList[1].dt).getTime();
      const arrTime1 = new Date(segmentsList[0].at).getTime();
      const diffMs = depTime2 - arrTime1;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      layoverStr = `${hours} hr ${mins} min layover`;
    } else {
      layoverStr = '';
    }

    const origAirportName = jd.meta_data?.airports?.[origCode]?.name || '';
    const destAirportName = jd.meta_data?.airports?.[destCode]?.name || '';

    const bookedDateVal = bd.booked_date ? bd.booked_date : (selectedFlightTicket.createdAt || Date.now());
    const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minStr} ${ampm}`;
    };
    const bookedOnStr = formatDate(bookedDateVal);

    const contactEmail = bd.user_details?.email || selectedFlightTicket.contactDetails?.email || '';
    const contactPhone = bd.user_details?.phone || selectedFlightTicket.contactDetails?.phone || '';

    const fareGroup = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group || {};
    const baseFare = fareGroup.base_fare || selectedFlightTicket.fareDetails?.baseFare || 0;
    const taxFare = fareGroup.tax || selectedFlightTicket.fareDetails?.taxes || 0;
    const totalFare = fareGroup.total_fare || selectedFlightTicket.fareDetails?.totalAmount || 0;

    const formatSegmentDate = (dateStr: string) => {
      if (!dateStr) return '24 Aug 2026 12:55 AM';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${hours}:${minStr} ${ampm}`;
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ef4444' }}>
        <StatusBar barStyle="light-content" backgroundColor="#ef4444" />
        
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ef4444' }}>
          <TouchableOpacity onPress={() => setSelectedFlightTicket(null)} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <Text style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 19, fontWeight: '700', color: '#ffffff', fontFamily: FONT_BOLD }}>Flight Ticket</Text>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} onPress={() => Alert.alert('Share', 'Sharing booking details...')}>
            <Text style={{ fontSize: 18, color: '#ffffff' }}>📤</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Main Ticket Card Container */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, overflow: 'hidden' }}>
            
            {/* Top Section */}
            <View style={{ padding: 24 }}>
              {/* Airport Codes Flow */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444', fontFamily: FONT_BOLD }}>{origCode}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2, fontFamily: FONT_BOLD }}>{origCity.toUpperCase()}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: FONT_FAMILY }} numberOfLines={1}>
                    {formatSegmentDate(firstSegment.dt || '').split(' ')[3] || '10:30 AM'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{formatSegmentDate(firstSegment.dt || '').split(' ').slice(0, 3).join(' ')}</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                  <View style={{ flex: 1, height: 1, borderWidth: 1, borderColor: '#ef4444', borderStyle: 'dashed' }} />
                  <Text style={{ fontSize: 18, color: '#ef4444', marginHorizontal: 6 }}>✈️</Text>
                  <View style={{ flex: 1, height: 1, borderWidth: 1, borderColor: '#ef4444', borderStyle: 'dashed' }} />
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444', fontFamily: FONT_BOLD }}>{destCode}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2, fontFamily: FONT_BOLD }}>{destCity.toUpperCase()}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: FONT_FAMILY }} numberOfLines={1}>
                    {formatSegmentDate(firstSegment.at || '').split(' ')[3] || '05:27 PM'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{formatSegmentDate(firstSegment.at || '').split(' ').slice(0, 3).join(' ')}</Text>
                </View>
              </View>

              {/* Info Grid */}
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ flex: 1.2, marginRight: 8 }}>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontFamily: FONT_FAMILY }}>Passenger</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }} numberOfLines={2}>{travellerName.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontFamily: FONT_FAMILY }}>Flight</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }}>{segmentStr}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontFamily: FONT_FAMILY }}>Seat</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }}>{seatNumber}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontFamily: FONT_FAMILY }}>Gate</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }}>{gateVal}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontFamily: FONT_FAMILY }}>Terminal</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }}>{terminalVal}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Ticket punch notches & dashed line */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 30, backgroundColor: 'transparent' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', marginLeft: -12 }} />
              <View style={{ flex: 1, height: 1, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', marginHorizontal: 8 }} />
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', marginRight: -12 }} />
            </View>

            {/* Bottom Section */}
            <View style={{ padding: 24, backgroundColor: '#ffffff', alignItems: 'center' }}>
              {/* Mock Barcode */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', height: 48, alignItems: 'center' }}>
                  {[2, 4, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1].map((width, idx) => (
                    <View
                      key={idx}
                      style={{
                        height: '100%',
                        backgroundColor: '#1e293b',
                        width: width * 1.5,
                        marginRight: idx % 3 === 0 ? 3 : 1.5,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 8, letterSpacing: 1, fontFamily: FONT_BOLD }}>PNR: {pnrVal}</Text>
              </View>

              {/* Download Ticket Button */}
              <TouchableOpacity
                style={{ width: '100%', backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                onPress={handleDownloadFlight}
                activeOpacity={0.9}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT_BOLD }}>DOWNLOAD TICKET</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact & Fare Details */}
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 18, padding: 18, marginTop: 20 }}>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 12, fontFamily: FONT_BOLD }}>Trip Details & Fare</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Status</Text>
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>{statusVal}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Baggage Allowance</Text>
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>{baggageStr}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Total Fare Paid</Text>
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>₹{totalFare.toLocaleString()}</Text>
            </View>
          </View>

          {/* Cancel Booking Action */}
          {statusVal.toLowerCase() !== 'cancelled' && (
            <TouchableOpacity
              style={{
                marginTop: 20,
                borderColor: '#ffffff',
                borderWidth: 1.5,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                opacity: cancellingFlight ? 0.6 : 1,
              }}
              onPress={handleCancelFlight}
              disabled={cancellingFlight}
              activeOpacity={0.8}
            >
              {cancellingFlight ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD }}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          )}

          {/* View Refund Details (Only for Cancelled Bookings) */}
          {statusVal.toLowerCase() === 'cancelled' && (
            <TouchableOpacity
              style={{
                marginTop: 20,
                borderColor: '#ffffff',
                borderWidth: 1.5,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onPress={handleViewRefundInfo}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD }}>View Refund Details</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Cancellation Reasons Custom Modal */}
        <Modal
          visible={reasonsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setReasonsModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
              
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                  {selectedReasonCode ? 'Refund Preview Estimation' : 'Select Cancellation Reason'}
                </Text>
                <TouchableOpacity onPress={() => { setReasonsModalVisible(false); setSelectedReasonCode(null); setRefundPreview(null); }} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20, color: '#64748b', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable content */}
              {!selectedReasonCode ? (
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
                      onPress={() => handleSelectReason(item)}
                    >
                      <Text style={{ fontSize: 14, color: '#334155', fontWeight: '600' }}>
                        {item.reason || item.reason_code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={{ marginBottom: 20 }}>
                  {loadingRefundPreview ? (
                    <View style={{ marginVertical: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#ef4444" />
                      <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Calculating refund preview...</Text>
                    </View>
                  ) : (
                    <View>
                      <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                          <Text style={{ color: '#64748b', fontSize: 14.5 }}>Total Paid</Text>
                          <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 14.5 }}>₹{refundPreview?.gross_amount?.toLocaleString()}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                          <Text style={{ color: '#64748b', fontSize: 14.5 }}>Airline Charges</Text>
                          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14.5 }}>-₹{refundPreview?.airline_charge?.toLocaleString()}</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#cbd5e1', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                          <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 16 }}>Estimated Refund</Text>
                          <Text style={{ color: '#16a34a', fontWeight: '900', fontSize: 18 }}>₹{refundPreview?.refund_amount?.toLocaleString()}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={{ width: '100%', backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                        onPress={async () => {
                          setReasonsModalVisible(false);
                          setCancellingFlight(true);
                          try {
                            const cancelRes = await flightService.cancelFlight(
                              tripId,
                              selectedReasonCode,
                              'User confirmed cancellation'
                            );
                            if (cancelRes && cancelRes.success) {
                              Alert.alert('Success', 'Flight booking has been cancelled successfully.');
                              setSelectedFlightTicket(null);
                              fetchAllBookings();
                            } else {
                              Alert.alert('Error', cancelRes.error || 'Failed to cancel flight.');
                            }
                          } catch (err: any) {
                            console.error('Cancellation error:', err);
                            Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to request cancellation.');
                          } finally {
                            setCancellingFlight(false);
                            setSelectedReasonCode(null);
                            setRefundPreview(null);
                          }
                        }}
                        activeOpacity={0.9}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT_BOLD }}>CONFIRM CANCELLATION</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ width: '100%', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => { setSelectedReasonCode(null); setRefundPreview(null); }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD }}>BACK</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }



  const parseBookings = (list: any[], isFlight: boolean) => {
    const bookingList: any[] = [];
    const cancelledList: any[] = [];

    list.forEach((b) => {
      const ct = b.cleartripData || {};
      const bd = ct.booking_details || ct;
      const liveStatus = bd.booking_status || '';
      const dbStatus = b.bookingStatus || b.status || '';
      
      const isCancelled = String(liveStatus).toLowerCase() === 'cancelled' || 
                          liveStatus === 'C' || 
                          liveStatus === 'Q' || 
                          String(dbStatus).toLowerCase() === 'cancelled' || 
                          dbStatus === 'C';
      if (isCancelled) {
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
    const ct = b.cleartripData || {};
    const bd = ct.booking_details || ct;
    const jd = bd.journey_details || {};
    const firstFlight = jd.flight_details?.[0] || {};
    const firstSegment = firstFlight.segment_details?.[0] || {};
    const paxList = jd.traveller_details || b.passengers || [];

    const airlineCode = firstSegment.al || firstSegment.oa || 'SG';
    const flightName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || b.flightDetails?.airline || 'Airline';
    const fltNo = firstSegment.fn || b.flightDetails?.flightNumber || '';
    
    const source = firstSegment.dep || b.flightDetails?.departureCity || b.flightDetails?.departureAirport || b.from || 'BLR';
    const dest = firstSegment.arr || b.flightDetails?.arrivalCity || b.flightDetails?.arrivalAirport || b.to || 'BOM';
    
    const totalAmt = bd.payment_details?.booking_payment_breakup?.total || b.fareDetails?.totalAmount || b.totalAmount || b.price || 5400;
    const pnrVal = firstSegment.booking_infos?.[0]?.pnr || bd.pnr || b.pnr || b.tripId || 'PNR-CLEARTIP-CONFIRMED';
    
    const p = paxList[0];
    const paxName = p ? `${p.fn || p.first_name || p.firstName || ''} ${p.ln || p.last_name || p.lastName || ''}`.trim() : 'Traveller';
    
    let statusVal = bd.booking_status || b.bookingStatus || b.ticketStatus || b.status || 'CONFIRMED';
    if (statusVal === 'P') statusVal = 'PENDING';
    if (statusVal === 'B') statusVal = 'BOOKED';

    return {
      id: b._id || b.id || b.tripId || String(Math.random()),
      tripId: b.tripId || pnrVal,
      pnr: pnrVal,
      name: `${flightName} (${fltNo})`,
      location: `${source} ➔ ${dest}`,
      price: `₹${Math.round(totalAmt).toLocaleString('en-IN')}`,
      rating: '4.9',
      discount: String(statusVal).toUpperCase(),
      passengerName: paxName,
      rawBooking: b,
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=300&q=80',
      buttonText,
    };
  };



  const getTicketField = (path: string) => {
    if (!selectedFlightTicket) return 'N/A';
    
    const bd = selectedFlightTicket.booking_details || selectedFlightTicket;
    const jd = bd.journey_details || {};
    const firstFlight = jd.flight_details?.[0] || {};
    const firstSegment = firstFlight.segment_details?.[0] || {};
    const paxList = jd.traveller_details || selectedFlightTicket.passengers || [];

    if (path === 'tripId') {
      return bd.trip_id || selectedFlightTicket.tripId || 'N/A';
    }
    if (path === 'pnr') {
      return firstSegment.booking_infos?.[0]?.pnr || bd.pnr || selectedFlightTicket.pnr || 'N/A';
    }
    if (path === 'airline') {
      const airlineCode = firstSegment.al || firstSegment.oa || 'SG';
      return jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || selectedFlightTicket.flightDetails?.airline || 'Airline';
    }
    if (path === 'flightNumber') {
      return firstSegment.fn || selectedFlightTicket.flightDetails?.flightNumber || 'N/A';
    }
    if (path === 'route') {
      const orig = firstSegment.dep || selectedFlightTicket.flightDetails?.departureCity || 'BLR';
      const dest = firstSegment.arr || selectedFlightTicket.flightDetails?.arrivalCity || 'BOM';
      return `${orig} ➔ ${dest}`;
    }
    if (path === 'origAirport') {
      const origCode = firstSegment.dep || selectedFlightTicket.flightDetails?.departureAirport || 'DEL';
      const origAirportInfo = jd.meta_data?.airports?.[origCode];
      return origAirportInfo ? `${origAirportInfo.name} (${origAirportInfo.city})` : origCode;
    }
    if (path === 'destAirport') {
      const destCode = firstSegment.arr || selectedFlightTicket.flightDetails?.arrivalAirport || 'PNQ';
      const destAirportInfo = jd.meta_data?.airports?.[destCode];
      return destAirportInfo ? `${destAirportInfo.name} (${destAirportInfo.city})` : destCode;
    }
    if (path === 'passenger') {
      const p = paxList[0];
      if (!p) return 'Traveller';
      const titleStr = p.title ? `${p.title} ` : '';
      const fName = p.fn || p.first_name || p.firstName || '';
      const lName = p.ln || p.last_name || p.lastName || '';
      return `${titleStr}${fName} ${lName}`.trim();
    }
    if (path === 'status') {
      const statusVal = bd.booking_status || selectedFlightTicket.bookingStatus || 'CONFIRMED';
      if (statusVal === 'P') return 'PENDING';
      if (statusVal === 'B' || statusVal === 'CONFIRMED') return 'CONFIRMED / TICKETED';
      return statusVal;
    }
    return 'N/A';
  };

  const currentList = activeCategory === 'Hotel' ? hotelBookings : flightBookings;
  const bookingsData = parseBookings(currentList, activeCategory === 'Flight');

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Skeleton width={130} height={20} />
                <Skeleton width={80} height={20} borderRadius={10} />
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                <Skeleton width={70} height={70} borderRadius={12} style={{ marginRight: 14 }} />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Skeleton width={110} height={14} style={{ marginBottom: 8 }} />
                  <Skeleton width={150} height={16} />
                </View>
              </View>
              <Skeleton width="100%" height={40} borderRadius={12} />
            </View>
          ))}
        </ScrollView>
      ) : loadingTicket ? (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            <Skeleton width={140} height={20} style={{ marginBottom: 16, alignSelf: 'center' }} />
            <Skeleton width="60%" height={24} style={{ marginBottom: 24, alignSelf: 'center' }} />
            <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={45} borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={45} borderRadius={12} />
          </View>
          <Text style={{ marginTop: 16, color: '#64748b', fontSize: 13, fontFamily: FONT_FAMILY }}>Retrieving Cleartrip live flight details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {bookingsData[activeTab].map((booking) => {
            const isFav = !!favorites[booking.id];
            const b = booking as any;

            if (activeCategory === 'Flight') {
              const raw = b.rawBooking || b;
              const ct = raw.cleartripData || {};
              const bd = ct.booking_details || ct;
              const jd = bd.journey_details || {};
              const firstFlight = jd.flight_details?.[0] || {};
              const segmentsList = firstFlight.segment_details || [];
              const firstSegment = segmentsList[0] || {};
              const paxList = jd.traveller_details || raw.passengers || [];

              const tripId = bd.trip_id || raw.tripId || raw.bookingId || 'Q260811970568';
              const liveStatus = bd.booking_status || '';
              const isCancelled = String(liveStatus).toLowerCase() === 'cancelled' || liveStatus === 'C' || liveStatus === 'Q';
              const statusVal = isCancelled ? 'CANCELLED' : (liveStatus === 'B' ? 'CONFIRMED' : (liveStatus || 'CONFIRMED'));
              const journeyType = jd.journey_type === 'OW' ? 'One Way' : 'Round Trip';
              
              const segmentStr = segmentsList.map((s: any) => `${s.al || s.oa || 'SG'} ${s.fn || ''}`).join(' + ') || (raw.flightDetails?.airline && raw.flightDetails?.flightNumber ? `${raw.flightDetails.airline.substring(0,2).toUpperCase()} ${raw.flightDetails.flightNumber}` : 'SG 106 + SG 162');

              const origCode = firstSegment.dep || raw.flightDetails?.departureAirport || 'DEL';
              const destCode = segmentsList[segmentsList.length - 1]?.arr || firstSegment.arr || raw.flightDetails?.arrivalAirport || 'PNQ';
              const origCity = jd.meta_data?.airports?.[origCode]?.city || raw.flightDetails?.departureCity || 'New Delhi';
              const destCity = jd.meta_data?.airports?.[destCode]?.city || raw.flightDetails?.arrivalCity || 'Pune';
              const routeStr = `${origCity} (${origCode}) to ${destCity} (${destCode})`;

              let stopStr = 'Non-stop';
              if (segmentsList.length > 1) {
                const layoverCode = segmentsList[0].arr;
                stopStr = `${segmentsList.length - 1} stop via ${layoverCode}`;
              } else if (raw.flightDetails?.flightNumber && String(raw.flightDetails.flightNumber).includes('+')) {
                stopStr = '1 stop via DEL';
              }

              const pnrVal = firstSegment.booking_infos?.[0]?.pnr || bd.pnr || raw.pnr || raw.tripId || 'RFEZVK';
              
              const p = paxList[0];
              const travellerName = p ? `${p.title ? p.title + ' ' : ''}${p.fn || p.first_name || p.firstName || ''} ${p.ln || p.last_name || p.lastName || ''}`.trim() : (raw.passengers?.[0] ? `${raw.passengers[0].title ? raw.passengers[0].title + ' ' : ''}${raw.passengers[0].firstName || ''} ${raw.passengers[0].lastName || ''}`.trim() : 'MR Gh Yy');

              const fareBrand = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group?.brand_name || raw.fareDetails?.fareBrand || 'SPICE MAX';
              const cabinVal = firstSegment.booking_infos?.[0]?.cabin_type === 'E' ? 'Economy' : 'Business';

              const baggageObj = firstSegment.baggage?.ADT || {};
              const cabBag = baggageObj.cab || '7 kg';
              const cibBag = baggageObj.cib || '15 kg';
              const baggageStr = `Cabin ${cabBag}, Check-in ${cibBag}`;

              const airlineCode = firstSegment.al || firstSegment.oa || (raw.flightDetails?.airline?.toLowerCase().includes('indigo') ? '6E' : (raw.flightDetails?.airline?.toLowerCase().includes('india') ? 'AI' : ''));
              const airlineName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || raw.flightDetails?.airline || '';
              const themeBg = airlineCode === '6E' ? '#1e3a8a' : (airlineCode === 'AI' ? '#c2185b' : '#334155');

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={{ backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 20 }}
                  onPress={() => {
                    setSelectedTripId(tripId);
                  }}
                  activeOpacity={0.9}
                >
                  <View style={{ backgroundColor: themeBg, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginRight: 12 }}>{airlineName}</Text>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>{segmentStr}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 32 }}>✈️</Text>
                  </View>

                  <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>🎫</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Trip ID</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} adjustsFontSizeToFit={true} numberOfLines={1}>{tripId}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>📋</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Status</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{statusVal}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>🔄</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Journey</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{journeyType}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                      <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>📍</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Route</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={2}>{routeStr}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>✈️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Stop</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{stopStr}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#cbd5e1', borderStyle: 'dashed', borderWidth: 1, borderRadius: 1, marginVertical: 14 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>🎟️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>PNR</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} adjustsFontSizeToFit={true} numberOfLines={1}>{pnrVal}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>👤</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Traveller</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{travellerName}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>🏷️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Fare Brand</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{fareBrand}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>💺</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Cabin</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{cabinVal}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                          <Text style={{ fontSize: 16 }}>🧳</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Baggage</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>{baggageStr}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
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

      {/* Cancellation Reasons Custom Modal */}
      <Modal
        visible={reasonsModalVisible}
        transparent={true}
        animationType="slide"
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
                    const tripId = selectedFlightTicket?.tripId || selectedFlightTicket?.bookingId || '';
                    const totalFare = selectedFlightTicket?.fareDetails?.totalAmount || selectedFlightTicket?.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group?.total_fare || 0;

                    setReasonsModalVisible(false);
                    setCancellingFlight(true);
                    try {
                      console.log('[MyBookings] Fetching refund preview for reason:', item.reason_code);
                      const refundRes = await flightService.getCancelRefundInfo(tripId, item.reason_code);
                      console.log('[MyBookings] Refund preview response:', refundRes);

                      const preview = refundRes?.data || refundRes || {};
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
                            onPress: () => setCancellingFlight(false)
                          },
                          {
                            text: 'Cancel Flight',
                            style: 'destructive',
                            onPress: async () => {
                              setCancellingFlight(true);
                              try {
                                const cancelRes = await flightService.cancelFlight(
                                  selectedFlightTicket._id || selectedFlightTicket.id,
                                  item.reason_code,
                                  'User confirmed cancellation after previewing refund details.'
                                );
                                if (cancelRes && cancelRes.success) {
                                  Alert.alert('Success', 'Flight booking has been cancelled successfully.');
                                  setSelectedFlightTicket(null);
                                  onBack();
                                } else {
                                  Alert.alert('Error', cancelRes.error || 'Failed to cancel flight.');
                                }
                              } catch (err: any) {
                                console.error('Cancellation execution error:', err);
                                Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to execute cancellation.');
                              } finally {
                                setCancellingFlight(false);
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
                            onPress: () => setCancellingFlight(false)
                          },
                          {
                            text: 'Cancel Flight',
                            style: 'destructive',
                            onPress: async () => {
                              setCancellingFlight(true);
                              try {
                                const cancelRes = await flightService.cancelFlight(
                                  selectedFlightTicket._id || selectedFlightTicket.id,
                                  item.reason_code,
                                  'User proceeded with cancellation without preview.'
                                );
                                if (cancelRes && cancelRes.success) {
                                  Alert.alert('Success', 'Flight booking has been cancelled successfully.');
                                  setSelectedFlightTicket(null);
                                  onBack();
                                } else {
                                  Alert.alert('Error', cancelRes.error || 'Failed to cancel flight.');
                                }
                              } catch (err: any) {
                                Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to execute cancellation.');
                              } finally {
                                setCancellingFlight(false);
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
