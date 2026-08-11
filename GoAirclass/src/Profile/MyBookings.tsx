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
  Modal,
  Linking,
} from 'react-native';
import { hotelService, flightService } from '../api';
import BookingDetails from './BookingDetails';

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

  if (selectedTripId) {
    if (activeCategory === 'Hotel') {
      return <BookingDetails tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
    }
  }

  if (selectedFlightTicket) {
    const bd = selectedFlightTicket.booking_details || selectedFlightTicket;
    const jd = bd.journey_details || {};
    const firstFlight = jd.flight_details?.[0] || {};
    const segmentsList = firstFlight.segment_details || [];
    const firstSegment = segmentsList[0] || {};
    const paxList = jd.traveller_details || selectedFlightTicket.passengers || [];

    const tripId = bd.trip_id || selectedFlightTicket.tripId || 'N/A';
    const statusVal = bd.booking_status || selectedFlightTicket.bookingStatus || 'CONFIRMED';
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

    const baggageObj = firstSegment.baggage?.ADT || {};
    const cabBag = baggageObj.cab || '7 kg';
    const cibBag = baggageObj.cib || '15 kg';
    const baggageStr = `Cabin ${cabBag}, Check-in ${cibBag}`;

    const airlineCode = firstSegment.al || firstSegment.oa || 'SG';
    const airlineName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || selectedFlightTicket.flightDetails?.airline || 'SpiceJet';
    const themeBg = airlineCode === '6E' ? '#1e3a8a' : '#c2185b';

    const middleCode = segmentsList.length > 1 ? segmentsList[0].arr : null;
    const middleAirportCity = middleCode ? jd.meta_data?.airports?.[middleCode]?.city || 'Delhi' : '';
    const middleAirportName = middleCode ? jd.meta_data?.airports?.[middleCode]?.name || 'Indira Gandhi Airport' : '';
    
    let layoverStr = '';
    if (segmentsList.length > 1) {
      const depTime2 = new Date(segmentsList[1].dt).getTime();
      const arrTime1 = new Date(segmentsList[0].at).getTime();
      const diffMs = depTime2 - arrTime1;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      layoverStr = `${hours} hr ${mins} min layover`;
    } else {
      layoverStr = '16 hr 55 min layover';
    }

    const origAirportName = jd.meta_data?.airports?.[origCode]?.name || 'Lohegaon';
    const destAirportName = jd.meta_data?.airports?.[destCode]?.name || 'Chatrapati Shivaji Airport';

    const bookedDateVal = bd.booked_date ? bd.booked_date : (selectedFlightTicket.createdAt || Date.now());
    const formatDate = (timestamp: any) => {
      if (!timestamp) return '11 Aug 2026, 07:44 PM';
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '11 Aug 2026, 07:44 PM';
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

    const contactEmail = bd.user_details?.email || selectedFlightTicket.contactDetails?.email || 'rahul@example.com';
    const contactPhone = bd.user_details?.phone || selectedFlightTicket.contactDetails?.phone || '9876543210';

    const fareGroup = bd.payment_details?.booking_payment_breakup?.pricing_breakup?.[0]?.fare_group || {};
    const baseFare = fareGroup.base_fare || selectedFlightTicket.fareDetails?.baseFare || 13821;
    const taxFare = fareGroup.tax || selectedFlightTicket.fareDetails?.taxes || 2519;
    const totalFare = fareGroup.total_fare || selectedFlightTicket.fareDetails?.totalAmount || 16340;

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <TouchableOpacity onPress={() => setSelectedFlightTicket(null)} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
            <Text style={{ fontSize: 18, color: '#0f172a', fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', fontFamily: FONT_BOLD }}>Booking Details</Text>
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }} onPress={() => Alert.alert('Share', 'Sharing booking details...')}>
            <Text style={{ fontSize: 16 }}>📤</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. Top Airport Codes Flow Panel */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* PNQ Code */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#0f172a', fontFamily: FONT_BOLD }}>{origCode}</Text>
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{origCity}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }} numberOfLines={1}>{origAirportName.split(' ')[0]}</Text>
              </View>

              {/* Arrow + Plane 1 */}
              <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '100%', position: 'absolute' }} />
                <View style={{ backgroundColor: '#ffffff', padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>✈️</Text>
                </View>
              </View>

              {/* DEL Code (Middle) */}
              <View style={{ flex: 1.2, alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#0f172a', fontFamily: FONT_BOLD }}>{middleCode || 'DEL'}</Text>
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{middleAirportCity || 'New Delhi'}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }} numberOfLines={1}>{middleAirportName.split(' ')[0]}</Text>
              </View>

              {/* Arrow + Plane 2 */}
              <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '100%', position: 'absolute' }} />
                <View style={{ backgroundColor: '#ffffff', padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>✈️</Text>
                </View>
              </View>

              {/* BOM Code */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#0f172a', fontFamily: FONT_BOLD }}>{destCode}</Text>
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{destCity}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }} numberOfLines={1}>{destAirportName.split(' ')[0]}</Text>
              </View>
              
            </View>

            {/* Layover pill */}
            <View style={{ alignSelf: 'center', backgroundColor: '#ffe4e6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12 }}>
              <Text style={{ color: '#e11d48', fontSize: 11, fontWeight: 'bold', fontFamily: FONT_SEMI }}>{layoverStr}</Text>
            </View>
          </View>

          {/* 2. Segments Detailed List */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
            
            {/* Segment 1 */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 64, marginRight: 12 }}>
                <View style={{ backgroundColor: '#be123c', borderRadius: 4, paddingVertical: 4, alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_BOLD }}>{segmentsList[0]?.al || airlineCode} {segmentsList[0]?.fn || ''}</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#64748b', marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', fontFamily: FONT_BOLD }}>{segmentsList[0]?.dep || origCode} ➔ {segmentsList[0]?.arr || middleCode || 'DEL'}</Text>
                </View>

                <View style={{ paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: '#cbd5e1', borderStyle: 'dashed', marginLeft: 3, paddingBottom: 10 }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Departure</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9f1239', marginTop: 2, fontFamily: FONT_BOLD }}>{formatSegmentDate(segmentsList[0]?.dt || (bd.booked_date ? new Date(bd.booked_date + 86400000).toISOString() : ''))}</Text>
                    <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{origCity}, {origAirportName}</Text>
                  </View>

                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Arrival</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9f1239', marginTop: 2, fontFamily: FONT_BOLD }}>{formatSegmentDate(segmentsList[0]?.at || (bd.booked_date ? new Date(bd.booked_date + 90000000).toISOString() : ''))}</Text>
                    <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{middleAirportCity || 'New Delhi'}, {middleAirportName}</Text>
                  </View>

                  <View>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Terminal</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>{segmentsList[0]?.booking_infos?.[0]?.terminal || '1D'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Layover gray bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 14, marginLeft: 76 }}>
              <Text style={{ fontSize: 12, marginRight: 8 }}>🕒</Text>
              <Text style={{ fontSize: 12, color: '#475569', flex: 1, fontFamily: FONT_FAMILY }}>Layover in {middleAirportCity || 'Delhi'}</Text>
              <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: 'bold', fontFamily: FONT_SEMI }}>{layoverStr.replace(' layover', '')}</Text>
            </View>

            {/* Segment 2 */}
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <View style={{ width: 64, marginRight: 12 }}>
                <View style={{ backgroundColor: '#be123c', borderRadius: 4, paddingVertical: 4, alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_BOLD }}>{segmentsList[1]?.al || airlineCode} {segmentsList[1]?.fn || ''}</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#64748b', marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', fontFamily: FONT_BOLD }}>{segmentsList[1]?.dep || middleCode || 'DEL'} ➔ {segmentsList[1]?.arr || destCode}</Text>
                </View>

                <View style={{ paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: '#cbd5e1', borderStyle: 'dashed', marginLeft: 3 }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Departure</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9f1239', marginTop: 2, fontFamily: FONT_BOLD }}>{formatSegmentDate(segmentsList[1]?.dt || (bd.booked_date ? new Date(bd.booked_date + 150000000).toISOString() : ''))}</Text>
                    <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{middleAirportCity || 'New Delhi'}, {middleAirportName}</Text>
                  </View>

                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Arrival</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9f1239', marginTop: 2, fontFamily: FONT_BOLD }}>{formatSegmentDate(segmentsList[1]?.at || (bd.booked_date ? new Date(bd.booked_date + 160000000).toISOString() : ''))}</Text>
                    <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{destCity}, {destAirportName}</Text>
                  </View>

                  <View>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Terminal</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>{segmentsList[1]?.booking_infos?.[0]?.terminal || '1'}</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>

          {/* 3. Bottom Row Summary Boxes */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            
            {/* Box 1 (Left): Booked & Contact */}
            <View style={{ flex: 1.1, backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>📅</Text>
                <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>Booked on</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b', marginBottom: 12 }}>{bookedOnStr}</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>📞</Text>
                <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>Contact</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: '#1e293b' }} numberOfLines={1}>{contactEmail}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b', marginTop: 2 }}>{contactPhone}</Text>
            </View>

            {/* Box 2 (Center): Payment Summary */}
            <View style={{ flex: 1.2, backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>👛</Text>
                <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>Payment Summary</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>Base Fare</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>₹{baseFare.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>Taxes</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>₹{taxFare.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>Conv. Fee</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>₹0</Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#cbd5e1', marginBottom: 6 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#0f172a' }}>Total</Text>
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#ea580c' }}>₹{totalFare.toLocaleString()}</Text>
              </View>
            </View>

            {/* Box 3 (Right): Total Fare & Paid status */}
            <View style={{ flex: 1, backgroundColor: '#fff5f5', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: 'bold' }}>₹</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#64748b' }}>Total Fare</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c', marginVertical: 2, fontFamily: FONT_BOLD }}>₹{totalFare.toLocaleString()}</Text>
              
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 10, marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: '#15803d', fontWeight: 'bold' }}>Paid</Text>
              </View>
            </View>

          </View>

        </ScrollView>

        {/* Bottom Bar: Support & Actions */}
        <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          
          {/* Help Banner */}
          <TouchableOpacity style={{ backgroundColor: '#c2410c', paddingVertical: 12, alignItems: 'center' }} onPress={() => Linking.openURL('tel:9876543210')}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold', fontFamily: FONT_SEMI }}>Need Help? Contact Support</Text>
          </TouchableOpacity>

          {/* Edit / Floating Action Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
            <TouchableOpacity style={{ backgroundColor: '#64748b', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }} onPress={() => Alert.alert('Edit', 'Modifying booking details...')}>
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }} onPress={() => Alert.alert('Share', 'Sharing booking details...')}>
              <Text style={{ fontSize: 18 }}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
    );
  }



  const parseBookings = (list: any[], isFlight: boolean) => {
    const bookingList: any[] = [];
    const cancelledList: any[] = [];

    list.forEach((b) => {
      const statusVal = b.bookingStatus || b.ticketStatus || b.status || 'CONFIRMED';
      if (String(statusVal).toLowerCase() === 'cancelled') {
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
      {loading || loadingTicket ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          {loadingTicket && <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Fetching Live ticket from Cleartrip...</Text>}
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
              const statusVal = bd.booking_status || raw.bookingStatus || 'CONFIRMED';
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

              const airlineCode = firstSegment.al || firstSegment.oa || (raw.flightDetails?.airline?.toLowerCase().includes('indigo') ? '6E' : 'SG');
              const airlineName = jd.meta_data?.airlines?.[airlineCode]?.name || bd.airline || raw.flightDetails?.airline || 'SpiceJet';
              const themeBg = airlineCode === '6E' ? '#1e3a8a' : '#c2185b';

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={{ backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 20 }}
                  onPress={async () => {
                    setLoadingTicket(true);
                    try {
                      const details = await flightService.getTripDetails(tripId);
                      if (details && details.success) {
                        setSelectedFlightTicket(details.data);
                      } else {
                        setSelectedFlightTicket(raw);
                      }
                    } catch (err: any) {
                      console.warn('Cleartrip live ticket error, loading local DB backup:', err.message);
                      setSelectedFlightTicket(raw);
                    } finally {
                      setLoadingTicket(false);
                    }
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
