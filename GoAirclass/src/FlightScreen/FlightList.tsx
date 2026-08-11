import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  BackHandler,
  Platform,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightListProps {
  onBack: () => void;
  onSelectFlight: (selectedFlight?: any) => void;
  searchResults?: any;
}

interface FlightListing {
  id: string;
  airline: string;
  code: string;
  depTime: string;
  arrTime: string;
  duration: string;
  stops: string;
  price: string;
  logoBg: string;
  logoChar: string;
  fareType: string;
  refundableText: string;
  baggageCabin: string;
  baggageCheckin: string;
  seatsLeft: number;
  rawPrice?: number;
  stopCount?: number;
  depHour?: number;
  arrHour?: number;
  isRefundableBoolean?: boolean;
}



const PencilIcon = () => (
  <View style={styles.pencilWrapper}>
    <View style={styles.pencilBody} />
    <View style={styles.pencilUnderline} />
  </View>
);

const CalendarIcon = () => (
  <View style={styles.calendarWrapper}>
    <View style={styles.calendarRingsRow}>
      <View style={styles.calendarRing} />
      <View style={styles.calendarRing} />
    </View>
    <View style={styles.calendarBody}>
      <View style={styles.calendarHeaderLine} />
      <View style={styles.calendarGrid}>
        <View style={styles.calendarRow}>
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
        </View>
        <View style={styles.calendarRow}>
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
          <View style={styles.calendarDot} />
        </View>
      </View>
    </View>
  </View>
);

// Filter UI Components
const Checkbox = ({ label, checked, onChange }: any) => (
  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => onChange(!checked)} activeOpacity={0.7}>
    <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: checked ? '#b48348' : '#cbd5e1', backgroundColor: checked ? '#b48348' : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
      {checked && <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
    </View>
    <Text style={{ fontSize: 14, color: '#334155', fontFamily: FONT_FAMILY }}>{label}</Text>
  </TouchableOpacity>
);

const Radio = ({ label, selected, onPress }: any) => (
  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={onPress} activeOpacity={0.7}>
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: selected ? '#b48348' : '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
      {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#b48348' }} />}
    </View>
    <Text style={{ fontSize: 14, color: '#334155', fontFamily: FONT_FAMILY }}>{label}</Text>
  </TouchableOpacity>
);

const SimpleSlider = ({ min, max, value, onValueChange, formatLabel }: any) => {
  const [width, setWidth] = useState(1);
  const startVal = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = value;
      },
      onPanResponderMove: (evt, gestureState) => {
        let diff = (gestureState.dx / width) * (max - min);
        let newVal = startVal.current + diff;
        newVal = Math.max(min, Math.min(max, newVal));
        onValueChange(Math.round(newVal));
      },
    })
  ).current;

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={{ marginVertical: 10, paddingHorizontal: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500', fontFamily: FONT_FAMILY }}>{formatLabel ? formatLabel(min) : min}</Text>
        <Text style={{ fontSize: 12, color: '#b48348', fontWeight: '700', fontFamily: FONT_FAMILY }}>{formatLabel ? formatLabel(value) : value}</Text>
      </View>
      <View 
        style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, justifyContent: 'center' }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width || 1)}
      >
        <View style={{ position: 'absolute', height: '100%', backgroundColor: '#b48348', borderRadius: 3, width: `${pct}%` }} />
        <View 
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            left: `${pct}%`,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#b48348',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          }}
        />
      </View>
    </View>
  );
};

interface DateChip {
  day: string;
  date: string;
  price: string;
  isCheap?: boolean;
}

const DATE_CHIPS: DateChip[] = [
  { day: 'Fri', date: '7 Aug', price: '₹6,183' },
  { day: 'Sat', date: '8 Aug', price: '₹6,079', isCheap: true },
  { day: 'Sun', date: '9 Aug', price: '₹6,183' },
  { day: 'Mon', date: '10 Aug', price: '₹6,079', isCheap: true },
];

