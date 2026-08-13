import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, BackHandler, Modal, Alert, Text, StyleSheet } from 'react-native';
import Onboarding from './src/components/Onboarding';
import SearchScreen from './src/FlightScreen/SearchScreen';
import FlightList from './src/FlightScreen/FlightList';
import FlightFareSelection from './src/FlightScreen/FlightFareSelection';
import PassengerDetails from './src/FlightScreen/PassengerDetails';
import HomeScreen from './src/components/HomeScreen';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import HotelSearchScreen from './src/HotelScreen/HotelSearchScreen';
import HotelListScreen from './src/HotelScreen/HotelListScreen';
import HotelProfileScreen from './src/HotelScreen/HotelProfileScreen';
import HotelBookingScreen from './src/HotelScreen/HotelBookingScreen';
import ProfileScreen from './src/Profile/ProfileScreen';
import { setAuthToken, getAuthToken } from './src/api';
import { flightService } from './src/api/flightService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ScreenType = 'onboarding' | 'login' | 'register' | 'home' | 'hotelSearch' | 'hotelList' | 'hotelProfile' | 'hotelBooking' | 'search' | 'flightList' | 'fareSelection' | 'passengerDetails' | 'profile';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('onboarding');
  const [loading, setLoading] = useState(true);
  const [hotelSearchParams, setHotelSearchParams] = useState<any>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [selectedHotelData, setSelectedHotelData] = useState<any>(null);
  const [selectedRoomData, setSelectedRoomData] = useState<any>(null);
  const [selectedRatePlanData, setSelectedRatePlanData] = useState<any>(null);
  const [previousScreen, setPreviousScreen] = useState<ScreenType>('home');
  const [profileShowBookings, setProfileShowBookings] = useState(false);
  const [flightSearchParams, setFlightSearchParams] = useState<any>(null);
  const [searchTripType, setSearchTripType] = useState<'One Way' | 'Round Trip' | 'Multi City'>('One Way');
  const [flightSearchResults, setFlightSearchResults] = useState<any>(null);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<any>(null);
  const [selectedOutboundOption, setSelectedOutboundOption] = useState<any>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<any>(null);
  const [selectedReturnOption, setSelectedReturnOption] = useState<any>(null);
  const [outboundSessionId, setOutboundSessionId] = useState<string | undefined>();
  const [returnSessionId, setReturnSessionId] = useState<string | undefined>();
  const [roundTripFlowStep, setRoundTripFlowStep] = useState<'outbound' | 'return' | 'none'>('none');
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [outboundSearchResults, setOutboundSearchResults] = useState<any>(null);

  // Multi-City flow states
  const [multiCityStep, setMultiCityStep] = useState<number>(0);
  const [selectedMultiCityFlights, setSelectedMultiCityFlights] = useState<any[]>([]);
  const [selectedMultiCityOptions, setSelectedMultiCityOptions] = useState<any[]>([]);
  const [multiCitySessionIds, setMultiCitySessionIds] = useState<string[]>([]);
  const [multiCityResultsHistory, setMultiCityResultsHistory] = useState<any[]>([]);

  useEffect(() => {
    const handleBackPress = () => {
      if (
        currentScreen === 'home' ||
        currentScreen === 'login' ||
        currentScreen === 'register' ||
        currentScreen === 'onboarding'
      ) {
        return false;
      }

      if (currentScreen === 'hotelSearch') {
        setCurrentScreen('home');
      } else if (currentScreen === 'hotelList') {
        setCurrentScreen('hotelSearch');
      } else if (currentScreen === 'hotelProfile') {
        setCurrentScreen('hotelList');
      } else if (currentScreen === 'hotelBooking') {
        setCurrentScreen('hotelProfile');
      } else if (currentScreen === 'search') {
        setCurrentScreen('home');
      } else if (currentScreen === 'flightList') {
        setCurrentScreen('search');
      } else if (currentScreen === 'fareSelection') {
        setCurrentScreen('flightList');
      } else if (currentScreen === 'passengerDetails') {
        setCurrentScreen('fareSelection');
      } else if (currentScreen === 'profile') {
        setCurrentScreen(previousScreen);
      } else {
        return false;
      }
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [currentScreen, previousScreen]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const onboardingCompleted = await AsyncStorage.getItem('hasCompletedOnboarding');
        if (token) {
          await setAuthToken(token);
          setCurrentScreen('home');
        } else if (onboardingCompleted === 'true') {
          setCurrentScreen('login');
        } else {
          setCurrentScreen('onboarding');
        }
      } catch (err) {
        console.log('Failed to load token:', err);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#0b2e66" />
      </View>
    );
  }

  if (currentScreen === 'onboarding') {
    return (
      <Onboarding
        onComplete={async () => {
          try {
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          } catch (e) {}
          setCurrentScreen('login');
        }}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={() => setCurrentScreen('home')}
        onBackToOnboarding={() => setCurrentScreen('onboarding')}
        onNavigateToRegister={() => setCurrentScreen('register')}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onRegisterSuccess={() => setCurrentScreen('home')}
        onBackToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onSelectFlights={() => setCurrentScreen('search')}
        onSelectHotels={() => setCurrentScreen('hotelSearch')}
      />
    );
  }

  if (currentScreen === 'hotelSearch') {
    return (
      <HotelSearchScreen
        onSearchHotels={(params) => {
          setHotelSearchParams(params);
          setCurrentScreen('hotelList');
        }}
        onBack={() => setCurrentScreen('home')}
        onSelectFlights={() => setCurrentScreen('search')}
        onSelectProfile={(showBookings) => {
          setPreviousScreen('hotelSearch');
          setProfileShowBookings(!!showBookings);
          setCurrentScreen('profile');
        }}
      />
    );
  }

  if (currentScreen === 'hotelList') {
    return (
      <HotelListScreen
        onBack={() => setCurrentScreen('hotelSearch')}
        onChangeSearch={() => setCurrentScreen('hotelSearch')}
        onBookHotel={(hotelId) => {
          setSelectedHotelId(hotelId);
          setCurrentScreen('hotelProfile');
        }}
        onSelectProfile={(showBookings) => {
          setPreviousScreen('hotelList');
          setProfileShowBookings(!!showBookings);
          setCurrentScreen('profile');
        }}
        searchParams={hotelSearchParams}
      />
    );
  }

  if (currentScreen === 'hotelProfile') {
    return (
      <HotelProfileScreen
        hotelId={selectedHotelId}
        searchParams={hotelSearchParams}
        onBack={() => setCurrentScreen('hotelList')}
        onProceedToBooking={(hotel, room, ratePlan) => {
          setSelectedHotelData(hotel);
          setSelectedRoomData(room);
          setSelectedRatePlanData(ratePlan);
          setCurrentScreen('hotelBooking');
        }}
        onConfirmBooking={() => setCurrentScreen('home')}
      />
    );
  }

  if (currentScreen === 'hotelBooking') {
    return (
      <HotelBookingScreen
        hotel={selectedHotelData}
        room={selectedRoomData}
        ratePlan={selectedRatePlanData}
        searchParams={hotelSearchParams}
        onBack={() => setCurrentScreen('hotelProfile')}
        onSuccess={() => setCurrentScreen('home')}
      />
    );
  }

  if (currentScreen === 'flightList' || currentScreen === 'fareSelection') {
    return (
      <View style={{ flex: 1 }}>
        <FlightList
          onBack={() => {
            if (searchTripType === 'Round Trip' && roundTripFlowStep === 'return') {
              setFlightSearchResults(outboundSearchResults);
              setRoundTripFlowStep('outbound');
            } else if (searchTripType === 'Multi City' && multiCityStep > 0) {
              const prevStep = multiCityStep - 1;
              setMultiCityStep(prevStep);
              setFlightSearchResults(multiCityResultsHistory[prevStep]);
              setSelectedMultiCityFlights(prev => prev.slice(0, prevStep));
              setSelectedMultiCityOptions(prev => prev.slice(0, prevStep));
              setMultiCitySessionIds(prev => prev.slice(0, prevStep));
            } else {
              setCurrentScreen('search');
            }
          }}
          onSelectFlight={(flight, updatedResults) => {
            setSelectedFlight(flight);
            if (updatedResults) {
              setFlightSearchResults(updatedResults);
            }
            setCurrentScreen('fareSelection');
          }}
          searchResults={flightSearchResults}
          tripType={searchTripType}
          flightSearchParams={flightSearchParams}
          selectionStep={roundTripFlowStep === 'return' ? 'return' : 'outbound'}
          multiCityStep={multiCityStep}
        />
        {currentScreen === 'fareSelection' && (
          <FlightFareSelection
            searchResults={flightSearchResults}
            selectedFlight={selectedFlight}
            onClose={() => setCurrentScreen('flightList')}
            tripType={searchTripType}
            multiCityStep={multiCityStep}
            onContinue={async (opt, sessId) => {
              if (searchTripType === 'Multi City') {
                const nextStep = multiCityStep + 1;
                const totalSegments = flightSearchParams?.segments?.length || 0;
                
                const updatedFlights = [...selectedMultiCityFlights];
                updatedFlights[multiCityStep] = selectedFlight;
                setSelectedMultiCityFlights(updatedFlights);
                
                const updatedOptions = [...selectedMultiCityOptions];
                updatedOptions[multiCityStep] = opt;
                setSelectedMultiCityOptions(updatedOptions);
                
                const updatedSessionIds = [...multiCitySessionIds];
                updatedSessionIds[multiCityStep] = sessId || sessionId || '';
                setMultiCitySessionIds(updatedSessionIds);

                if (nextStep < totalSegments) {
                  setLoadingReturn(true);
                  setCurrentScreen('flightList');
                  try {
                    const nextSeg = flightSearchParams.segments[nextStep];
                    console.log(`[App] Searching Multi-City next leg ${nextStep + 1} of ${totalSegments} with params:`, {
                      from: nextSeg.from,
                      to: nextSeg.to,
                      departDate: nextSeg.departDate,
                      passengers: flightSearchParams.passengers,
                    });
                    const res = await flightService.searchFlights({
                      from: nextSeg.from,
                      to: nextSeg.to,
                      departDate: nextSeg.departDate,
                      passengers: flightSearchParams.passengers,
                    });
                    if (res && res.success) {
                      setFlightSearchResults(res);
                      
                      const updatedHistory = [...multiCityResultsHistory];
                      updatedHistory[nextStep] = res;
                      setMultiCityResultsHistory(updatedHistory);
                      
                      setMultiCityStep(nextStep);
                    } else {
                      Alert.alert('Error', 'Failed to retrieve flights for the next city.');
                    }
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Error fetching flights for the next city.');
                  } finally {
                    setLoadingReturn(false);
                  }
                } else {
                  const combinedPrice = updatedFlights.reduce((acc, f) => {
                    const priceVal = parseInt(f.price?.replace(/[^0-9]/g, '') || '0', 10);
                    return acc + priceVal;
                  }, 0);
                  
                  const combinedFlight = {
                    ...selectedFlight,
                    id: updatedFlights.map(f => f.id).join('__'),
                    isCombinedMultiCity: true,
                    multiCityFlights: updatedFlights,
                    multiCityOptions: updatedOptions,
                    multiCitySessionIds: updatedSessionIds,
                    multiCityResultsHistory: multiCityResultsHistory,
                    price: `₹${combinedPrice.toLocaleString()}`,
                    rawPrice: combinedPrice,
                  };
                  setSelectedFlight(combinedFlight);
                  setSelectedOption(opt);
                  setSessionId(sessId || sessionId);
                  setCurrentScreen('passengerDetails');
                }
              } else if (searchTripType === 'Round Trip' && roundTripFlowStep === 'outbound') {
                setSelectedOutboundFlight(selectedFlight);
                setSelectedOutboundOption(opt);
                setOutboundSessionId(sessId || sessionId);
                
                setLoadingReturn(true);
                setCurrentScreen('flightList');
                try {
                  console.log('[App] Searching return flights with params:', {
                    from: flightSearchParams?.to,
                    to: flightSearchParams?.from,
                    departDate: flightSearchParams?.returnDate,
                    passengers: flightSearchParams?.passengers,
                  });
                  const res = await flightService.searchFlights({
                    from: flightSearchParams.to,
                    to: flightSearchParams.from,
                    departDate: flightSearchParams.returnDate,
                    passengers: flightSearchParams.passengers,
                  });
                  if (res && res.success) {
                    setFlightSearchResults(res);
                    setRoundTripFlowStep('return');
                  } else {
                    Alert.alert('Error', 'Failed to retrieve return flights.');
                  }
                } catch (e: any) {
                  Alert.alert('Error', e.message || 'Error fetching return flights.');
                } finally {
                  setLoadingReturn(false);
                }
              } else if (searchTripType === 'Round Trip' && roundTripFlowStep === 'return') {
                setSelectedReturnFlight(selectedFlight);
                setSelectedReturnOption(opt);
                setReturnSessionId(sessId || sessionId);
                
                // Combine them
                const combinedFlight = {
                  ...selectedFlight,
                  id: `${selectedOutboundFlight.id}__${selectedFlight.id}`,
                  isCombinedRoundTrip: true,
                  outboundFlight: selectedOutboundFlight,
                  returnFlight: selectedFlight,
                  price: `₹${((selectedOutboundFlight.rawPrice || 0) + (selectedFlight.rawPrice || 0)).toLocaleString()}`,
                  rawPrice: (selectedOutboundFlight.rawPrice || 0) + (selectedFlight.rawPrice || 0),
                };
                setSelectedFlight(combinedFlight);
                
                // Set options for checkout page
                setSelectedOption(opt);
                setSessionId(sessId || sessionId);
                
                setRoundTripFlowStep('none');
                setCurrentScreen('passengerDetails');
              } else {
                if (opt) setSelectedOption(opt);
                if (sessId) setSessionId(sessId);
                setCurrentScreen('passengerDetails');
              }
            }}
          />
        )}
        {loadingReturn && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
            <ActivityIndicator size="large" color="#ea580c" />
            <Text style={{ marginTop: 12, color: '#0f172a', fontWeight: '700', fontSize: 15, fontFamily: 'sans-serif' }}>Searching Return Flights...</Text>
          </View>
        )}
      </View>
    );
  }

  if (currentScreen === 'passengerDetails') {
    return (
      <PassengerDetails
        onBack={() => setCurrentScreen('fareSelection')}
        onNavigateSearch={() => setCurrentScreen('search')}
        searchResults={flightSearchResults}
        selectedFlight={selectedFlight}
        selectedOption={selectedOption}
        sessionId={sessionId}
        outboundSearchResults={outboundSearchResults}
        outboundOption={selectedOutboundOption}
        outboundSessionId={outboundSessionId}
        flightSearchParams={flightSearchParams}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        onBack={() => setCurrentScreen(previousScreen)}
        onLogout={() => {
          setAuthToken(null);
          setCurrentScreen('login');
        }}
        initialShowBookings={profileShowBookings}
      />
    );
  }

  return (
    <SearchScreen
      onSearch={(results, tripType, params) => {
        setFlightSearchResults(results);
        setOutboundSearchResults(results);
        setSearchTripType(tripType || 'One Way');
        setFlightSearchParams(params);
        if (tripType === 'Round Trip') {
          setRoundTripFlowStep('outbound');
        } else {
          setRoundTripFlowStep('none');
        }
        if (tripType === 'Multi City') {
          setMultiCityStep(0);
          setSelectedMultiCityFlights([]);
          setSelectedMultiCityOptions([]);
          setMultiCitySessionIds([]);
          setMultiCityResultsHistory([results]);
        }
        setCurrentScreen('flightList');
      }}
      onBack={() => setCurrentScreen('home')}
      onSelectHotels={() => setCurrentScreen('hotelSearch')}
      onSelectProfile={(showBookings) => {
        setPreviousScreen('search');
        setProfileShowBookings(!!showBookings);
        setCurrentScreen('profile');
      }}
    />
  );
}

export default App;

