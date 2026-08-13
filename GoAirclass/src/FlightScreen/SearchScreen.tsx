import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import BottomTabNavigation, { BottomTabType } from '../components/BottomTabNavigation';
import { flightService } from '../api';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

type CategoryType = 'Flights' | 'Hotels' | 'My Trips';
type TripType = 'One Way' | 'Round Trip' | 'Multi City';

interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
}

const OFFERS: Offer[] = [
  {
    id: '1',
    title: 'Flat 20% Off',
    description: 'On Canada Airways bookings',
    code: 'GOAIR20',
    discount: '20% OFF',
  },
  {
    id: '2',
    title: 'Save up to $150',
    description: 'On United Emirates flights',
    code: 'FLYUAE',
    discount: '$150 OFF',
  },
  {
    id: '3',
    title: 'Air India Special',
    description: 'Get extra baggage allowance',
    code: 'BAGFREE',
    discount: 'FREE BAG',
  },
];

interface IconProps {
  active?: boolean;
  color?: string;
}

// Vector Icon Drawings

const PlaneIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <Text style={[styles.planeGlyph, { color }]}>✈</Text>
  </View>
);

const HotelIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <Text style={[styles.hotelGlyph, { color }]}>🏨</Text>
  </View>
);

const BriefcaseIcon = ({ color = '#64748b' }: IconProps) => (
  <View style={styles.vectorIconContainer}>
    <View style={[styles.suitcaseHandle, { borderColor: color }]}>
      <View style={[styles.suitcaseBody, { borderColor: color }]} />
    </View>
  </View>
);

interface SearchScreenProps {
  onSearch: (results: any, tripType?: 'One Way' | 'Round Trip' | 'Multi City', params?: any) => void;
  onBack?: () => void;
  onSelectHotels?: () => void;
  onSelectProfile?: (showBookings?: boolean) => void;
}

interface MultiCitySegment {
  from: string;
  fromCode: string;
  fromCity: string;
  to: string;
  toCode: string;
  toCity: string;
  date: Date;
}

