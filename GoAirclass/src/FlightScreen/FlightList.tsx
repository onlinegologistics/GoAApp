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
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { flightService } from '../api/flightService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightListProps {
  onBack: () => void;
  onSelectFlight: (selectedFlight?: any, updatedResults?: any) => void;
  searchResults?: any;
  tripType?: 'One Way' | 'Round Trip' | 'Multi City';
  flightSearchParams?: any;
  selectionStep?: 'outbound' | 'return';
  multiCityStep?: number;
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

export default function FlightList({ onBack, onSelectFlight, searchResults, tripType, flightSearchParams, selectionStep = 'outbound', multiCityStep = 0 }: FlightListProps) {
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

  const listRef = useRef<FlatList>(null);
  const [resultsState, setResultsState] = useState<any>(searchResults);
  useEffect(() => {
    setResultsState(searchResults);
  }, [searchResults]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const initialParams = useMemo(() => {
    const rootObj = searchResults?.data?.data || searchResults?.data || searchResults || {};
    const intentObj = rootObj.searchIntent || {};
    const searchIntent = (typeof intentObj === 'object' ? Object.values(intentObj)[0] : {}) as any || {};
    
    const from = searchIntent.origin || rootObj.departureCode || '';
    const to = searchIntent.destination || rootObj.arrivalCode || '';
    const departDate = searchIntent.departDate || rootObj.headerDate || '';
    const cabinClass = searchIntent.cabin || rootObj.cabinName || 'Economy';

    const adults = searchIntent.paxCriteria?.find((p: any) => p.type === 'ADT')?.count || 1;
    const chd = searchIntent.paxCriteria?.find((p: any) => p.type === 'CHD')?.count || 0;
    const inf = searchIntent.paxCriteria?.find((p: any) => p.type === 'INF')?.count || 0;

    return {
      from,
      to,
      departDate,
      passengers: { adults, children: chd, infants: inf },
      cabinClass,
    };
  }, [searchResults]);

  const fetchPage = async (pageNumber: number, filterOverrides?: any) => {
    setLoading(true);
    try {
      const activeStops = filterOverrides?.stops !== undefined ? filterOverrides.stops : stopsFilter;
      const activeAirlines = filterOverrides?.airlines !== undefined ? filterOverrides.airlines : airlinesFilter;
      const activeFareType = filterOverrides?.fareType !== undefined ? filterOverrides.fareType : fareTypeFilter;
      const activeMaxPrice = filterOverrides?.maxPrice !== undefined ? filterOverrides.maxPrice : maxPriceFilter;
      const activeDepTime = filterOverrides?.depTimeBucket !== undefined ? filterOverrides.depTimeBucket : depTimeBucket;
      const activeArrTime = filterOverrides?.arrTimeBucket !== undefined ? filterOverrides.arrTimeBucket : arrTimeBucket;

      const res = await flightService.searchFlights({
        ...initialParams,
        page: pageNumber,
        limit: 15,
        stops: activeStops,
        airlines: activeAirlines,
        fareType: activeFareType,
        maxPrice: activeMaxPrice,
        depTimeBucket: activeDepTime,
        arrTimeBucket: activeArrTime
      });

      if (res && res.success) {
        setResultsState(res);
        setCurrentPage(pageNumber);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else {
        Alert.alert('Error', 'Failed to retrieve flights for the selected page.');
      }
    } catch (e: any) {
      console.error('Failed to fetch paginated flights:', e.message);
      Alert.alert('Error', e.message || 'Error occurred while loading flights.');
    } finally {
      setLoading(false);
    }
  };

  const rootObj = resultsState?.data?.data || resultsState?.data || resultsState || {};
  const flights = (rootObj.flights || []) as FlightListing[];
  const totalPages = rootObj.totalPages || 1;
  const totalItems = rootObj.totalItems || 0;
  const hasNextPage = !!rootObj.hasNextPage;
  const hasPreviousPage = !!rootObj.hasPreviousPage;

  const departureCode = rootObj.departureCode || initialParams.from || '';
  const arrivalCode = rootObj.arrivalCode || initialParams.to || '';
  const headerDate = rootObj.headerDate || initialParams.departDate || '';
  const passengerCount = rootObj.passengerCount || '1';
  const cabinName = rootObj.cabinName || 'Economy';

  const airlineCounts = rootObj.airlineCounts || {};
  const fareTypeCounts = rootObj.fareTypeCounts || { refundable: 0, nonRefundable: 0 };
  const stopsCounts = rootObj.stopsCounts || { all: 0, zero: 0, one: 0, twoPlus: 0 };

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

  const isRoundTripSearch = useMemo(() => {
    return tripType === 'Round Trip';
  }, [tripType]);

  const displayDepartureCode = departureCode;
  const displayArrivalCode = arrivalCode;
  const displayHeaderDate = headerDate;

  const visibleFlights = flights;

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
              <Text style={styles.routeTitle}>
                {isRoundTripSearch ? `[${selectionStep === 'outbound' ? 'Outbound' : 'Return'}] ` : ''}
                {tripType === 'Multi City' ? `[Trip ${multiCityStep + 1} of ${flightSearchParams?.segments?.length || 2}] ` : ''}
                {displayDepartureCode} → {displayArrivalCode}
              </Text>
              <Text style={styles.routeSubtitle}>{visibleFlights.length} Flights • {displayHeaderDate} • 👤 {passengerCount} • {cabinName}</Text>
            </View>

            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <PencilIcon />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={visibleFlights}
          keyExtractor={(item, index) => item.id || String(index)}
          ListHeaderComponent={
            <>
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
            </>
          }
          renderItem={({ item: flight, index: idx }) => {
            const displayAirline = flight.airline;
            const displayCode = flight.code;
            const displayLogoBg = flight.logoBg;
            const displayLogoChar = flight.logoChar;
            const displayDepTime = flight.depTime;
            const displayArrTime = flight.arrTime;
            const displayDuration = flight.duration;
            const displayStops = flight.stops;

            return (
              <TouchableOpacity
                key={flight.id || idx}
                style={styles.flightCard}
                onPress={() => {
                  onSelectFlightRef.current(flight, resultsState);
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardMainRow}>
                  <View style={styles.brandContainer}>
                    <View style={[styles.brandLogoCircle, { backgroundColor: displayLogoBg }]}>
                      <Text style={styles.logoText}>{displayLogoChar}</Text>
                    </View>
                    <View style={styles.brandTextCol}>
                      <Text style={styles.airlineName}>{displayAirline}</Text>
                      <Text style={styles.flightCode}>{displayCode}</Text>
                      <Text style={styles.fareTypeText}>{flight.fareType.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.timelineContainer}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeValue}>{displayDepTime}</Text>
                      <Text style={styles.cityCode}>{departureCode}</Text>
                    </View>
                    <View style={styles.lineWrapper}>
                      <Text style={styles.durationLabel}>{displayDuration}</Text>
                      <View style={styles.lineContainer}>
                        <View style={styles.dot} />
                        <View style={styles.horizontalBar} />
                        <View style={styles.dot} />
                      </View>
                      <Text style={styles.stopsLabel}>{displayStops}</Text>
                    </View>
                    <View style={styles.timeBlockRight}>
                      <Text style={styles.timeValue}>{displayArrTime}</Text>
                      <Text style={styles.cityCode}>{arrivalCode}</Text>
                    </View>
                  </View>
                  <View style={styles.priceActionContainer}>
                    <Text style={styles.priceValue}>{flight.price}</Text>
                    <Text style={[
                      styles.refundableText,
                      { color: flight.refundableText?.toLowerCase().includes('non') ? '#dc2626' : '#16a34a' }
                    ]}>
                      {flight.refundableText}
                    </Text>
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
                  {flight.seatsLeft !== undefined && flight.seatsLeft !== null && flight.seatsLeft > 0 && flight.seatsLeft <= 5 && (
                    <View style={styles.seatsPill}>
                      <Text style={styles.seatsPillText}>⚠️ {flight.seatsLeft} seat(s) left</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14, fontFamily: FONT_FAMILY }}>Loading flights...</Text>
              </View>
            ) : (
              <View style={styles.noFlightsCard}>
                <Text style={styles.noFlightsEmoji}>✈️</Text>
                <Text style={styles.noFlightsTitle}>No Flights Found</Text>
                <Text style={styles.noFlightsSub}>Please try adjusting your filters.</Text>
              </View>
            )
          }
          ListFooterComponent={
            flights.length > 0 && totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, !hasPreviousPage && styles.pageBtnDisabled]}
                  disabled={!hasPreviousPage || loading}
                  onPress={() => fetchPage(currentPage - 1)}
                >
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.pageNumbersContainer}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = pageNum === currentPage;
                    return (
                      <TouchableOpacity
                        key={pageNum}
                        style={[styles.pageNumberBtn, isCurrent && styles.pageNumberBtnActive]}
                        disabled={loading}
                        onPress={() => fetchPage(pageNum)}
                      >
                        <Text style={[styles.pageNumberText, isCurrent && styles.pageNumberTextActive]}>
                          {pageNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, !hasNextPage && styles.pageBtnDisabled]}
                  disabled={!hasNextPage || loading}
                  onPress={() => fetchPage(currentPage + 1)}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
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
                    fetchPage(1, { stops: 'all', airlines: [], fareType: 'all', maxPrice: 30000, depTimeBucket: 'all', arrTimeBucket: 'all' });
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b', fontFamily: FONT_FAMILY }}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 2, paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#ea580c' }} onPress={() => {
                    fetchPage(1);
                    setFilterModalVisible(false);
                  }}>
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
    paddingVertical: 18,
    marginHorizontal: 12,
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
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eceff3',
    marginTop: 10,
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#ea580c',
  },
  pageBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  pageBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNumberBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pageNumberBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  pageNumberTextActive: {
    color: '#ffffff',
  },
});
