import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Image,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

export interface FlightSegmentDetail {
  index: number;
  airlineName: string;
  airlineCode?: string;
  logoUrl?: string;
  flightCode: string;
  depCode: string;
  arrCode: string;
  depCity: string;
  arrCity: string;
  depAirport: string;
  arrAirport: string;
  depTerminal?: string;
  arrTerminal?: string;
  depTime: string;
  arrTime: string;
  depDate: string;
  arrDate: string;
  duration: string;
  layoverText?: string;
  layoverDurationText?: string;
  isReturn?: boolean;
}

interface FlightDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  segmentsList: FlightSegmentDetail[];
  airlineName?: string;
  airlineCode?: string;
  airlineLogoUrl?: string;
  originCity: string;
  destCity: string;
  headerDate: string;
  originCode: string;
  destCode: string;
  totalDuration: string;
  stopsText: string;
  logoBg?: string;
  logoChar?: string;
  passengerCount?: number;
  cabinClass?: string;
  isRoundTrip?: boolean;
}

export default function FlightDetailsModal({
  visible,
  onClose,
  segmentsList,
  airlineName = 'Airline',
  airlineCode,
  airlineLogoUrl,
  originCity,
  destCity,
  headerDate,
  originCode,
  destCode,
  totalDuration,
  stopsText,
  logoBg = '#0f172a',
  logoChar = '✈️',
  passengerCount = 1,
  cabinClass = 'ECONOMY',
  isRoundTrip = false,
}: FlightDetailsModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 12,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, bgAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: bgAnim }]}>
          <TouchableOpacity style={styles.backdropClickable} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        {/* Sliding Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
        {/* Top Handle */}
        <View style={styles.dragHandle} />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.routeHeaderTitle}>
              {originCity} to {destCity}
            </Text>
            <Text style={styles.routeHeaderSubtitle}>
              {headerDate} • 👤 {passengerCount} • {cabinClass}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.greyCardContainer}>
            <View style={styles.flightSummaryRow}>
              {isRoundTrip ? (
                <View style={styles.logoCol}>
                  <Text style={{ fontSize: 24, textAlign: 'center' }}>✈️</Text>
                  <Text style={styles.logoSubtext}>Round Trip</Text>
                </View>
              ) : (
                <View style={styles.logoCol}>
                  <Image
                    source={{ uri: airlineLogoUrl || `https://images.kiwi.com/airlines/64/${(airlineCode || '6E').trim().toUpperCase()}.png` }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.logoSubtext}>{airlineName}</Text>
                </View>
              )}
              <View style={styles.summaryTextCol}>
                <Text style={styles.summaryDateText}>{headerDate}</Text>
                <Text style={styles.summaryRouteText}>
                  {originCode} - {destCode} • {totalDuration} ({stopsText})
                </Text>
              </View>
            </View>

            {/* Vertical Timeline Nodes */}
            {segmentsList.map((seg: any, idx) => {
              const showOutboundLabel = idx === 0 && seg.isReturn === false;
              const showReturnLabel = seg.isReturn === true && (idx === 0 || segmentsList[idx - 1]?.isReturn === false);

              return (
                <View key={idx}>
                  {showOutboundLabel && (
                    <View style={styles.directionSectionHeader}>
                      <Text style={styles.directionSectionText}>🛫 OUTBOUND JOURNEY (जाने वाली फ्लाइट)</Text>
                    </View>
                  )}
                  {showReturnLabel && (
                    <View style={[styles.directionSectionHeader, { marginTop: idx === 0 ? 0 : 28 }]}>
                      <Text style={styles.directionSectionText}>🛬 RETURN JOURNEY (वापसी की फ्लाइट)</Text>
                    </View>
                  )}
                {/* Departure Node */}
                <View style={styles.nodeRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.istLabel}>IST</Text>
                    <Text style={styles.nodeTimeText}>{seg.depTime}</Text>
                  </View>

                  <View style={styles.graphicCol}>
                    <View style={styles.dotMarker} />
                    <View style={styles.vertLine} />
                  </View>

                  <View style={styles.stationCol}>
                    <Text style={styles.cityTitleText}>
                      {seg.depCity} ({seg.depCode})
                    </Text>
                    <Text style={styles.airportSubtitleText}>
                      {seg.depAirport}{seg.depTerminal ? `, Terminal ${seg.depTerminal}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Flight Leg Info Row */}
                <View style={styles.legRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.durationLabelText}>{seg.duration}</Text>
                  </View>

                  <View style={styles.graphicCol}>
                    <View style={styles.vertLine} />
                    <Text style={styles.planeIconText}>✈️</Text>
                    <View style={styles.vertLine} />
                  </View>

                  <View style={styles.stationCol}>
                    <View style={styles.airlineBadge}>
                      <Image
                        source={{ uri: seg.logoUrl || `https://images.kiwi.com/airlines/64/${(seg.airlineCode || airlineCode || '6E').trim().toUpperCase()}.png` }}
                        style={styles.miniLogoImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.airlineBadgeText}>
                        {seg.airlineName} • {seg.flightCode}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Arrival Node */}
                <View style={styles.nodeRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.istLabel}>IST</Text>
                    <Text style={styles.nodeTimeText}>{seg.arrTime}</Text>
                  </View>

                  <View style={styles.graphicCol}>
                    <View style={styles.dotMarker} />
                    {idx < segmentsList.length - 1 && <View style={styles.vertLine} />}
                  </View>

                  <View style={styles.stationCol}>
                    <Text style={styles.cityTitleText}>
                      {seg.arrCity} ({seg.arrCode})
                    </Text>
                    <Text style={styles.airportSubtitleText}>
                      {seg.arrAirport}{seg.arrTerminal ? `, Terminal ${seg.arrTerminal}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Layover Notice Box */}
                {!!seg.layoverDurationText && (
                  <View style={styles.layoverBox}>
                    <Text style={styles.layoverTimeText}>{seg.layoverDurationText}</Text>
                    <View>
                      <Text style={styles.layoverTitleText}>
                        Layover in {seg.arrCity} ({seg.arrCode})
                      </Text>
                      <Text style={styles.changePlanesText}>Change of planes</Text>
                    </View>
                  </View>
                )}
              </View>
            ); })}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  backdropClickable: {
    flex: 1,
  },
  sheetContainer: {
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 25,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleCol: {
    flex: 1,
  },
  routeHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  routeHeaderSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginLeft: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  greyCardContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  flightSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  miniLogoImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  logoSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryRouteText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  timeCol: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  istLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  nodeTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  graphicCol: {
    width: 20,
    alignItems: 'center',
  },
  dotMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
    marginTop: 4,
  },
  vertLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 2,
  },
  stationCol: {
    flex: 1,
    paddingLeft: 6,
  },
  cityTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  airportSubtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  durationLabelText: {
    fontSize: 11,
    color: '#64748b',
  },
  planeIconText: {
    fontSize: 10,
    color: '#64748b',
    marginVertical: 2,
  },
  airlineBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniLogoText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  airlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  layoverBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    marginLeft: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoverTimeText: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 10,
    width: 45,
    textAlign: 'right',
  },
  layoverTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  changePlanesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2,
  },
  directionSectionHeader: {
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'stretch',
  },
  directionSectionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
});
