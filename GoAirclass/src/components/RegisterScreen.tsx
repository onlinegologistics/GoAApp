import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../api';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onBackToLogin }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Run screen mount landing animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!emailId.trim()) {
      Alert.alert('Required Field', 'Please enter your Email.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required Field', 'Please enter a Password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Required Field', 'Password should have minimum 8 characters.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Agreement Required', 'Please agree to the Terms & Condition to proceed.');
      return;
    }
    setLoading(true);
    try {
      await authService.sendRegistrationOtp({
        fullName,
        email: emailId,
        mobileNumber: mobileNumber,
      });
      Alert.alert('OTP Sent', 'An OTP has been sent to your email ' + emailId);
      setIsOtpSent(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Required Field', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyRegistrationOtp({
        fullName,
        email: emailId,
        mobileNumber,
        otp,
        password,
      });
      Alert.alert('Success', 'Registration successful!');
      onRegisterSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'OTP verification failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header Back Button */}
            <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            {/* Screen Titles */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Create Account</Text>
              <Text style={styles.subTitle}>
                Fill your information below or register with your social account.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {!isOtpSent ? (
                <>
                  {/* Full Name Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="John Doe"
                      placeholderTextColor="#94a3b8"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="example@gmail.com"
                      placeholderTextColor="#94a3b8"
                      value={emailId}
                      onChangeText={setEmailId}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Mobile Number Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter 10 digit mobile number"
                      placeholderTextColor="#94a3b8"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="number-pad"
                      maxLength={10}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Create a Password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeIconBtn}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Terms Checkbox Row */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreeTerms(!agreeTerms)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                      {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Agree with <Text style={styles.linkText}>Terms & Condition</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Sign Up / Send OTP Action Button */}
                  <TouchableOpacity
                    style={styles.signUpBtn}
                    onPress={handleSignUp}
                    activeOpacity={0.9}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.signUpBtnText}>Continue / Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter OTP</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#94a3b8"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Verify OTP Button */}
                  <TouchableOpacity
                    style={styles.signUpBtn}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.9}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.signUpBtnText}>Verify OTP & Register</Text>
                    )}
                  </TouchableOpacity>

                  {/* Go back / Edit details */}
                  <TouchableOpacity
                    style={{ marginTop: 15, alignItems: 'center' }}
                    onPress={() => setIsOtpSent(false)}
                  >
                    <Text style={{ color: '#2563eb', fontSize: 14 }}>← Edit Details</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              {/* Apple Icon */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Image
                  source={{ uri: 'https://img.icons8.com/ios-filled/100/000000/mac-os.png' }}
                  style={styles.socialIconImage}
                />
              </TouchableOpacity>

              {/* Google Icon */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Image
                  source={{ uri: 'https://img.icons8.com/color/96/000000/google-logo.png' }}
                  style={styles.socialIconImage}
                />
              </TouchableOpacity>

              {/* Facebook Icon */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Image
                  source={{ uri: 'https://img.icons8.com/color/96/000000/facebook-new.png' }}
                  style={styles.socialIconImage}
                />
              </TouchableOpacity>
            </View>

            {/* Footer Bottom Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin} activeOpacity={0.7}>
                <Text style={styles.footerLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 26,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    fontFamily: FONT_FAMILY,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    fontFamily: FONT_FAMILY,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  eyeIconBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  linkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  signUpBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  signUpBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 16,
    fontFamily: FONT_FAMILY,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 36,
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialIconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  footerLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY,
  },
});
