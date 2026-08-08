import React, { useState } from 'react';
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

type ScreenType = 'onboarding' | 'login' | 'register' | 'home' | 'hotelSearch' | 'hotelList' | 'hotelProfile' | 'search' | 'flightList' | 'fareSelection' | 'passengerDetails';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('onboarding');

  if (currentScreen === 'onboarding') {
    return <Onboarding onComplete={() => setCurrentScreen('login')} />;
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
        onSearchHotels={() => setCurrentScreen('hotelList')}
        onBack={() => setCurrentScreen('home')}
        onSelectFlights={() => setCurrentScreen('search')}
      />
    );
  }

  if (currentScreen === 'hotelList') {
    return (
      <HotelListScreen
        onBack={() => setCurrentScreen('hotelSearch')}
        onChangeSearch={() => setCurrentScreen('hotelSearch')}
        onBookHotel={() => setCurrentScreen('hotelProfile')}
      />
    );
  }

  if (currentScreen === 'hotelProfile') {
    return (
      <HotelProfileScreen
        onBack={() => setCurrentScreen('hotelList')}
        onConfirmBooking={() => setCurrentScreen('home')}
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

  return (
    <SearchScreen
      onSearch={() => setCurrentScreen('flightList')}
      onBack={() => setCurrentScreen('home')}
      onSelectHotels={() => setCurrentScreen('hotelSearch')}
    />
  );
}

export default App;

