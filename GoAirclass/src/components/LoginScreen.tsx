import React, { useState, useEffect, useRef } from 'react';
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
  BackHandler,
  Platform,
  KeyboardAvoidingView,
  Image,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBackToOnboarding: () => void;
  onNavigateToRegister: () => void;
}

type AuthStep = 'login' | 'guestVerify' | 'otpVerify' | 'register' | 'registerOtp';

export default function LoginScreen({ onLoginSuccess, onBackToOnboarding, onNavigateToRegister }: LoginScreenProps) {
  const [step, setStep] = useState<AuthStep>('login');

  // Login States
  const [credentials, setCredentials] = useState('');

  // Guest Verification States
  const [mobileNumber, setMobileNumber] = useState('8767605792');
  const [otpCodes, setOtpCodes] = useState(['', '', '', '', '', '']);

  // Registration States
  const [fullName, setFullName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerOtpCodes, setRegisterOtpCodes] = useState(['', '', '', '', '', '']);

  const [timer, setTimer] = useState(295); // 4:55 = 295 seconds

  // Refs for OTP input navigation (Guest)
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Refs for OTP input navigation (Register)
  const registerOtpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  // Run screen mount landing animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle countdown timer for OTP screen
  useEffect(() => {
    let interval: any;
    if ((step === 'otpVerify' || step === 'registerOtp') && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Format timer seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Resend in ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (step === 'otpVerify') {
        setStep('guestVerify');
        return true;
      } else if (step === 'guestVerify') {
        setStep('login');
        return true;
      } else if (step === 'register') {
        setStep('login');
        return true;
      } else if (step === 'registerOtp') {
        setStep('register');
        return true;
      } else {
        onBackToOnboarding();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [step]);

  const handleLoginContinue = () => {
    if (!credentials.trim()) return;
    onLoginSuccess();
  };

  const handleSendOTP = () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid mobile number.');
      return;
    }
    setStep('otpVerify');
    setTimer(295); // Reset to 4:55
    setOtpCodes(['', '', '', '', '', '']);
  };

  const handleVerifyOTP = () => {
    const enteredOtp = otpCodes.join('');
    if (enteredOtp.length < 6) return;
    onLoginSuccess();
  };

  const handleRegisterGetOTP = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your Full Name.');
      return;
    }
    if (!emailId.trim()) {
      Alert.alert('Error', 'Please enter your Email Id.');
      return;
    }
    if (!registerMobile.trim() || registerMobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit Mobile Number.');
      return;
    }
    setStep('registerOtp');
    setTimer(295); // Reset to 4:55
    setRegisterOtpCodes(['', '', '', '', '', '']);
  };

  const handleVerifyRegisterOTP = () => {
    const enteredOtp = registerOtpCodes.join('');
    if (enteredOtp.length < 6) return;
    onLoginSuccess();
  };

  const handleOtpInput = (text: string, index: number, isRegister: boolean) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    if (isRegister) {
      const newOtp = [...registerOtpCodes];
      newOtp[index] = cleanText;
      setRegisterOtpCodes(newOtp);

      // Auto-focus next input
      if (cleanText && index < 5) {
        registerOtpRefs[index + 1].current?.focus();
      }
    } else {
      const newOtp = [...otpCodes];
      newOtp[index] = cleanText;
      setOtpCodes(newOtp);

      // Auto-focus next input
      if (cleanText && index < 5) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number, isRegister: boolean) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (isRegister) {
        if (!registerOtpCodes[index] && index > 0) {
          registerOtpRefs[index - 1].current?.focus();
        }
      } else {
        if (!otpCodes[index] && index > 0) {
          otpRefs[index - 1].current?.focus();
        }
      }
    }
  };

  const isLoginActive = credentials.trim().length > 0;
  const isOtpActive = otpCodes.join('').length === 6;
  const isRegisterActive = fullName.trim().length > 0 && emailId.trim().length > 0 && registerMobile.trim().length === 10;
  const isRegisterOtpActive = registerOtpCodes.join('').length === 6;
  const isFullPage = step === 'register' || step === 'registerOtp';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e6f4fc" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header/Top Container */}
          <View style={[styles.topContainer, isFullPage && styles.topContainerFull]}>
            {/* Top Background Travel Illustration Banner */}
            <Image
              source={require('../assets/login_banner.png')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {/* Navigation / Header Row */}
            <View style={styles.headerRow}>
              {step !== 'login' ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    if (step === 'registerOtp') setStep('register');
                    else if (step === 'register') setStep('login');
                    else if (step === 'otpVerify') setStep('guestVerify');
                    else setStep('login');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backArrow}>‹</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}

              <View style={styles.logoGroupPill}>
                <Text style={styles.logoTextMain}>GoAirClass</Text>
                <Text style={styles.logoSymbolDots}>⠵✈</Text>
              </View>

              <View style={styles.avatarPill}>
                <Text style={styles.avatarText}>6E</Text>
              </View>
            </View>
          </View>

          {/* Clean White Bottom Sheet */}
          <View style={[styles.bottomSheet, isFullPage && styles.bottomSheetFull]}>
            {step === 'login' && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Login or Sign up for GoAirClass!</Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Mobile No. / Email Id"
                  placeholderTextColor="#94a3b8"
                  value={credentials}
                  onChangeText={setCredentials}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.actionBtn, isLoginActive ? styles.actionBtnActive : styles.actionBtnDisabled]}
                  onPress={handleLoginContinue}
                  disabled={!isLoginActive}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.actionBtnText, isLoginActive ? styles.actionBtnTextActive : styles.actionBtnTextDisabled]}>
                    Continue
                  </Text>
                </TouchableOpacity>

                <View style={styles.registerLinkRow}>
                  <Text style={styles.orText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
                    <Text style={styles.registerTextLink}>Register Here</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.guestLinkRow}>
                  <Text style={styles.orText}>Or </Text>
                  <TouchableOpacity onPress={() => setStep('guestVerify')} activeOpacity={0.7}>
                    <Text style={styles.guestTextLink}>CONTINUE AS GUEST</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.policyText}>
                  By joining you agree to our <Text style={styles.underlineText}>Terms & Conditions</Text> and <Text style={styles.underlineText}>Privacy Policy</Text>.
                </Text>
              </View>
            )}

            {step === 'guestVerify' && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Verify to continue as guest</Text>
                <Text style={styles.sheetSubtitle}>We'll send you a one-time code to verify your identity</Text>

                <View style={styles.inputsRow}>
                  {/* Country Code Selection */}
                  <View style={styles.flagBox}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>

                  {/* Mobile Number Container */}
                  <View style={styles.mobileInputBox}>
                    <Text style={styles.inputBoxLabel}>Enter Mobile No.</Text>
                    <TextInput
                      style={styles.mobileNumberValue}
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnBlue]}
                  onPress={handleSendOTP}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextActive]}>
                    Send OTP
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'otpVerify' && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Enter OTP</Text>
                <Text style={styles.sheetSubtitle}>We've sent a 6-digit code to</Text>

                <View style={styles.phoneEditRow}>
                  <Text style={styles.targetPhoneText}>+91 {mobileNumber}</Text>
                  <TouchableOpacity onPress={() => setStep('guestVerify')} activeOpacity={0.7} style={styles.editIconBtn}>
                    <Text style={styles.editIconGlyph}>✏</Text>
                  </TouchableOpacity>
                </View>

                {/* OTP Grid (6 Inputs) */}
                <View style={styles.otpGrid}>
                  {otpCodes.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={otpRefs[index]}
                      style={styles.otpSlotInput}
                      value={digit}
                      onChangeText={(text) => handleOtpInput(text, index, false)}
                      onKeyPress={(e) => handleKeyPress(e, index, false)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, isOtpActive ? styles.actionBtnBlue : styles.actionBtnDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={!isOtpActive}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.actionBtnText, isOtpActive ? styles.actionBtnTextActive : styles.actionBtnTextDisabled]}>
                    Verify
                  </Text>
                </TouchableOpacity>

                <View style={styles.timerRow}>
                  <Text style={styles.timerLabel}>Didn't receive OTP?</Text>
                  <Text style={styles.timerCountdown}>{formatTimer(timer)}</Text>
                </View>
              </View>
            )}

            {/* Registration Screen state */}
            {step === 'register' && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Create your Account</Text>

                <TextInput
                  style={styles.textInputFull}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />

                <TextInput
                  style={styles.textInputFull}
                  placeholder="Email Id"
                  placeholderTextColor="#94a3b8"
                  value={emailId}
                  onChangeText={setEmailId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.inputsRowFull}>
                  <View style={styles.flagBoxFull}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <View style={styles.mobileInputBoxFull}>
                    <TextInput
                      style={styles.mobileNumberInputCompact}
                      placeholder="Enter Mobile No."
                      placeholderTextColor="#94a3b8"
                      value={registerMobile}
                      onChangeText={setRegisterMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, isRegisterActive ? styles.actionBtnBlue : styles.actionBtnDisabled, { marginTop: 10 }]}
                  onPress={handleRegisterGetOTP}
                  disabled={!isRegisterActive}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.actionBtnText, isRegisterActive ? styles.actionBtnTextActive : styles.actionBtnTextDisabled]}>
                    Get OTP
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Register OTP Verification Screen State */}
            {step === 'registerOtp' && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Verify Registration</Text>
                <Text style={styles.sheetSubtitle}>We've sent a 6-digit code to</Text>

                <View style={styles.phoneEditRow}>
                  <Text style={styles.targetPhoneText}>+91 {registerMobile}</Text>
                  <TouchableOpacity onPress={() => setStep('register')} activeOpacity={0.7} style={styles.editIconBtn}>
                    <Text style={styles.editIconGlyph}>✏</Text>
                  </TouchableOpacity>
                </View>

                {/* Registration OTP Grid */}
                <View style={styles.otpGrid}>
                  {registerOtpCodes.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={registerOtpRefs[index]}
                      style={styles.otpSlotInput}
                      value={digit}
                      onChangeText={(text) => handleOtpInput(text, index, true)}
                      onKeyPress={(e) => handleKeyPress(e, index, true)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, isRegisterOtpActive ? styles.actionBtnBlue : styles.actionBtnDisabled]}
                  onPress={handleVerifyRegisterOTP}
                  disabled={!isRegisterOtpActive}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.actionBtnText, isRegisterOtpActive ? styles.actionBtnTextActive : styles.actionBtnTextDisabled]}>
                    Register & Verify
                  </Text>
                </TouchableOpacity>

                <View style={styles.timerRow}>
                  <Text style={styles.timerLabel}>Didn't receive OTP?</Text>
                  <Text style={styles.timerCountdown}>{formatTimer(timer)}</Text>
                </View>
              </View>
            )}

          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f4fc',
  },
  topContainer: {
    flex: 1.8,
    backgroundColor: '#0284c7',
    paddingTop: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  topContainerFull: {
    flex: 0.5,
    paddingTop: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 38,
    color: '#ffffff',
    fontWeight: '300',
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logoGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  logoTextMain: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0b2e66',
    fontFamily: FONT_FAMILY,
  },
  logoSymbolDots: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: '#0b2e66',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  graphicArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logoImage: {
    width: SCREEN_WIDTH,
    height: '100%',
    marginBottom: 0,
  },
  logoImageCompact: {
    width: SCREEN_WIDTH,
    height: '100%',
    marginBottom: 0,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  bottomSheetFull: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingBottom: 28,
  },
  sheetContent: {
    width: '100%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -10,
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
  },
  textInputFull: {
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 16,
    fontFamily: FONT_FAMILY,
  },
  actionBtn: {
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionBtnActive: {
    backgroundColor: '#0b2e66',
  },
  actionBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  actionBtnBlue: {
    backgroundColor: '#0000cd',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  actionBtnTextActive: {
    color: '#ffffff',
  },
  actionBtnTextDisabled: {
    color: '#94a3b8',
  },
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  registerTextLink: {
    color: '#0b2e66',
    fontWeight: '800',
    fontSize: 13.5,
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY,
  },
  guestLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    marginTop: 6,
  },
  orText: {
    color: '#64748b',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY,
  },
  guestTextLink: {
    color: '#0b2e66',
    fontWeight: '800',
    fontSize: 13.5,
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY,
  },
  policyText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    fontFamily: FONT_FAMILY,
  },
  underlineText: {
    color: '#0f172a',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputsRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  flagBox: {
    width: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    marginRight: 12,
  },
  flagBoxFull: {
    width: '24%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    marginRight: 10,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  mobileInputBox: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  mobileInputBoxFull: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputBoxLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  mobileNumberValue: {
    fontSize: 14.5,
    color: '#0f172a',
    fontWeight: '800',
    padding: 0,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  mobileNumberInputCompact: {
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '800',
    padding: 0,
    fontFamily: FONT_FAMILY,
  },
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -8,
  },
  targetPhoneText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  editIconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  editIconGlyph: {
    fontSize: 13,
    color: '#0f172a',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpSlotInput: {
    width: '14%',
    height: 44,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: FONT_FAMILY,
    paddingVertical: 0,
  },
  timerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  timerCountdown: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
});
