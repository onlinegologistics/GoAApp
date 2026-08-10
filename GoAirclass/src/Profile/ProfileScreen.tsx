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
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import apiClient from '../api/apiClient';
import MyBookings from './MyBookings';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export default function ProfileScreen({ onBack, onLogout }: ProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showMyBookings, setShowMyBookings] = useState(false);

  useEffect(() => {
    const handleBackPress = () => {
      if (showMyBookings) {
        return false; // let MyBookings components handle their own back press
      }
      onBack();
      return true; // prevent default closing behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [showMyBookings, onBack]);

  useEffect(() => {
    // Fetch profile data from backend on mount
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/users/profile');
        if (response.data && response.data.fullName) {
          setUserName(response.data.fullName);
          if (response.data.email) {
            setUserEmail(response.data.email);
          }
        } else {
          setUserName('Guest User');
        }
      } catch (error) {
        console.log('Failed to fetch user profile, falling back to Guest User:', error);
        setUserName('Guest User');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditPhoto = () => {
    Alert.alert('Edit Photo', 'Choose profile photo option');
  };

  const handleOptionPress = (optionTitle: string) => {
    if (optionTitle === 'Log out') {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]);
    } else if (optionTitle === 'My Bookings') {
      setShowMyBookings(true);
    } else {
      Alert.alert(optionTitle, `${optionTitle} option selected.`);
    }
  };

  // Custom vector drawings for leading icons
  const renderIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.head} />
            <View style={styles.body} />
          </View>
        );
      case 'payment':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.cardOutline}>
              <View style={styles.cardStrip} />
            </View>
          </View>
        );
      case 'wallet':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.walletOutline}>
              <View style={styles.walletFlap} />
            </View>
          </View>
        );
      case 'bookings':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.calendarOutline}>
              <View style={styles.calendarHeader} />
              <View style={styles.calendarGrid} />
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.gearCenter}>
              {[0, 45, 90, 135].map((angle, idx) => (
                <View
                  key={idx}
                  style={[styles.gearTooth, { transform: [{ rotate: `${angle}deg` }] }]}
                />
              ))}
            </View>
          </View>
        );
      case 'help':
        return (
          <View style={styles.iconCircle}>
            <Text style={styles.infoText}>i</Text>
          </View>
        );
      case 'privacy':
        return (
          <View style={styles.iconCircle}>
            <View style={styles.lockBody}>
              <View style={styles.lockShackle} />
            </View>
          </View>
        );
      case 'logout':
        return (
          <View style={[styles.iconCircle, { borderColor: '#ef4444' }]}>
            <View style={styles.logoutArrow} />
            <View style={styles.logoutDoor} />
          </View>
        );
      default:
        return null;
    }
  };

  const menuOptions = [
    { title: 'Your profile', iconKey: 'profile' },
    { title: 'Payment Methods', iconKey: 'payment' },
    { title: 'My Wallet', iconKey: 'wallet' },
    { title: 'My Bookings', iconKey: 'bookings' },
    { title: 'Settings', iconKey: 'settings' },
    { title: 'Help Center', iconKey: 'help' },
    { title: 'Privacy Policy', iconKey: 'privacy' },
    { title: 'Log out', iconKey: 'logout', isLogout: true },
  ];

  if (showMyBookings) {
    return <MyBookings onBack={() => setShowMyBookings(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Image & Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' }}
              style={styles.avatarImage}
            />
            <TouchableOpacity style={styles.editBadge} onPress={handleEditPhoto} activeOpacity={0.8}>
              <Text style={styles.editIconGlyph}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 15 }} />
          ) : userName === 'Guest User' ? (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={[styles.userNameText, { color: '#64748b', fontSize: 16, marginTop: 0 }]}>Guest User</Text>
              <TouchableOpacity onPress={onLogout} style={{ marginTop: 8, backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }} activeOpacity={0.8}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Login / Register</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.userNameText}>{userName}</Text>
          )}
        </View>

        {/* Options List */}
        <View style={styles.menuContainer}>
          {menuOptions.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuRow}
              onPress={() => handleOptionPress(option.title)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                {renderIcon(option.iconKey)}
                <Text style={[styles.menuText, option.isLogout && styles.logoutText]}>
                  {option.title}
                </Text>
              </View>
              <Text style={[styles.chevronText, option.isLogout && { color: '#ef4444' }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 25,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  editIconGlyph: {
    color: '#ffffff',
    fontSize: 13,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 15,
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutText: {
    color: '#ef4444',
  },
  chevronText: {
    fontSize: 22,
    color: '#94a3b8',
    fontWeight: '600',
    marginRight: 4,
  },

  // Leading Custom Vector Styles
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 3,
  },
  body: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#3b82f6',
    marginTop: 1,
  },
  cardOutline: {
    width: 16,
    height: 11,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    justifyContent: 'flex-start',
  },
  cardStrip: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#3b82f6',
    marginTop: 2,
  },
  walletOutline: {
    width: 16,
    height: 12,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    position: 'relative',
  },
  walletFlap: {
    position: 'absolute',
    right: 0,
    top: 3,
    width: 5,
    height: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderTopLeftRadius: 1,
    borderBottomLeftRadius: 1,
  },
  calendarOutline: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 2,
    position: 'relative',
    alignItems: 'center',
  },
  calendarHeader: {
    width: '100%',
    height: 3,
    backgroundColor: '#3b82f6',
  },
  calendarGrid: {
    width: 6,
    height: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginTop: 2,
  },
  gearCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    position: 'relative',
  },
  gearTooth: {
    position: 'absolute',
    left: 2,
    top: -5,
    width: 1.5,
    height: 15,
    backgroundColor: '#3b82f6',
    zIndex: -1,
  },
  infoText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 15,
  },
  lockBody: {
    width: 12,
    height: 9,
    backgroundColor: '#3b82f6',
    borderRadius: 1.5,
    position: 'relative',
    marginTop: 4,
  },
  lockShackle: {
    position: 'absolute',
    top: -6,
    left: 2.5,
    width: 7,
    height: 7,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderTopLeftRadius: 3.5,
    borderTopRightRadius: 3.5,
  },
  logoutArrow: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#ef4444',
    transform: [{ rotate: '45deg' }],
    marginRight: -4,
  },
  logoutDoor: {
    width: 10,
    height: 12,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#ef4444',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
});
