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
} from 'react-native';

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
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

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

  const handleSignUp = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Name.');
      return;
    }
    if (!emailId.trim()) {
      Alert.alert('Required Field', 'Please enter your Email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required Field', 'Please enter a Password.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Agreement Required', 'Please agree to the Terms & Condition to proceed.');
      return;
    }
    onRegisterSuccess();
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
              
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
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

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="***************"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconBtn}
                    onPress={() => setSecureText(!secureText)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIcon}>{secureText ? '👁️' : '🙈'}</Text>
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

              {/* Sign Up Action Button */}
              <TouchableOpacity
                style={styles.signUpBtn}
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <Text style={styles.signUpBtnText}>Sign Up</Text>
              </TouchableOpacity>
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
