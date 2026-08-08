import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  BackHandler,
  Platform,
} from 'react-native';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface PassengerDetailsProps {
  onBack: () => void;
  onNext?: () => void;
}

export default function PassengerDetails({ onBack, onNext }: PassengerDetailsProps) {
  // Form State
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('07/08/2001');
  const [email, setEmail] = useState('rahul@example.com');
  const [mobile, setMobile] = useState('9876543210');
  const [addGst, setAddGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showFareRules, setShowFareRules] = useState(false);

  // Dropdown selectors modal/states
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true; // Prevent default action (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Information', 'Please enter Passenger First Name and Last Name.');
      return;
    }
    if (!email.trim() || !mobile.trim()) {
      Alert.alert('Required Information', 'Please enter valid Email Address and Mobile Number.');
      return;
    }
    if (onNext) {
      onNext();
    } else {
      Alert.alert('Booking Progress', 'Proceeding to Seats & In-Flight Meals Selection...');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1120" />

      {/* Top Navigation Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.routeHeaderInfo}>
            <Text style={styles.headerRouteText}>DEL → PNQ</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 4 • Passenger Details</Text>
          </View>

          {/* Stepper Progress Badges */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Text style={styles.stepCircleTextCompleted}>✓</Text>
              </View>
              <Text style={styles.stepLabelActive}>Flight Select</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCurrent]}>
                <Text style={styles.stepCircleTextCurrent}>2</Text>
              </View>
              <Text style={styles.stepLabelCurrent}>Passenger Details</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Payment</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>4</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Flight Details Summary Card */}
        <View style={styles.card}>
          <View style={styles.flightCardHeader}>
            <View style={styles.airlineLogoBox}>
              <Text style={styles.airlineLogoText}>6E</Text>
            </View>
            <View style={styles.flightNumberGroup}>
              <Text style={styles.airlineName}>IndiGo • 6E-6437</Text>
              <View style={styles.nonstopTag}>
                <Text style={styles.nonstopTagText}>Non-stop</Text>
              </View>
            </View>
            <View style={styles.priceVerifiedBadge}>
              <Text style={styles.priceVerifiedText}>✓ PRICE VERIFIED</Text>
            </View>
          </View>

          <View style={styles.routeDetailsRow}>
            {/* Origin */}
            <View style={styles.originCol}>
              <Text style={styles.cityCodeText}>DEL</Text>
              <Text style={styles.airportNameText} numberOfLines={2}>
                Indira Gandhi Airport,{'\n'}New Delhi
              </Text>
              <Text style={styles.timeText}>11:55</Text>
              <Text style={styles.dateText}>09 Aug 2026</Text>
            </View>

            {/* Flight Path Graphic */}
            <View style={styles.durationCol}>
              <View style={styles.durationBadge}>
                <Text style={styles.clockIcon}>🕒</Text>
                <Text style={styles.durationText}>2h 5m</Text>
              </View>
              <View style={styles.pathLineContainer}>
                <View style={styles.pathDot} />
                <View style={styles.pathLine} />
                <View style={styles.pathDot} />
              </View>
              <Text style={styles.pathTagText}>Non-stop</Text>
            </View>

            {/* Destination */}
            <View style={styles.destCol}>
              <Text style={[styles.cityCodeText, { textAlign: 'right' }]}>PNQ</Text>
              <Text style={[styles.airportNameText, { textAlign: 'right' }]} numberOfLines={2}>
                Lohegaon, Pune
              </Text>
              <Text style={[styles.timeText, { textAlign: 'right' }]}>14:00</Text>
              <Text style={[styles.dateText, { textAlign: 'right' }]}>09 Aug 2026</Text>
            </View>
          </View>

          {/* Baggage Info Grid */}
          <View style={styles.baggageRow}>
            <View style={styles.baggageItem}>
              <Text style={styles.baggageIcon}>🧳</Text>
              <View>
                <Text style={styles.baggageTitle}>Cabin Baggage</Text>
                <Text style={styles.baggageValue}>7 KG</Text>
              </View>
            </View>
            <View style={styles.baggageDivider} />
            <View style={styles.baggageItem}>
              <Text style={styles.baggageIcon}>🧳</Text>
              <View>
                <Text style={styles.baggageTitle}>Check-in Baggage</Text>
                <Text style={styles.baggageValue}>15 KG</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fare Breakdown Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <View style={styles.blueIconBox}>
              <Text style={styles.blueIconText}>$</Text>
            </View>
            <Text style={styles.cardSectionTitle}>FARE BREAKDOWN</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Fare (Adult 1)</Text>
            <Text style={styles.breakdownValue}>₹1,028</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Taxes & Government Fees</Text>
            <Text style={styles.breakdownValue}>₹226</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>B2B Convenience Partner Fee</Text>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Seat & Meal Selection</Text>
            <Text style={styles.includedBadgeText}>INCLUDED</Text>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>₹1,254</Text>
          </View>

          <View style={styles.guaranteedFareRow}>
            <Text style={styles.greenCheckIcon}>✓</Text>
            <Text style={styles.guaranteedFareText}>Guaranteed Fare</Text>
          </View>
        </View>

        {/* Passenger Information Form Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <Text style={styles.sectionHeaderEmoji}>👤</Text>
            <Text style={styles.cardSectionTitle}>PASSENGER INFORMATION</Text>
          </View>

          <View style={styles.passengerSubHeader}>
            <Text style={styles.passengerIconSub}>👤</Text>
            <Text style={styles.passengerSubHeaderText}>ADULT 1 (ADULT)</Text>
          </View>

          <View style={styles.formRow}>
            {/* Title Selection */}
            <View style={styles.titleCol}>
              <Text style={styles.fieldLabel}>TITLE *</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowTitlePicker(!showTitlePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{title}</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </TouchableOpacity>
            </View>

            {/* First Name Input */}
            <View style={styles.firstNameCol}>
              <Text style={styles.fieldLabel}>FIRST NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Rahul"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Last Name Input */}
            <View style={styles.lastNameCol}>
              <Text style={styles.fieldLabel}>LAST NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Sharma"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Inline Dropdown for Title options */}
          {showTitlePicker && (
            <View style={styles.pickerOptionsContainer}>
              {['Mr', 'Mrs', 'Ms', 'Dr'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerOptionItem}
                  onPress={() => {
                    setTitle(item);
                    setShowTitlePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, title === item && styles.pickerOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.formRow}>
            {/* Gender Selection */}
            <View style={styles.genderCol}>
              <Text style={styles.fieldLabel}>GENDER *</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowGenderPicker(!showGenderPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{gender}</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </TouchableOpacity>
            </View>

            {/* DOB Input */}
            <View style={styles.dobCol}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH *</Text>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.calendarIcon}>📅</Text>
              </View>
            </View>
          </View>

          {/* Inline Dropdown for Gender options */}
          {showGenderPicker && (
            <View style={styles.pickerOptionsContainer}>
              {['Male', 'Female', 'Other'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerOptionItem}
                  onPress={() => {
                    setGender(item);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, gender === item && styles.pickerOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Contact Details Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionTitleRow}>
            <Text style={styles.sectionHeaderEmoji}>📞</Text>
            <Text style={styles.cardSectionTitle}>CONTACT DETAILS (FOR UPDATES & TICKETS)</Text>
          </View>

          <View style={styles.formRow}>
            {/* Email Address */}
            <View style={styles.emailCol}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
              <View style={styles.inputWithIconWrapper}>
                <Text style={styles.inputPrefixIcon}>✉</Text>
                <TextInput
                  style={styles.textInputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="rahul@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.mobileCol}>
              <Text style={styles.fieldLabel}>MOBILE NUMBER *</Text>
              <View style={styles.inputWithIconWrapper}>
                <Text style={styles.inputPrefixIcon}>📞</Text>
                <TextInput
                  style={styles.textInputWithIcon}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="9876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* GST Toggle Option */}
          <TouchableOpacity
            style={styles.gstCheckboxRow}
            onPress={() => setAddGst(!addGst)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkboxSquare, addGst && styles.checkboxSquareChecked]}>
              {addGst && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.gstCheckboxLabel}>
              Add GST Details (Optional for Business Travellers)
            </Text>
          </TouchableOpacity>

          {addGst && (
            <View style={styles.gstFormSection}>
              <View style={styles.gstFieldGroup}>
                <Text style={styles.fieldLabel}>GST NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  value={gstNumber}
                  onChangeText={setGstNumber}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                />
              </View>
              <View style={[styles.gstFieldGroup, { marginTop: 10 }]}>
                <Text style={styles.fieldLabel}>COMPANY NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Acme Corporation"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          )}
        </View>

        {/* Cancellation & Fare Rules Accordion */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowFareRules(!showFareRules)}
          activeOpacity={0.9}
        >
          <View style={styles.accordionHeaderRow}>
            <View style={styles.accordionLeftGroup}>
              <View style={styles.shieldIconBox}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <View>
                <Text style={styles.fareRulesTitle}>CANCELLATION & FARE RULES</Text>
                <Text style={styles.fareRulesSubtitle}>View rules and permitted changes</Text>
              </View>
            </View>
            <Text style={styles.accordionChevron}>{showFareRules ? '∧' : '∨'}</Text>
          </View>

          {showFareRules && (
            <View style={styles.fareRulesExpandedContent}>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Cancellation Fee starting from ₹4,899 per passenger.</Text>
              </View>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Date change fee starting from ₹2,999 + fare difference.</Text>
              </View>
              <View style={styles.ruleItemRow}>
                <Text style={styles.ruleDot}>•</Text>
                <Text style={styles.ruleText}>Name changes are not permitted after ticket issuance.</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Instant E-ticket Banner */}
        <View style={styles.eTicketBanner}>
          <View style={styles.eTicketIconBox}>
            <Text style={styles.eTicketIcon}>🎫</Text>
          </View>
          <View style={styles.eTicketTextCol}>
            <Text style={styles.eTicketTitle}>Instant Cleartrip E-ticket</Text>
            <Text style={styles.eTicketSubtitle}>
              Your PNR will be issued immediately upon payment confirmation.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.nextBtnText}>NEXT: SELECT SEATS & IN-FLIGHT MEALS</Text>
          <Text style={styles.nextBtnChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerContainer: {
    backgroundColor: '#0a1120',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  routeHeaderInfo: {
    flex: 1,
  },
  headerRouteText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepCircleTextCompleted: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  stepCurrent: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  stepCircleTextCurrent: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900',
  },
  stepCircleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLine: {
    width: 14,
    height: 2,
    backgroundColor: '#334155',
    marginHorizontal: 3,
  },
  stepLabel: {
    display: 'none',
  },
  stepLabelActive: {
    display: 'none',
  },
  stepLabelCurrent: {
    display: 'none',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 110,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Flight Card Styles
  flightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  airlineLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  airlineLogoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  flightNumberGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    marginRight: 8,
  },
  nonstopTag: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nonstopTagText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  priceVerifiedBadge: {
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceVerifiedText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },

  routeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  originCol: {
    flex: 1,
  },
  destCol: {
    flex: 1,
  },
  durationCol: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cityCodeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  airportNameText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    fontFamily: FONT_FAMILY,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pathLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    width: 80,
  },
  pathDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  pathLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
  },
  pathTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: FONT_FAMILY,
  },

  baggageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  baggageItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  baggageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  baggageTitle: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  baggageValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  baggageDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },

  // Fare Breakdown Card Styles
  cardSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  blueIconBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  blueIconText: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 12,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },
  includedBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },
  dashedDivider: {
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  guaranteedFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenCheckIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16a34a',
    marginRight: 6,
  },
  guaranteedFareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: FONT_FAMILY,
  },

  // Passenger Information Form Styles
  sectionHeaderEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  passengerSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  passengerIconSub: {
    fontSize: 14,
    marginRight: 8,
  },
  passengerSubHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  titleCol: {
    width: '16%',
    paddingHorizontal: 4,
  },
  firstNameCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  lastNameCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  genderCol: {
    width: '28%',
    paddingHorizontal: 4,
    marginTop: 12,
  },
  dobCol: {
    flex: 1,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  emailCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  mobileCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateInput: {
    paddingRight: 32,
  },
  calendarIcon: {
    position: 'absolute',
    right: 10,
    fontSize: 14,
  },

  pickerOptionsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerOptionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  pickerOptionTextSelected: {
    fontWeight: '800',
    color: '#2563eb',
  },

  // Contact Details Styles
  inputWithIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputPrefixIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  gstCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  checkboxSquareChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  gstCheckboxLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  gstFormSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gstFieldGroup: {
    marginBottom: 4,
  },

  // Fare Rules Styles
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shieldIcon: {
    fontSize: 14,
  },
  fareRulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  fareRulesSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  accordionChevron: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  fareRulesExpandedContent: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ruleItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  ruleDot: {
    fontSize: 12,
    color: '#d97706',
    marginRight: 8,
  },
  ruleText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },

  // Cleartrip E-ticket banner
  eTicketBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  eTicketIconBox: {
    marginRight: 12,
  },
  eTicketIcon: {
    fontSize: 22,
  },
  eTicketTextCol: {
    flex: 1,
  },
  eTicketTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: FONT_FAMILY,
  },
  eTicketSubtitle: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },

  // Footer Action Button
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  nextBtn: {
    backgroundColor: '#b45309', // Golden brown matching image button tone
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
    marginRight: 6,
  },
  nextBtnChevron: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
