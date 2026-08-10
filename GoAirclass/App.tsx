import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, BackHandler } from 'react-native';
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
        onSelectProfile={() => {
          setPreviousScreen('hotelSearch');
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

  if (currentScreen === 'flightList') {
    return (
      <FlightList
        onBack={() => setCurrentScreen('search')}
        onSelectFlight={() => setCurrentScreen('fareSelection')}
      />
    );
  }

  if (currentScreen === 'fareSelection') {
    return (
      <FlightFareSelection
        onClose={() => setCurrentScreen('flightList')}
        onContinue={() => setCurrentScreen('passengerDetails')}
      />
    );
  }

  if (currentScreen === 'passengerDetails') {
    return <PassengerDetails onBack={() => setCurrentScreen('fareSelection')} />;
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        onBack={() => setCurrentScreen(previousScreen)}
        onLogout={() => {
          setAuthToken(null);
          setCurrentScreen('login');
        }}
      />
    );
  }

  return (
    <SearchScreen
      onSearch={() => setCurrentScreen('flightList')}
      onBack={() => setCurrentScreen('home')}
      onSelectHotels={() => setCurrentScreen('hotelSearch')}
      onSelectProfile={() => {
        setPreviousScreen('search');
        setCurrentScreen('profile');
      }}
    />
  );
}

export default App;