export default function SearchScreen({ onSearch, onBack, onSelectHotels, onSelectProfile }: SearchScreenProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Flights');
  const [activeTab, setActiveTab] = useState<BottomTabType>('Home');
  const [tripType, setTripType] = useState<TripType>('One Way');

  // Location Input States
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');

  // Suggestions states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSuggestField, setActiveSuggestField] = useState<'from' | 'to' | null>(null);

  // Multi-City states
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>([
    { from: 'Mumbai (BOM)', fromCode: 'BOM', fromCity: 'Mumbai', to: 'New Delhi (DEL)', toCode: 'DEL', toCity: 'New Delhi', date: new Date() },
    { from: 'New Delhi (DEL)', fromCode: 'DEL', fromCity: 'New Delhi', to: '', toCode: '', toCity: '', date: new Date(Date.now() + 86400000) },
  ]);

  // Search Modal state
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTarget, setSearchTarget] = useState<{
    type: 'standard' | 'multicity';
    field: 'from' | 'to';
    index?: number;
  } | null>(null);

  // Date selection states
  const [departDate, setDepartDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [pickingDateType, setPickingDateType] = useState<
    | 'depart'
    | 'return'
    | { index: number }
  >('depart');
  const [loading, setLoading] = useState<boolean>(false);

  const getMonthAbbreviation = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getMonthDaysGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get weekday of 1st day (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // But our grid starts on Monday (Mon = 0, Tue = 1, ..., Sun = 6)
    let startOffset = firstDay.getDay() - 1; 
    if (startOffset < 0) startOffset = 6; // Sunday is 6
    
    const grid = [];
    
    // Fill offset days
    for (let i = 0; i < startOffset; i++) {
      grid.push({ date: null, dayNum: null, isDisabled: true, isWeekend: false });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fill actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dayOfWeek = dayDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isDisabled = dayDate < today;
      
      grid.push({
        date: dayDate,
        dayNum: d,
        isDisabled,
        isWeekend
      });
    }
    
    return grid;
  };

  const renderCalendarMonth = (year: number, month: number) => {
    const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysGrid = getMonthDaysGrid(year, month);
    
    return (
      <View style={styles.calendarMonthContainer} key={`${year}-${month}`}>
        <Text style={styles.calendarMonthHeader}>{monthName}</Text>
        <View style={styles.calendarGrid}>
          {daysGrid.map((day, idx) => {
            if (day.dayNum === null) {
              return <View key={`empty-${idx}`} style={styles.calendarDayCell} />;
            }
            
            const isSelected = typeof pickingDateType === 'string'
              ? (pickingDateType === 'depart'
                ? day.date?.toDateString() === departDate.toDateString()
                : day.date?.toDateString() === returnDate.toDateString())
              : (pickingDateType && day.date?.toDateString() === multiCitySegments[pickingDateType.index]?.date?.toDateString());
              
            return (
              <TouchableOpacity
                key={`day-${day.dayNum}`}
                style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected]}
                disabled={day.isDisabled}
                onPress={() => {
                  if (day.date) {
                    if (typeof pickingDateType === 'string') {
                      if (pickingDateType === 'depart') {
                        setDepartDate(day.date);
                      } else {
                        setReturnDate(day.date);
                      }
                    } else if (pickingDateType && typeof pickingDateType === 'object' && 'index' in pickingDateType) {
                      const newSegments = [...multiCitySegments];
                      newSegments[pickingDateType.index].date = day.date;
                      setMultiCitySegments(newSegments);
                    }
                    setShowDatePicker(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayText,
                  day.isWeekend && styles.calendarDayTextWeekend,
                  day.isDisabled && styles.calendarDayTextDisabled,
                  isSelected && styles.calendarDayTextSelected
                ]}>
                  {day.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const fetchSuggestions = async (text: string, field: 'from' | 'to') => {
    if (field === 'from') {
      setFromLocation(text);
    } else {
      setToLocation(text);
    }

    // Clean text: keep only letters and spaces (remove parentheses, numbers, etc.)
    const cleanText = text.replace(/[^a-zA-Z\s]/g, '').trim();

    if (cleanText.length < 2) {
      setSuggestions([]);
      setActiveSuggestField(null);
      return;
    }

    try {
      console.log(`[Suggestion Debug] Fetching for "${cleanText}"...`);
      const resData = await flightService.searchAirports(cleanText);
      console.log('[Suggestion Debug] resData received:', JSON.stringify(resData));
      
      if (resData && resData.success && resData.data) {
        const airports = Array.isArray(resData.data)
          ? resData.data
          : (Array.isArray(resData.data.airportData)
            ? resData.data.airportData
            : (Array.isArray(resData.data.airports) ? resData.data.airports : (resData.data.data && Array.isArray(resData.data.data) ? resData.data.data : [])));
        
        console.log('[Suggestion Debug] parsed airports:', airports);
        setSuggestions(airports);
        setActiveSuggestField(field);
      } else {
        console.log('[Suggestion Debug] resData structure invalid or success is false');
      }
    } catch (err) {
      console.log('[Suggestion Debug] Airport search suggest error:', err);
    }
  };

  const fetchModalSuggestions = async (text: string) => {
    setSearchQuery(text);
    const cleanText = text.replace(/[^a-zA-Z\s]/g, '').trim();
    if (cleanText.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const resData = await flightService.searchAirports(cleanText);
      if (resData && resData.success && resData.data) {
        const airports = Array.isArray(resData.data)
          ? resData.data
          : (Array.isArray(resData.data.airportData)
            ? resData.data.airportData
            : (Array.isArray(resData.data.airports) ? resData.data.airports : (resData.data.data && Array.isArray(resData.data.data) ? resData.data.data : [])));
        setSuggestions(airports);
      }
    } catch (err) {
      console.log('Search modal suggest error:', err);
    }
  };

  const addSegment = () => {
    if (multiCitySegments.length >= 5) return;
    const lastSeg = multiCitySegments[multiCitySegments.length - 1];
    setMultiCitySegments([
      ...multiCitySegments,
      {
        from: lastSeg.to,
        fromCode: lastSeg.toCode,
        fromCity: lastSeg.toCity,
        to: '',
        toCode: '',
        toCity: '',
        date: new Date(lastSeg.date.getTime() + 86400000),
      }
    ]);
  };

  const removeSegment = (index: number) => {
    if (multiCitySegments.length <= 2) return;
    const updated = [...multiCitySegments];
    updated.splice(index, 1);
    setMultiCitySegments(updated);
  };

  // Passenger Count State
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [showTravelerDropdown, setShowTravelerDropdown] = useState<boolean>(false);
  const [cabinClass, setCabinClass] = useState<string>('Economy');
  const [showCabinDropdown, setShowCabinDropdown] = useState<boolean>(false);

  const handleSearchClick = async () => {
    let results = null;
    let params: any = null;
    setLoading(true);
    try {
      if (tripType === 'Multi City') {
        const formattedSegments = multiCitySegments.map(seg => {
          const year = seg.date.getFullYear();
          const month = String(seg.date.getMonth() + 1).padStart(2, '0');
          const day = String(seg.date.getDate()).padStart(2, '0');
          return {
            from: seg.from,
            to: seg.to,
            departDate: `${year}-${month}-${day}`
          };
        });

        params = {
          segments: formattedSegments,
          passengers: { adults, children, infants },
          cabinClass,
        };

        const firstSeg = formattedSegments[0];
        const searchParam = {
          from: firstSeg.from,
          to: firstSeg.to,
          departDate: firstSeg.departDate,
          passengers: { adults, children, infants },
          cabinClass,
        };
        results = await flightService.searchFlights(searchParam);
      } else {
        const year = departDate.getFullYear();
        const month = String(departDate.getMonth() + 1).padStart(2, '0');
        const day = String(departDate.getDate()).padStart(2, '0');
        const formattedDepartDate = `${year}-${month}-${day}`;

        params = {
          from: fromLocation,
          to: toLocation,
          departDate: formattedDepartDate,
          passengers: { adults, children, infants },
          cabinClass,
        };

        if (tripType === 'Round Trip' && returnDate) {
          const retYear = returnDate.getFullYear();
          const retMonth = String(returnDate.getMonth() + 1).padStart(2, '0');
          const retDay = String(returnDate.getDate()).padStart(2, '0');
          params.returnDate = `${retYear}-${retMonth}-${retDay}`;
        }

        const firstSearchParam = { ...params };
        if (tripType === 'Round Trip') {
          delete firstSearchParam.returnDate;
        }

        results = await flightService.searchFlights(firstSearchParam);
      }
    } catch (e: any) {
      console.log('Flight Search API:', e?.message);
    } finally {
      setLoading(false);
    }
    onSearch(results, tripType, params);
  };

  const handleTabChange = (tab: BottomTabType) => {
    setActiveTab(tab);
    if (tab === 'My Account' && onSelectProfile) {
      onSelectProfile(false);
    } else if (tab === 'Bookings' && onSelectProfile) {
      onSelectProfile(true);
    }
  };

  // Stepper Functions
  const incrementAdults = () => setAdults((prev) => Math.min(prev + 1, 9));
  const decrementAdults = () => setAdults((prev) => Math.max(prev - 1, 1)); // min 1 adult

  const incrementChildren = () => setChildren((prev) => Math.min(prev + 1, 9));
  const decrementChildren = () => setChildren((prev) => Math.max(prev - 1, 0));

  const incrementInfants = () => setInfants((prev) => Math.min(prev + 1, 9));
  const decrementInfants = () => setInfants((prev) => Math.max(prev - 1, 0));

  // Sliding Indicator Animation
  const slideX = useRef(new Animated.Value(0)).current;
  const tabWidth = (SCREEN_WIDTH - 44) / 3;

  useEffect(() => {
    let toIndex = 0;
    if (activeCategory === 'Hotels') toIndex = 1;
    if (activeCategory === 'My Trips') toIndex = 2;

    Animated.spring(slideX, {
      toValue: toIndex * tabWidth,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [activeCategory, slideX, tabWidth]);

  // Screen entrance landing animations
  const entranceSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.spring(entranceSlide, {
      toValue: 0,
      tension: 40,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [entranceSlide]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animationWrapper, { transform: [{ translateY: entranceSlide }] }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Navy Header Section */}
          <View style={styles.header}>
            {/* Subtle background concentric circles */}
            <View style={styles.concentricRing1} />
            <View style={styles.concentricRing2} />
            <View style={styles.concentricRing3} />

            <View style={styles.headerContent}>
              <View style={styles.userInfoRow}>
                {onBack && (
                  <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                )}
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                  style={styles.avatarImage}
                />
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingLabel}>Good Morning</Text>
                  <Text style={styles.greetingName}>Shahinur Rahman</Text>
                </View>
              </View>

              {/* Notification Badge */}
              <TouchableOpacity style={styles.notificationBadge} activeOpacity={0.8}>
                <View style={styles.bellIconVector}>
                  <View style={styles.bellCap} />
                  <View style={styles.bellBody} />
                  <View style={styles.bellClapper} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Large Header Title */}
            <Text style={styles.headerTitle}>
              Securely Book{'\n'}your Flight Ticket
            </Text>
          </View>

          {/* Categories Tab selector overlapping header */}
          <View style={styles.categoryCard}>
            {/* Smooth sliding active indicator */}
            <Animated.View style={[styles.slidingIndicator, { width: tabWidth, transform: [{ translateX: slideX }] }]} />

            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => setActiveCategory('Flights')}
                activeOpacity={0.7}
              >
                <PlaneIcon color={activeCategory === 'Flights' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'Flights' && styles.categoryTextActive]}>Flights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => {
                  setActiveCategory('Hotels');
                  if (onSelectHotels) {
                    onSelectHotels();
                  }
                }}
                activeOpacity={0.7}
              >
                <HotelIcon color={activeCategory === 'Hotels' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'Hotels' && styles.categoryTextActive]}>Hotels</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryTab}
                onPress={() => setActiveCategory('My Trips')}
                activeOpacity={0.7}
              >
                <BriefcaseIcon color={activeCategory === 'My Trips' ? '#ffffff' : '#64748b'} />
                <Text style={[styles.categoryText, activeCategory === 'My Trips' && styles.categoryTextActive]}>My Trips</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Flight Search Form Card */}
          <View style={styles.searchCard}>
            {/* Trip Type Selector */}
            <View style={styles.tripTypeRow}>
              {(['One Way', 'Round Trip', 'Multi City'] as TripType[]).map((type) => {
                const isActive = tripType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.tripTypeTab, isActive && styles.tripTypeTabActive]}
                    onPress={() => setTripType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tripTypeText, isActive && styles.tripTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {tripType === 'Multi City' ? (
              <View style={styles.multiCityContainer}>
                {/* Header Labels */}
                <View style={styles.multiCityHeaderRow}>
                  <Text style={[styles.multiCityHeaderLabel, { flex: 1.2 }]}>FROM</Text>
                  <Text style={[styles.multiCityHeaderLabel, { flex: 1.2, marginLeft: 8 }]}>TO</Text>
                  <Text style={[styles.multiCityHeaderLabel, { flex: 1, marginLeft: 8 }]}>DATE</Text>
                  <View style={{ width: 32 }} />
                </View>

                {/* Segments */}
                {multiCitySegments.map((segment, idx) => (
                  <View key={idx} style={styles.multiCitySegmentRow}>
                    {/* FROM Field */}
                    <TouchableOpacity
                      style={[styles.multiCityCard, { flex: 1.2 }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSearchTarget({ type: 'multicity', field: 'from', index: idx });
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowSearchModal(true);
                      }}
                    >
                      {segment.fromCode ? (
                        <View>
                          <Text style={styles.multiCityCodeText}>{segment.fromCode}</Text>
                          <Text style={styles.multiCitySubText} numberOfLines={1}>{segment.fromCity}</Text>
                        </View>
                      ) : (
                        <Text style={styles.multiCityPlaceholder}>From</Text>
                      )}
                    </TouchableOpacity>

                    {/* TO Field */}
                    <TouchableOpacity
                      style={[styles.multiCityCard, { flex: 1.2, marginLeft: 8 }, !segment.toCode && styles.multiCityCardEmpty]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSearchTarget({ type: 'multicity', field: 'to', index: idx });
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowSearchModal(true);
                      }}
                    >
                      {segment.toCode ? (
                        <View>
                          <Text style={styles.multiCityCodeText}>{segment.toCode}</Text>
                          <Text style={styles.multiCitySubText} numberOfLines={1}>{segment.toCity}</Text>
                        </View>
                      ) : (
                        <Text style={styles.multiCityPlaceholderEmpty}>To</Text>
                      )}
                    </TouchableOpacity>

                    {/* DATE Field */}
                    <TouchableOpacity
                      style={[styles.multiCityCard, { flex: 1, marginLeft: 8 }, !segment.date && styles.multiCityCardEmpty]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setPickingDateType({ index: idx });
                        setShowDatePicker(true);
                      }}
                    >
                      {segment.date ? (
                        <View>
                          <Text style={styles.multiCityDateMainText}>
                            {segment.date.getDate()} {getMonthAbbreviation(segment.date)}
                          </Text>
                          <Text style={styles.multiCitySubText}>{segment.date.getFullYear()}</Text>
                        </View>
                      ) : (
                        <Text style={styles.multiCityPlaceholderEmpty}>Date</Text>
                      )}
                    </TouchableOpacity>

                    {/* Delete button */}
                    <View style={styles.deleteButtonContainer}>
                      {multiCitySegments.length > 2 && (
                        <TouchableOpacity
                          style={styles.deleteCircleBtn}
                          onPress={() => removeSegment(idx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteCircleText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                {/* ADD CITY Button */}
                <TouchableOpacity
                  style={styles.addCityDashedBtn}
                  onPress={addSegment}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addCityBtnText}>+ ADD CITY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Stacked From Field */}
                <View style={{ zIndex: 110, position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.inputBlock}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchTarget({ type: 'standard', field: 'from' });
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSearchModal(true);
                    }}
                  >
                    <View style={styles.planeIconCircle}>
                      <Text style={styles.planeIconGlyph}>🛫</Text>
                    </View>
                    <View style={styles.inputTextContainer}>
                      <Text style={styles.inputLabel}>From</Text>
                      <Text style={styles.inputValue}>
                        {fromLocation || 'Enter departure city/country'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Stacked To Field */}
                <View style={{ zIndex: 100, position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.inputBlock}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchTarget({ type: 'standard', field: 'to' });
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSearchModal(true);
                    }}
                  >
                    <View style={styles.planeIconCircle}>
                      <Text style={styles.planeIconGlyph}>🛬</Text>
                    </View>
                    <View style={styles.inputTextContainer}>
                      <Text style={styles.inputLabel}>To</Text>
                      <Text style={styles.inputValue}>
                        {toLocation || 'Enter destination city/country'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Side by Side Dates */}
                <View style={styles.datesRow}>
                  <TouchableOpacity
                    style={[styles.inputBlockHalf, tripType !== 'One Way' && styles.marginRightCell]}
                    onPress={() => {
                      setPickingDateType('depart');
                      setShowDatePicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inputLabel}>Departure</Text>
                    <Text style={styles.dateValue}>{formatDate(departDate)}</Text>
                  </TouchableOpacity>
                  {tripType !== 'One Way' && (
                    <TouchableOpacity
                      style={styles.inputBlockHalf}
                      onPress={() => {
                        setPickingDateType('return');
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.inputLabel}>Return</Text>
                      <Text style={styles.dateValue}>{formatDate(returnDate)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Custom Date Picker Modal */}
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerContainer}>
                  {/* Modal Header */}
                  <View style={styles.calendarHeaderRow}>
                    <Text style={styles.datePickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)} activeOpacity={0.7} style={styles.calendarCloseBtn}>
                      <Text style={styles.calendarCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Weekday Names row */}
                  <View style={styles.weekdayRow}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                      <Text key={w} style={styles.weekdayText}>{w}</Text>
                    ))}
                  </View>

                  {/* Scrollable Months List */}
                  <ScrollView style={styles.calendarMonthsScroll} showsVerticalScrollIndicator={false}>
                    {renderCalendarMonth(new Date().getFullYear(), new Date().getMonth())}
                    {renderCalendarMonth(
                      new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
                      (new Date().getMonth() + 1) % 12
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Premium Airport Search Modal */}
            <Modal
              visible={showSearchModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => {
                setShowSearchModal(false);
                setSuggestions([]);
              }}
            >
              <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.airportSearchContainer}>
                  {/* Modal Header with Back Arrow */}
                  <View style={styles.searchHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowSearchModal(false);
                        setSuggestions([]);
                      }}
                      style={styles.searchBackBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.searchBackBtnText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.searchTitle}>Select Airport</Text>
                  </View>

                  {/* Search Input block */}
                  <View style={styles.searchInputBlock}>
                    <Text style={styles.searchGlassGlyph}>🔍</Text>
                    <TextInput
                      style={styles.searchInputField}
                      autoFocus={true}
                      value={searchQuery}
                      onChangeText={fetchModalSuggestions}
                      placeholder="Type city or airport code..."
                      placeholderTextColor="#94a3b8"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchQuery('');
                          setSuggestions([]);
                        }}
                        style={styles.searchClearBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.searchClearBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Suggestions List */}
                  <ScrollView style={styles.suggestionsListScroll} keyboardShouldPersistTaps="handled">
                    {suggestions.length > 0 ? (
                      suggestions.map((item: any, idx: number) => {
                        const code = item.airportCode || item.code;
                        const city = item.airportCity || item.city || '';
                        const name = item.airportName || item.name || '';
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={styles.modalSuggestionItem}
                            onPress={() => {
                              if (searchTarget) {
                                if (searchTarget.type === 'standard') {
                                  if (searchTarget.field === 'from') {
                                    setFromLocation(`${city || name} (${code})`);
                                  } else {
                                    setToLocation(`${city || name} (${code})`);
                                  }
                                } else if (searchTarget.type === 'multicity' && typeof searchTarget.index === 'number') {
                                  const segmentIdx = searchTarget.index;
                                  const newSegments = [...multiCitySegments];
                                  if (searchTarget.field === 'from') {
                                    newSegments[segmentIdx].from = `${city || name} (${code})`;
                                    newSegments[segmentIdx].fromCode = code;
                                    newSegments[segmentIdx].fromCity = city || name;
                                  } else {
                                    newSegments[segmentIdx].to = `${city || name} (${code})`;
                                    newSegments[segmentIdx].toCode = code;
                                    newSegments[segmentIdx].toCity = city || name;
                                    // Auto-propagate to the next segment's origin
                                    if (segmentIdx + 1 < newSegments.length) {
                                      newSegments[segmentIdx + 1].from = `${city || name} (${code})`;
                                      newSegments[segmentIdx + 1].fromCode = code;
                                      newSegments[segmentIdx + 1].fromCity = city || name;
                                    }
                                  }
                                  setMultiCitySegments(newSegments);
                                }
                              }
                              setShowSearchModal(false);
                              setSuggestions([]);
                            }}
                          >
                            <View style={styles.modalSuggestionLeft}>
                              <Text style={styles.modalSuggestionCode}>{code}</Text>
                            </View>
                            <View style={styles.modalSuggestionDetails}>
                              <Text style={styles.modalSuggestionCity}>{city || name}</Text>
                              <Text style={styles.modalSuggestionName}>{name}</Text>
                            </View>
                            <Text style={styles.modalSuggestionPlaneGlyph}>✈</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      searchQuery.length >= 2 ? (
                        <View style={styles.modalEmptyState}>
                          <Text style={styles.modalEmptyText}>No airports found</Text>
                        </View>
                      ) : (
                        <View style={styles.modalEmptyState}>
                          <Text style={styles.modalEmptyText}>Type at least 2 characters to search</Text>
                        </View>
                      )
                    )}
                  </ScrollView>
                </View>
              </SafeAreaView>
            </Modal>

            {/* Travelers Row (Click to open dropdown) */}
            <TouchableOpacity
              style={styles.travelersContainer}
              onPress={() => {
                setShowTravelerDropdown(!showTravelerDropdown);
                setShowCabinDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.travelersLeft}>
                <Text style={styles.inputLabel}>Travelers</Text>
                <Text style={styles.travelersValue}>
                  {adults + children + infants} Person ({adults} Adt, {children} Chd, {infants} Inf)
                </Text>
              </View>
              <View style={styles.dropdownArrowContainer}>
                <Text style={styles.dropdownArrowGlyph}>▾</Text>
              </View>
            </TouchableOpacity>

            {/* Traveler Stepper Dropdown Popover */}
            {showTravelerDropdown && (
              <View style={styles.travelerDropdown}>
                {/* Adults Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Adults</Text>
                    <Text style={styles.dropdownItemSub}>Age 12 or above</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementAdults} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{adults}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementAdults} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Children Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Children</Text>
                    <Text style={styles.dropdownItemSub}>Age 2 - 12</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementChildren} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{children}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementChildren} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Infants Row */}
                <View style={styles.dropdownRowItem}>
                  <View style={styles.dropdownLabelCol}>
                    <Text style={styles.dropdownItemTitle}>Infants</Text>
                    <Text style={styles.dropdownItemSub}>Under age 2</Text>
                  </View>
                  <View style={styles.stepperPill}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={decrementInfants} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperNumber}>{infants}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={incrementInfants} activeOpacity={0.7}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  style={styles.dropdownDoneBtn}
                  onPress={() => setShowTravelerDropdown(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Cabin Class Row (Click to open dropdown) */}
            <TouchableOpacity
              style={[styles.travelersContainer, { marginTop: 12 }]}
              onPress={() => {
                setShowCabinDropdown(!showCabinDropdown);
                setShowTravelerDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.travelersLeft}>
                <Text style={styles.inputLabel}>Cabin Class</Text>
                <Text style={styles.travelersValue}>{cabinClass}</Text>
              </View>
              <View style={styles.dropdownArrowContainer}>
                <Text style={styles.dropdownArrowGlyph}>▾</Text>
              </View>
            </TouchableOpacity>

            {/* Cabin Class Dropdown Popover */}
            {showCabinDropdown && (
              <View style={styles.travelerDropdown}>
                {['Economy', 'Premium Economy', 'Business', 'First Class'].map((cls) => {
                  const isSelected = cabinClass === cls;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[
                        styles.dropdownRowItem,
                        { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
                        isSelected && { backgroundColor: '#f8fafc' }
                      ]}
                      onPress={() => {
                        setCabinClass(cls);
                        setShowCabinDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.dropdownItemTitle,
                          { fontWeight: isSelected ? '700' : '400', color: isSelected ? '#b48348' : '#0f172a' }
                        ]}>
                          {cls}
                        </Text>
                      </View>
                      {isSelected && <Text style={{ color: '#b48348', fontWeight: 'bold', fontSize: 16 }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Search Button */}
            <TouchableOpacity 
              style={styles.searchBtn} 
              onPress={handleSearchClick} 
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.searchBtnText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Offers Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offers</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.flightsList}>
            {OFFERS.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerLeft}>
                  <View style={styles.offerTagBadge}>
                    <Text style={styles.offerTagIcon}>🏷️</Text>
                  </View>
                  <View style={styles.offerTextCol}>
                    <Text style={styles.offerCardTitle}>{offer.title}</Text>
                    <Text style={styles.offerCardDesc}>{offer.description}</Text>
                  </View>
                </View>
                <View style={styles.offerRight}>
                  <View style={styles.couponCodeContainer}>
                    <Text style={styles.couponCodeText}>{offer.code}</Text>
                  </View>
                  <Text style={styles.offerDiscountText}>{offer.discount}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Reusable Bottom Navigation Component */}
        <BottomTabNavigation activeTab={activeTab} onChangeTab={handleTabChange} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  animationWrapper: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  header: {
    height: 310,
    backgroundColor: '#0e1626', // Charcoal dark navy
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 55,
  },
  concentricRing1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  concentricRing2: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  concentricRing3: {
    position: 'absolute',
    right: -80,
    top: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    },
  greetingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
    },
  notificationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 36,
    letterSpacing: -0.5,
    },
  categoryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -85,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 101,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 12,
    backgroundColor: '#0f172a', // Solid black active background
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 102,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 100,
  },
  tripTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tripTypeTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tripTypeTextActive: {
    color: '#0052cc',
  },
  inputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  planeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planeIconGlyph: {
    fontSize: 14,
    color: '#0052cc',
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  inputValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },
  inputField: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
    padding: 0,
    height: 20,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputBlockHalf: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  marginRightCell: {
    marginRight: 12,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  travelersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  travelersLeft: {
    flex: 1,
  },
  travelersValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepperNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 12,
  },
  searchBtn: {
    backgroundColor: '#0e1626',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  seeAllLink: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  flightsList: {
    marginHorizontal: 20,
  },
  offerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offerTagBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  offerTagIcon: {
    fontSize: 18,
  },
  offerTextCol: {
    flex: 1,
  },
  offerCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  offerCardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  offerRight: {
    alignItems: 'flex-end',
  },
  couponCodeContainer: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f8fafc',
  },
  couponCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0052cc',
  },
  offerDiscountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c5221f',
    marginTop: 4,
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },
  navTextActive: {
    color: '#0052cc',
  },

  // Vector Styles
  vectorIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#94a3b8',
  },
  houseBody: {
    width: 12,
    height: 9,
    backgroundColor: '#94a3b8',
    marginTop: 1,
  },
  ticketShape: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ticketLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#94a3b8',
  },
  ticketDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#94a3b8',
    top: 3,
  },
  clockCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHourHand: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: '#94a3b8',
    top: 3,
  },
  clockMinuteHand: {
    position: 'absolute',
    width: 4,
    height: 2,
    backgroundColor: '#94a3b8',
    right: 3,
    top: 5,
  },
  settingsOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
  },
  blueBackground: {
    backgroundColor: '#0052cc',
  },
  blueBorder: {
    borderColor: '#0052cc',
  },
  blueBackgroundBorder: {
    backgroundColor: '#0052cc',
    borderBottomColor: '#0052cc',
  },
  grayBackground: {
    backgroundColor: '#94a3b8',
  },
  grayBorder: {
    borderColor: '#94a3b8',
  },
  grayBackgroundBorder: {
    backgroundColor: '#94a3b8',
    borderBottomColor: '#94a3b8',
  },

  // Notification Bell Vector
  bellIconVector: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCap: {
    width: 4,
    height: 3,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: -1,
  },
  bellBody: {
    width: 12,
    height: 9,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  bellClapper: {
    width: 4,
    height: 2,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    marginTop: 1,
  },
  planeGlyph: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  hotelGlyph: {
    fontSize: 16,
    color: '#64748b',
  },
  suitcaseHandle: {
    width: 8,
    height: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  suitcaseBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 2,
  },
  dropdownArrowContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrowGlyph: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'bold',
  },
  travelerDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: -8,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dropdownRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownLabelCol: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  dropdownDoneBtn: {
    backgroundColor: '#0e1626',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dropdownDoneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    padding: 4,
    marginBottom: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0052cc',
    width: 50,
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionCity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  suggestionName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    height: '85%',
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  calendarCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCloseText: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '300',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  weekdayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  calendarMonthsScroll: {
    flex: 1,
  },
  calendarMonthContainer: {
    marginBottom: 28,
  },
  calendarMonthHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 24,
  },
  calendarDayCellSelected: {
    backgroundColor: '#0f172a',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  calendarDayTextWeekend: {
    color: '#ef4444',
  },
  calendarDayTextDisabled: {
    color: '#cbd5e1',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
  },
  // Multi City styles
  multiCityContainer: {
    marginBottom: 16,
  },
  multiCityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  multiCityHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  multiCitySegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiCityCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  multiCityCardEmpty: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  multiCityCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  multiCityDateMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  multiCitySubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  multiCityPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  multiCityPlaceholderEmpty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteButtonContainer: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteCircleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircleText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addCityDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },
  addCityBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },

  // Premium Airport Search Modal Styles
  airportSearchContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBackBtn: {
    marginRight: 16,
    padding: 4,
  },
  searchBackBtnText: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  searchInputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  searchGlassGlyph: {
    fontSize: 16,
    color: '#94a3b8',
    marginRight: 10,
  },
  searchInputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearBtnText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  suggestionsListScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalSuggestionLeft: {
    width: 60,
    height: 36,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalSuggestionCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  modalSuggestionDetails: {
    flex: 1,
  },
  modalSuggestionCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSuggestionName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalSuggestionPlaneGlyph: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