export default function FlightList({ onBack, onSelectFlight, searchResults }: FlightListProps) {
  const [selectedDate, setSelectedDate] = useState<string>('Sun, 9 Aug');
  const [activeFilter, setActiveFilter] = useState<string>('Smart Filter');

  // Filter States
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<string>('all'); // all, 0, 1, 2
  const [airlinesFilter, setAirlinesFilter] = useState<string[]>([]);
  const [fareTypeFilter, setFareTypeFilter] = useState<string>('all'); // all, refundable, non-refundable
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(30000);
  const [depTimeBucket, setDepTimeBucket] = useState<string>('all'); // all, morning(6-12), afternoon(12-18), evening(18-24), night(0-6)
  const [arrTimeBucket, setArrTimeBucket] = useState<string>('all');

  const parsedData = useMemo(() => {
    let flightListings: FlightListing[] = [];
    let departureCode = '';
    let arrivalCode = '';
    let headerDate = '';
    let passengerCount = '1';
    let cabinName = 'Economy';

    const rootObj = searchResults?.data?.data || searchResults?.data || searchResults || {};
    if (rootObj && (rootObj.travelOptions || rootObj.flights || rootObj.searchIntent)) {
      const data = rootObj;

      let rawOptions: any[] = [];
      if (Array.isArray(data.travelOptions)) {
        rawOptions = data.travelOptions;
      } else if (data.travelOptions && typeof data.travelOptions === 'object') {
        const entries = Object.values(data.travelOptions);
        entries.forEach((entry: any) => {
          if (Array.isArray(entry)) {
            rawOptions.push(...entry);
          } else if (entry && typeof entry === 'object' && Object.keys(entry).length > 0) {
            rawOptions.push(entry);
          }
        });
      }

      const flightsMap = data.flights || {};
      const faresMap = data.fares || {};
      const baggageMap = data.baggageAllowances || {};

      const intentObj = data.searchIntent || {};
      const searchIntent = (typeof intentObj === 'object' ? Object.values(intentObj)[0] : {}) as any || {};

      departureCode = searchIntent.origin || '';
      arrivalCode = searchIntent.destination || '';

      if (searchIntent.departDate) {
        headerDate = searchIntent.departDate;
      }

      const adults = searchIntent.paxCriteria?.find((p: any) => p.type === 'ADT')?.count || 1;
      const chd = searchIntent.paxCriteria?.find((p: any) => p.type === 'CHD')?.count || 0;
      const inf = searchIntent.paxCriteria?.find((p: any) => p.type === 'INF')?.count || 0;
      passengerCount = String(adults + chd + inf);
      cabinName = searchIntent.cabin || 'Economy';

      const airlineNames: any = {
        '6E': 'IndiGo',
        'SG': 'SpiceJet',
        'AI': 'Air India',
        'QP': 'Akasa Air',
        'UK': 'Vistara',
        'I5': 'Air Asia',
        'G8': 'Go First'
      };

      const logoColors: any = {
        '6E': '#0b2e66',
        'SG': '#ffcc00',
        'AI': '#e11d48',
        'QP': '#ff6600',
        'UK': '#660033',
        'I5': '#ef4444',
        'G8': '#0052cc'
      };

      flightListings = rawOptions.map((opt: any, index: number) => {
        const fareId = opt.defaultFare?.associations?.[0]?.fareId || opt.fareId || opt.fareAssocId;
        const fareObj = (fareId ? faresMap[fareId] : null) || (Object.values(faresMap)[0] as any) || {};
        const priceVal = fareObj.pricing?.totalPrice || opt.price || 0;

        const segmentIds = opt.subTravelOptionIds?.[0]?.split('__') || [];
        const firstFlt = flightsMap[segmentIds[0]] || {};
        const lastFlt = flightsMap[segmentIds[segmentIds.length - 1]] || {};

        const depDateObj = firstFlt.departureAirport?.time ? new Date(firstFlt.departureAirport.time) : null;
        const arrDateObj = lastFlt.arrivalAirport?.time ? new Date(lastFlt.arrivalAirport.time) : null;

        const depTimeStr = depDateObj ? depDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '12:00';
        const arrTimeStr = arrDateObj ? arrDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '14:00';

        let durationStr = '02h 00m';
        if (depDateObj && arrDateObj) {
          const diffMs = arrDateObj.getTime() - depDateObj.getTime();
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.round((diffMs % 3600000) / 60000);
          durationStr = `${String(diffHrs).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m`;
        }

        const airlineCode = firstFlt.airlineCode || '6E';
        const airlineName = airlineNames[airlineCode] || 'Airline';
        const fltNo = firstFlt.fltNo || '';
        const stopText = segmentIds.length > 1 ? `${segmentIds.length - 1} stop` : 'Non stop';

        const fareFamily = fareObj.fareFamily || 'REGULAR';
        
        // Baggage extraction
        const baggageId = fareObj.baggageAllowanceId;
        const baggageData = baggageMap[baggageId] || {};
        
        const cabinBaggage = baggageData.BAGGAGE_CABIN;
        const baggageCabinStr = cabinBaggage 
          ? `${cabinBaggage.amount} ${cabinBaggage.unit} ${cabinBaggage.pieces ? `(${cabinBaggage.pieces} Piece)` : ''}`.trim() 
          : '7 KG (1 Piece)';
          
        const checkinBaggage = baggageData.BAGGAGE_CHECK_IN;
        const baggageCheckinStr = checkinBaggage 
          ? `${checkinBaggage.amount} ${checkinBaggage.unit} ${checkinBaggage.pieces ? `(${checkinBaggage.pieces} Piece)` : ''}`.trim() 
          : '15 KG (1 Piece)';

        // Refundable & Seats extraction
        let penaltyIds: string[] = [];
        if (fareObj.subTravelOptionBenefits) {
          const travelOption = Object.values(fareObj.subTravelOptionBenefits)[0] as any;
          if (travelOption?.benefits) {
            penaltyIds = travelOption.benefits.penaltyIds || [];
          }
        } else {
          penaltyIds = fareObj.penaltyIds || [];
        }

        const penaltiesMap = data.penalties || {};
        let isRefundable = true; // Default to true unless explicitly non-refundable
        if (penaltyIds.length > 0) {
          for (const pId of penaltyIds) {
            const p = penaltiesMap[pId];
            if (p && p.penaltyType === 'CANCEL') {
              if (p.timeLines && p.timeLines.length > 0) {
                // If any timeline is permitted, it's refundable
                isRefundable = p.timeLines.some((t: any) => t.permitted);
              } else {
                isRefundable = false;
              }
            }
          }
        }

        const refundableTextStr = isRefundable ? 'Refundable' : 'Non-Refundable';
        const seatsLeftVal = fareObj.availableSeats ?? (Math.floor(Math.random() * 5) + 1);

        return {
          id: opt.travelOptionId || String(index),
          airline: airlineName,
          code: `${airlineCode}-${fltNo}`,
          departureCode: departureCode,
          arrivalCode: arrivalCode,
          originCode: departureCode,
          destCode: arrivalCode,
          from: departureCode,
          to: arrivalCode,
          depTime: depTimeStr,
          arrTime: arrTimeStr,
          duration: durationStr,
          stops: stopText,
          price: `₹${priceVal.toLocaleString()}`,
          logoBg: logoColors[airlineCode] || '#64748b',
          logoChar: airlineCode,
          fareType: fareFamily,
          refundableText: refundableTextStr,
          baggageCabin: baggageCabinStr,
          baggageCheckin: baggageCheckinStr,
          seatsLeft: seatsLeftVal,
          rawPrice: priceVal,
          stopCount: segmentIds.length - 1,
          depHour: depDateObj ? depDateObj.getHours() : 12,
          arrHour: arrDateObj ? arrDateObj.getHours() : 14,
          isRefundableBoolean: isRefundable,
        };
      });
    }

    return { flightListings, departureCode, arrivalCode, headerDate, passengerCount, cabinName };
  }, [searchResults]);

  const { flightListings, departureCode, arrivalCode, headerDate, passengerCount, cabinName } = parsedData;

  // Filter Logic
  const filteredListings = useMemo(() => {
    return flightListings.filter((f) => {
      // 1. Stops
      if (stopsFilter !== 'all') {
        const targetStops = parseInt(stopsFilter, 10);
        if (targetStops === 2) {
          if ((f.stopCount || 0) < 2) return false;
        } else {
          if (f.stopCount !== targetStops) return false;
        }
      }

      // 2. Airlines
      if (airlinesFilter.length > 0) {
        if (!airlinesFilter.includes(f.airline)) return false;
      }

      // 3. Fare Type
      if (fareTypeFilter === 'refundable') {
        if (!f.isRefundableBoolean) return false;
      } else if (fareTypeFilter === 'non-refundable') {
        if (f.isRefundableBoolean) return false;
      }

      // 4. Max Price
      if (f.rawPrice && f.rawPrice > maxPriceFilter) return false;

      // 5. Dep Time Bucket
      const isInBucket = (hour: number, bucket: string) => {
        if (bucket === 'all') return true;
        if (bucket === 'night' && hour >= 0 && hour < 6) return true;
        if (bucket === 'morning' && hour >= 6 && hour < 12) return true;
        if (bucket === 'afternoon' && hour >= 12 && hour < 18) return true;
        if (bucket === 'evening' && hour >= 18 && hour < 24) return true;
        return false;
      };

      if (!isInBucket(f.depHour || 0, depTimeBucket)) return false;
      if (!isInBucket(f.arrHour || 0, arrTimeBucket)) return false;

      return true;
    });
  }, [flightListings, stopsFilter, airlinesFilter, fareTypeFilter, maxPriceFilter, depTimeBucket, arrTimeBucket]);

  const airlineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    flightListings.forEach(f => {
      counts[f.airline] = (counts[f.airline] || 0) + 1;
    });
    return counts;
  }, [flightListings]);

  const fareTypeCounts = useMemo(() => {
    let refundable = 0;
    let nonRefundable = 0;
    flightListings.forEach(f => {
      if (f.isRefundableBoolean) refundable++;
      else nonRefundable++;
    });
    return { refundable, nonRefundable };
  }, [flightListings]);

  const stopsCounts = useMemo(() => {
    let all = flightListings.length;
    let zero = 0;
    let one = 0;
    let twoPlus = 0;
    
    flightListings.forEach(f => {
      const s = f.stopCount || 0;
      if (s === 0) zero++;
      else if (s === 1) one++;
      else twoPlus++;
    });
    
    return { all, zero, one, twoPlus };
  }, [flightListings]);

  // Entrance slide animation
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 45,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Filter bottom sheet animation
  const filterSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const filterBgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFilterModalVisible) {
      Animated.parallel([
        Animated.spring(filterSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(filterBgAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(filterSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(filterBgAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isFilterModalVisible, filterSlideAnim, filterBgAnim]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);
  // Ref for onSelectFlight to avoid re-rendering
  const onSelectFlightRef = useRef(onSelectFlight);
  useEffect(() => {
    onSelectFlightRef.current = onSelectFlight;
  }, [onSelectFlight]);

  const flightCardsMemo = useMemo(() => {
    if (filteredListings.length === 0) {
      return (
        <View style={styles.noFlightsCard}>
          <Text style={styles.noFlightsEmoji}>✈️</Text>
          <Text style={styles.noFlightsTitle}>No Flights Found</Text>
          <Text style={styles.noFlightsSub}>Please try adjusting your filters.</Text>
        </View>
      );
    }
    return filteredListings.map((flight, idx) => (
      <TouchableOpacity key={flight.id || idx} style={styles.flightCard} onPress={() => onSelectFlightRef.current(flight)} activeOpacity={0.9}>
        <View style={styles.cardMainRow}>
          <View style={styles.brandContainer}>
            <View style={[styles.brandLogoCircle, { backgroundColor: flight.logoBg }]}>
              <Text style={styles.logoText}>{flight.logoChar}</Text>
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.airlineName}>{flight.airline}</Text>
              <Text style={styles.flightCode}>{flight.code}</Text>
              <Text style={styles.fareTypeText}>{flight.fareType.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.timelineContainer}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{flight.depTime}</Text>
              <Text style={styles.cityCode}>{departureCode}</Text>
            </View>
            <View style={styles.lineWrapper}>
              <Text style={styles.durationLabel}>{flight.duration}</Text>
              <View style={styles.lineContainer}>
                <View style={styles.dot} />
                <View style={styles.horizontalBar} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.stopsLabel}>{flight.stops}</Text>
            </View>
            <View style={styles.timeBlockRight}>
              <Text style={styles.timeValue}>{flight.arrTime}</Text>
              <Text style={styles.cityCode}>{arrivalCode}</Text>
            </View>
          </View>
          <View style={styles.priceActionContainer}>
            <Text style={styles.priceValue}>{flight.price}</Text>
            <Text style={styles.refundableText}>{flight.refundableText}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardBottomRow}>
          <View style={styles.bottomLeftGroup}>
            <View style={styles.farePill}>
              <Text style={styles.farePillText}>{cabinName.toUpperCase()} • {flight.fareType.toUpperCase()}</Text>
            </View>
            <Text style={styles.baggageText}>💼 Cabin: {flight.baggageCabin}</Text>
            <Text style={styles.baggageText}>🧳 Check-in: {flight.baggageCheckin}</Text>
          </View>
          <View style={styles.seatsPill}>
            <Text style={styles.seatsPillText}>⚠️ {flight.seatsLeft} seat(s) left</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  }, [filteredListings, departureCode, arrivalCode, cabinName]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animationWrapper, { transform: [{ translateY: slideAnim }] }]}>

        {/* Compact Header Summary Row */}
        <View style={styles.headerWrapper}>
          <View style={styles.searchCapsule}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerMiddle}>
              <Text style={styles.routeTitle}>{departureCode} → {arrivalCode}</Text>
              <Text style={styles.routeSubtitle}>{flightListings.length} Flights • {headerDate} • 👤 {passengerCount} • {cabinName}</Text>
            </View>

            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <PencilIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Body */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Horizontal Date Selector Strip */}
          <View style={styles.dateSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {DATE_CHIPS.map((chip) => {
                const key = `${chip.day}, ${chip.date}`;
                const isSelected = selectedDate === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => setSelectedDate(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>
                      {chip.day}, {chip.date}
                    </Text>
                    <Text style={[
                      styles.dateChipPrice,
                      chip.isCheap && styles.cheapPriceText,
                      isSelected && styles.dateChipTextSelected
                    ]}>
                      {chip.price}
                    </Text>
                    {isSelected && <View style={styles.activeUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Calendar Icon Button */}
            <TouchableOpacity style={styles.calendarIconBtn} activeOpacity={0.7}>
              <CalendarIcon />
            </TouchableOpacity>
          </View>




          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              style={[styles.filterPill, { paddingHorizontal: 16 }]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterPillText}>⚙️ Filters</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Listings & In-list Offers */}
          <View style={styles.listingsList}>
            {flightCardsMemo}
          </View>

        </ScrollView>
      </Animated.View>

      {/* Filter Bottom Sheet */}
      <View 
        style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
        pointerEvents={isFilterModalVisible ? 'auto' : 'none'}
      >
        <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', opacity: filterBgAnim }}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setFilterModalVisible(false)}
          />
        </Animated.View>
        
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80%',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            transform: [{ translateY: filterSlideAnim }]
          }}
        >
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>♈</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', fontFamily: FONT_FAMILY }}>Filters</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFilterModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 24, color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  
                  {/* STOPS */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 10, fontFamily: FONT_FAMILY }}>STOPS</Text>
                  <Radio label={`All Flights (${stopsCounts.all})`} selected={stopsFilter === 'all'} onPress={() => setStopsFilter('all')} />
                  <Radio label={`Non-stop (${stopsCounts.zero})`} selected={stopsFilter === '0'} onPress={() => setStopsFilter('0')} />
                  <Radio label={`1 Stop (${stopsCounts.one})`} selected={stopsFilter === '1'} onPress={() => setStopsFilter('1')} />
                  <Radio label={`2+ Stops (${stopsCounts.twoPlus})`} selected={stopsFilter === '2'} onPress={() => setStopsFilter('2')} />

                  {/* AIRLINES */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 24, fontFamily: FONT_FAMILY }}>AIRLINES</Text>
                  <Checkbox label={`All Airlines (${stopsCounts.all})`} checked={airlinesFilter.length === 0} onChange={() => setAirlinesFilter([])} />
                  {Object.entries(airlineCounts).map(([al, count]) => (
                    <Checkbox 
                      key={al} 
                      label={`${al} (${count})`} 
                      checked={airlinesFilter.includes(al)} 
                      onChange={(isChecked: boolean) => {
                        if (isChecked) {
                          setAirlinesFilter([...airlinesFilter, al]);
                        } else {
                          setAirlinesFilter(airlinesFilter.filter((a) => a !== al));
                        }
                      }} 
                    />
                  ))}

                  {/* FARE TYPE */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 24, fontFamily: FONT_FAMILY }}>FARE TYPE</Text>
                  <Checkbox label={`Refundable (${fareTypeCounts.refundable})`} checked={fareTypeFilter === 'refundable'} onChange={() => setFareTypeFilter(fareTypeFilter === 'refundable' ? 'all' : 'refundable')} />
                  <Checkbox label={`Non Refundable (${fareTypeCounts.nonRefundable})`} checked={fareTypeFilter === 'non-refundable'} onChange={() => setFareTypeFilter(fareTypeFilter === 'non-refundable' ? 'all' : 'non-refundable')} />

                  {/* PRICE RANGE */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 24, fontFamily: FONT_FAMILY }}>PRICE RANGE (Max Price)</Text>
                  <SimpleSlider 
                    min={3000} 
                    max={50000} 
                    value={maxPriceFilter} 
                    onValueChange={setMaxPriceFilter} 
                    formatLabel={(v: number) => `₹${v.toLocaleString('en-IN')}`} 
                  />

                  {/* DEPARTURE TIME */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 24, fontFamily: FONT_FAMILY }}>DEPARTURE TIME</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['all', 'morning', 'afternoon', 'evening', 'night'].map((bucket) => (
                      <TouchableOpacity key={bucket} onPress={() => setDepTimeBucket(bucket)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: depTimeBucket === bucket ? '#b48348' : '#e2e8f0', backgroundColor: depTimeBucket === bucket ? '#fef3c7' : 'transparent', marginBottom: 8, marginRight: 8 }}>
                        <Text style={{ fontSize: 12, color: depTimeBucket === bucket ? '#b48348' : '#64748b', fontWeight: '600', fontFamily: FONT_FAMILY }}>{bucket === 'all' ? 'Any Time' : bucket.charAt(0).toUpperCase() + bucket.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ARRIVAL TIME */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8, marginTop: 24, fontFamily: FONT_FAMILY }}>ARRIVAL TIME</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['all', 'morning', 'afternoon', 'evening', 'night'].map((bucket) => (
                      <TouchableOpacity key={bucket} onPress={() => setArrTimeBucket(bucket)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: arrTimeBucket === bucket ? '#b48348' : '#e2e8f0', backgroundColor: arrTimeBucket === bucket ? '#fef3c7' : 'transparent', marginBottom: 8, marginRight: 8 }}>
                        <Text style={{ fontSize: 12, color: arrTimeBucket === bucket ? '#b48348' : '#64748b', fontWeight: '600', fontFamily: FONT_FAMILY }}>{bucket === 'all' ? 'Any Time' : bucket.charAt(0).toUpperCase() + bucket.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                </ScrollView>
                
                <View style={{ paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f5f9' }} onPress={() => {
                    setStopsFilter('all');
                    setAirlinesFilter([]);
                    setFareTypeFilter('all');
                    setMaxPriceFilter(30000);
                    setDepTimeBucket('all');
                    setArrTimeBucket('all');
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b', fontFamily: FONT_FAMILY }}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 2, paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#ea580c' }} onPress={() => setFilterModalVisible(false)}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: 'white', fontFamily: FONT_FAMILY }}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>

              </TouchableOpacity>
        </Animated.View>
      </View>

    </SafeAreaView>
  );
}

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb', // Soft light background
  },
  animationWrapper: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  searchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 22,
    color: '#1e293b',
    fontWeight: 'bold',
    fontFamily: FONT_FAMILY,
  },
  headerMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  routeSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  editButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editIcon: {
    fontSize: 16,
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  dateSelectorContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  dateScroll: {
    paddingLeft: 16,
    paddingVertical: 0,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  dateChipSelected: {
    // Underlined indicator styling below
  },
  dateChipDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  dateChipPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  cheapPriceText: {
    color: '#16a34a', // Green price tag
  },
  dateChipTextSelected: {
    color: '#0f172a',
    fontWeight: '700',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0f172a', // Solid black line matching mockup
  },
  calendarIconBtn: {
    borderLeftWidth: 1,
    borderLeftColor: '#eceff3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarEmoji: {
    fontSize: 16,
  },
  filterPillsScroll: {
    paddingLeft: 16,
    paddingVertical: 12,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  filterPillSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0052cc',
  },
  smartFilterPill: {
    backgroundColor: '#7c3aed', // Purple background
    borderColor: '#7c3aed',
  },
  smartFilterPillActive: {
    backgroundColor: '#6d28d9',
  },
  smartFilterPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  advisorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
  },
  advisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  higherText: {
    color: '#b91c1c', // dark red
  },
  advisorArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  advisorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  advisorTrendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  advisorDesc: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    lineHeight: 15,
    fontFamily: FONT_FAMILY,
  },
  listingsList: {
    paddingHorizontal: 16,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.4,
  },
  brandLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  brandTextCol: {
    flex: 1,
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  flightCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  fareTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d97706',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  timelineContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  timeBlock: {
    alignItems: 'flex-start',
  },
  timeBlockRight: {
    alignItems: 'flex-end',
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  cityCode: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  lineWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  durationLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  horizontalBar: {
    height: 1.5,
    backgroundColor: '#cbd5e1',
    flex: 1,
  },
  stopsLabel: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  priceActionContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  refundableText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  bookNowBtn: {
    backgroundColor: '#b49771',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  bookNowText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  bottomLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  farePillText: {
    fontSize: 9,
    color: '#3b82f6',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  baggageText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginRight: 12,
    fontFamily: FONT_FAMILY,
  },
  seatsPill: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  seatsPillText: {
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  cardPromoRow: {
    alignItems: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  promoText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  greenOffersSection: {
    backgroundColor: '#e6f4ea', // Light green ads section
    marginHorizontal: -16,
    paddingVertical: 12,
    paddingLeft: 16,
    marginBottom: 12,
  },
  greenOffersScroll: {
    paddingRight: 16,
  },
  bankOfferCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    width: 200,
  },
  bankLogoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bankLogoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  bankOfferTexts: {
    flex: 1,
  },
  bankOfferHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankOfferTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  bankPromoLabel: {
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bankPromoText: {
    fontSize: 8,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  bankOfferSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  bankLogoAxis: {
    backgroundColor: '#be123c',
  },
  bankLogoRbl: {
    backgroundColor: '#0284c7',
  },
  accentBannerCard: {
    backgroundColor: '#e0f2fe', // Soft blue accent background
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 8,
  },
  accentBannerTitle: {
    color: '#0369a1',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  pencilWrapper: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pencilBody: {
    width: 13,
    height: 5,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    top: 4,
    left: 2,
  },
  pencilUnderline: {
    width: 8,
    height: 1.5,
    backgroundColor: '#1e293b',
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  calendarWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  calendarRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  calendarRing: {
    width: 1.5,
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 0.75,
  },
  calendarBody: {
    width: 18,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 3,
    backgroundColor: '#ffffff',
    paddingTop: 3,
    alignItems: 'center',
  },
  calendarHeaderLine: {
    height: 1.5,
    backgroundColor: '#1e293b',
    width: '100%',
    marginBottom: 2,
  },
  calendarGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  calendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 1.5,
  },
  noFlightsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  noFlightsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  noFlightsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  noFlightsSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});
