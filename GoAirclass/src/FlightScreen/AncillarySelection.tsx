import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import flightService from '../api/flightService';

const FONT_FAMILY = 'Outfit-Regular';
const FONT_BOLD = 'Outfit-Bold';
const FONT_SEMI = 'Outfit-SemiBold';
const THEME_COLOR = '#0ea5e9';

interface AncillarySelectionProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedAncillaries: any) => void;
  flightPreviewId: string;
  subTravelOptions: any;
  searchIntent: string;
  sessionId?: string;
  fareId?: string;
}

const AncillarySelection: React.FC<AncillarySelectionProps> = ({
  visible,
  onClose,
  onConfirm,
  flightPreviewId,
  subTravelOptions,
  searchIntent,
  sessionId,
  fareId
}) => {
  const [loading, setLoading] = useState(true);
  const [ancillaryData, setAncillaryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'SEAT' | 'MEAL' | 'BAGGAGE'>('SEAT');
  
  // Multi-segment state for 1-stop / multi-leg flights
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [selectedSeatsMap, setSelectedSeatsMap] = useState<{ [segmentIndex: number]: any }>({});
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedBaggage, setSelectedBaggage] = useState<any>(null);

  // Parse flight segments list from subTravelOptions
  const getFlightSegments = () => {
    try {
      const subOptionIds = Object.keys(subTravelOptions || {});
      if (subOptionIds.length === 0) return [];
      const subTravelOption = subTravelOptions[subOptionIds[0]];
      if (!subTravelOption?.sequenceToFlightIdMap) return [];

      return Object.keys(subTravelOption.sequenceToFlightIdMap)
        .sort((a, b) => Number(a) - Number(b))
        .map((seq, idx) => {
          const flightId = subTravelOption.sequenceToFlightIdMap[seq];
          const parts = flightId.split('-');
          return {
            id: flightId,
            sequence: seq,
            index: idx,
            airlineCode: parts[0] || '6E',
            flightNumber: parts[1] || '',
            departureCode: parts[2] || 'DEP',
            arrivalCode: parts[3] || 'ARR'
          };
        });
    } catch (e) {
      return [];
    }
  };

  const segments = getFlightSegments();

  useEffect(() => {
    if (visible && flightPreviewId && subTravelOptions) {
      fetchAncillaries();
    }
  }, [visible, flightPreviewId, subTravelOptions, sessionId, fareId]);

  const fetchAncillaries = async () => {
    setLoading(true);
    try {
      // Build the payload
      const subOptionIds = Object.keys(subTravelOptions);
      if (subOptionIds.length === 0) throw new Error("No sub travel options found.");
      
      const subTravelOption = subTravelOptions[subOptionIds[0]];
      const flightsList = subTravelOption.sequenceToFlightIdMap
        ? Object.keys(subTravelOption.sequenceToFlightIdMap).sort().map(seq => {
            const flightId = subTravelOption.sequenceToFlightIdMap[seq];
            const parts = flightId.split('-');
            const departureCode = parts[2] || '';
            const arrivalCode = parts[3] || '';
            return {
              id: flightId,
              departureCode,
              arrivalCode
            };
          })
        : [];

      const payload = {
        sessionId: sessionId || '',
        flightPreviewId,
        travelOptions: [
          {
            subTravelOptions: [
              {
                id: subOptionIds[0],
                fareId: fareId || subTravelOption.fareId || "",
                flights: flightsList
              }
            ],
            id: subOptionIds[0],
            searchIntent: searchIntent || 'BLR_BOM'
          }
        ],
        ancillaryTypes: ["SEAT", "MEAL", "BAGGAGE"]
      };

      console.log('Fetching ancillaries with payload:', JSON.stringify(payload, null, 2));
      const response = await flightService.fetchAncillaries(payload);
      console.log('Ancillaries response:', response);
      setAncillaryData(response);
    } catch (error: any) {
      console.error('Error fetching ancillaries:', error.response?.data || error.message);
      Alert.alert('Notice', 'Unable to fetch ancillaries at this time.');
    } finally {
      setLoading(false);
    }
  };

  const renderSegmentTabs = () => {
    if (segments.length <= 1) return null;

    return (
      <View style={styles.segmentContainer}>
        <Text style={styles.segmentHeaderLabel}>Select Flight Leg:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
          {segments.map((seg, idx) => {
            const isSelected = activeSegmentIndex === idx;
            const chosenSeat = selectedSeatsMap[idx];

            return (
              <TouchableOpacity
                key={seg.id}
                style={[styles.segmentChip, isSelected && styles.segmentChipActive]}
                onPress={() => setActiveSegmentIndex(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentChipText, isSelected && styles.segmentChipTextActive]}>
                  Leg {idx + 1}: {seg.departureCode} → {seg.arrivalCode}
                </Text>
                {chosenSeat && (
                  <View style={styles.seatBadgeMini}>
                    <Text style={styles.seatBadgeMiniText}>Seat {chosenSeat.number}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['SEAT', 'MEAL', 'BAGGAGE'].map((tab) => (
        <TouchableOpacity 
          key={tab} 
          style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
          onPress={() => setActiveTab(tab as any)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'SEAT' ? 'Seats' : tab === 'MEAL' ? 'Meals' : 'Baggage'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getTabIcon = () => {
    switch(activeTab) {
      case 'SEAT': return '💺';
      case 'MEAL': return '🍲';
      case 'BAGGAGE': return '🧳';
      default: return '✈️';
    }
  };

  // Helper to extract Seats array 100% from API response
  const extractSeats = (): any[] => {
    try {
      const dataObj = ancillaryData?.data || ancillaryData || {};
      const travelOpts = dataObj.travelOptions || [];
      const subOpts = travelOpts[0]?.subTravelOptions || [];
      const flights = subOpts[0]?.flights || [];
      const ancillaries = flights[0]?.ancillaries || [];

      const seatAncillary = ancillaries.find((a: any) => a.type === 'SEAT');
      if (!seatAncillary) return [];

      const seats: any[] = [];
      const decks = seatAncillary.decks || [];
      decks.forEach((deck: any) => {
        (deck.cabins || []).forEach((cabin: any) => {
          (cabin.compartments || []).forEach((comp: any) => {
            (comp.rows || []).forEach((row: any) => {
              (row.seats || []).forEach((seat: any) => {
                seats.push({
                  number: seat.number,
                  price: seat.amount?.price || 0,
                  free: seat.free || seat.amount?.price === 0,
                  available: seat.availability !== false,
                  characteristics: seat.characteristics || [],
                  rowId: seat.rowId || parseInt(seat.number) || 1,
                  columnId: seat.columnId || seat.number.slice(-1)
                });
              });
            });
          });
        });
      });

      return seats;
    } catch (e) {
      return [];
    }
  };

  // Helper to extract Baggage array 100% from API response
  const extractBaggage = (): any[] => {
    try {
      const dataObj = ancillaryData?.data || ancillaryData || {};
      const travelOpts = dataObj.travelOptions || [];
      const subOpts = travelOpts[0]?.subTravelOptions || [];
      const ancillaries = subOpts[0]?.ancillaries || travelOpts[0]?.ancillaries || [];

      const baggageAncillary = ancillaries.find((a: any) => a.type === 'BAGGAGE');
      if (baggageAncillary?.baggageList?.length > 0) {
        return baggageAncillary.baggageList.map((b: any) => ({
          id: b.id || b.code,
          price: b.amount?.price || 0,
          quantity: b.baggageInfos?.[0]?.weight?.quantity || 0,
          unit: b.baggageInfos?.[0]?.weight?.unit || 'KG',
          description: b.description || 'Excess Baggage'
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  // Helper to extract Meals array 100% from API response
  const extractMeals = (): any[] => {
    try {
      const dataObj = ancillaryData?.data || ancillaryData || {};
      const travelOpts = dataObj.travelOptions || [];
      const subOpts = travelOpts[0]?.subTravelOptions || [];
      const ancillaries = subOpts[0]?.ancillaries || travelOpts[0]?.ancillaries || [];

      const mealAncillary = ancillaries.find((a: any) => a.type === 'MEAL');
      if (mealAncillary?.mealList?.length > 0) {
        return mealAncillary.mealList.map((m: any) => ({
          id: m.id || m.code,
          name: m.description || m.title || m.name || 'In-flight Meal',
          type: (m.isVeg || m.type === 'VEG') ? 'VEG' : 'NON_VEG',
          price: m.amount?.price || 0
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const renderSeatsView = () => {
    const seats = extractSeats();
    const currentSegment = segments[activeSegmentIndex] || segments[0];
    const currentSelectedSeat = selectedSeatsMap[activeSegmentIndex];

    // Group seats by rowId
    const rowMap: { [rowId: number]: { [colId: string]: any } } = {};
    seats.forEach((seat: any) => {
      const r = seat.rowId || parseInt(seat.number) || 1;
      const c = seat.columnId || seat.number.slice(-1);
      if (!rowMap[r]) rowMap[r] = {};
      rowMap[r][c] = seat;
    });

    const sortedRowIds = Object.keys(rowMap).map(Number).sort((a, b) => a - b);

    return (
      <View style={styles.seatContainer}>
        {/* Active Segment Title */}
        {currentSegment && (
          <View style={styles.segmentBanner}>
            <Text style={styles.segmentBannerText}>
              Leg {activeSegmentIndex + 1}: {currentSegment.departureCode} → {currentSegment.arrivalCode} ({currentSegment.airlineCode}-{currentSegment.flightNumber})
            </Text>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendLabel}>Free</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendLabel}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#d97706' }]} />
            <Text style={styles.legendLabel}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#cbd5e1' }]} />
            <Text style={styles.legendLabel}>Occupied</Text>
          </View>
        </View>

        {/* Airplane Fuselage Shell */}
        <View style={styles.fuselage}>
          {/* Cockpit Front Indicator */}
          <View style={styles.cockpitBox}>
            <Text style={styles.cockpitText}>✈️ FRONT OF AIRCRAFT</Text>
          </View>

          {/* Seat Column Headers */}
          <View style={styles.colHeaderRow}>
            <View style={styles.colGroup}>
              <Text style={styles.colLabel}>A</Text>
              <Text style={styles.colLabel}>B</Text>
              <Text style={styles.colLabel}>C</Text>
            </View>
            <Text style={styles.aisleHeader}>AISLE</Text>
            <View style={styles.colGroup}>
              <Text style={styles.colLabel}>D</Text>
              <Text style={styles.colLabel}>E</Text>
              <Text style={styles.colLabel}>F</Text>
            </View>
          </View>

          {/* Rows */}
          {sortedRowIds.map((rowId) => {
            const rowSeats = rowMap[rowId] || {};
            const leftCols = ['A', 'B', 'C'];
            const rightCols = ['D', 'E', 'F'];
            const isExitRow = rowId === 5;

            return (
              <View key={rowId}>
                {isExitRow && (
                  <View style={styles.exitRowBanner}>
                    <Text style={styles.exitRowText}>⚡ EMERGENCY EXIT ROW (EXTRA LEGROOM)</Text>
                  </View>
                )}
                <View style={styles.aircraftRow}>
                  {/* Left Side (A, B, C) */}
                  <View style={styles.seatTrio}>
                    {leftCols.map((col) => {
                      const seat = rowSeats[col];
                      if (!seat) return <View key={col} style={styles.seatSpacer} />;
                      
                      const isSelected = currentSelectedSeat?.number === seat.number;
                      const isOccupied = !seat.available;

                      return (
                        <TouchableOpacity
                          key={seat.number}
                          disabled={isOccupied}
                          style={[
                            styles.airplaneSeat,
                            seat.free ? styles.seatFree : styles.seatPaid,
                            isOccupied && styles.seatOccupied,
                            isSelected && styles.seatSelected
                          ]}
                          onPress={() => {
                            setSelectedSeatsMap(prev => ({
                              ...prev,
                              [activeSegmentIndex]: isSelected ? null : seat
                            }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.seatNumText, isSelected && styles.textWhite, isOccupied && styles.textOccupied]}>
                            {seat.number}
                          </Text>
                          <Text style={[styles.seatPriceBadge, isSelected && styles.textWhite, isOccupied && styles.textOccupied]}>
                            {isOccupied ? '✕' : seat.free ? 'FREE' : `₹${seat.price}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Row Number in Aisle */}
                  <View style={styles.aisleBox}>
                    <Text style={styles.rowNumberLabel}>{rowId}</Text>
                  </View>

                  {/* Right Side (D, E, F) */}
                  <View style={styles.seatTrio}>
                    {rightCols.map((col) => {
                      const seat = rowSeats[col];
                      if (!seat) return <View key={col} style={styles.seatSpacer} />;

                      const isSelected = currentSelectedSeat?.number === seat.number;
                      const isOccupied = !seat.available;

                      return (
                        <TouchableOpacity
                          key={seat.number}
                          disabled={isOccupied}
                          style={[
                            styles.airplaneSeat,
                            seat.free ? styles.seatFree : styles.seatPaid,
                            isOccupied && styles.seatOccupied,
                            isSelected && styles.seatSelected
                          ]}
                          onPress={() => {
                            setSelectedSeatsMap(prev => ({
                              ...prev,
                              [activeSegmentIndex]: isSelected ? null : seat
                            }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.seatNumText, isSelected && styles.textWhite, isOccupied && styles.textOccupied]}>
                            {seat.number}
                          </Text>
                          <Text style={[styles.seatPriceBadge, isSelected && styles.textWhite, isOccupied && styles.textOccupied]}>
                            {isOccupied ? '✕' : seat.free ? 'FREE' : `₹${seat.price}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMealsView = () => {
    const meals = extractMeals();
    return (
      <View>
        <Text style={styles.sectionSubtitle}>Pre-book fresh in-flight meals</Text>
        {meals.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
              No pre-book meal options returned from airline for this flight.
            </Text>
          </View>
        ) : (
          meals.map((meal: any) => {
            const isSelected = selectedMeal?.id === meal.id;
            return (
              <View key={meal.id} style={[styles.cardItem, isSelected && styles.cardSelected]}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeaderRow}>
                    <View style={meal.type === 'VEG' ? styles.badgeVeg : styles.badgeNonVeg}>
                      <View style={[styles.badgeDot, meal.type === 'VEG' ? styles.dotVeg : styles.dotNonVeg]} />
                    </View>
                    <Text style={styles.cardTitle}>{meal.name}</Text>
                  </View>
                  <Text style={styles.cardPrice}>₹{meal.price.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, isSelected && styles.addBtnSelected]}
                  onPress={() => setSelectedMeal(isSelected ? null : meal)}
                >
                  <Text style={[styles.addBtnText, isSelected && styles.addBtnTextSelected]}>
                    {isSelected ? 'ADDED ✓' : 'ADD +'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    );
  };

  const renderBaggageView = () => {
    const baggage = extractBaggage();
    return (
      <View>
        <Text style={styles.sectionSubtitle}>Purchase extra check-in baggage allowance</Text>
        {baggage.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
              No additional baggage purchase options returned from airline for this flight.
            </Text>
          </View>
        ) : (
          baggage.map((bag: any) => {
            const isSelected = selectedBaggage?.id === bag.id;
            return (
              <View key={bag.id} style={[styles.cardItem, isSelected && styles.cardSelected]}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>+{bag.quantity} {bag.unit}</Text>
                  <Text style={styles.cardDesc}>{bag.description}</Text>
                  <Text style={styles.cardPrice}>₹{bag.price.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, isSelected && styles.addBtnSelected]}
                  onPress={() => setSelectedBaggage(isSelected ? null : bag)}
                >
                  <Text style={[styles.addBtnText, isSelected && styles.addBtnTextSelected]}>
                    {isSelected ? 'ADDED ✓' : 'ADD +'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    );
  };

  const calculateTotalPrice = () => {
    let total = 0;
    Object.values(selectedSeatsMap).forEach((seat: any) => {
      if (seat?.price) total += seat.price;
    });
    if (selectedMeal?.price) total += selectedMeal.price;
    if (selectedBaggage?.price) total += selectedBaggage.price;
    return total;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading {activeTab.toLowerCase()}s...</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'SEAT' && renderSeatsView()}
        {activeTab === 'MEAL' && renderMealsView()}
        {activeTab === 'BAGGAGE' && renderBaggageView()}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add-ons & Seats</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderTabs()}
        {activeTab === 'SEAT' && renderSegmentTabs()}

        {renderContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.totalLabel}>Total Add-ons:</Text>
            <Text style={styles.totalValue}>₹{calculateTotalPrice().toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.confirmBtn} 
            onPress={() => onConfirm({ selectedSeatsMap, selectedMeal, selectedBaggage, totalAddonPrice: calculateTotalPrice() })}
          >
            <Text style={styles.confirmBtnText}>Confirm & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#0f172a', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontFamily: FONT_BOLD, color: '#0f172a' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: THEME_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONT_SEMI,
    color: '#64748b'
  },
  tabTextActive: {
    color: THEME_COLOR,
    fontWeight: 'bold'
  },
  segmentContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  segmentHeaderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  segmentScroll: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  segmentChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9'
  },
  segmentChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569'
  },
  segmentChipTextActive: {
    color: '#ffffff'
  },
  seatBadgeMini: {
    backgroundColor: '#d97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  seatBadgeMiniText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  segmentBanner: {
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center'
  },
  segmentBannerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FONT_FAMILY,
    color: '#64748b'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    color: '#64748b',
    marginBottom: 14
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendLabel: { fontSize: 12, color: '#475569', fontFamily: FONT_FAMILY },
  seatContainer: {
    paddingBottom: 20
  },
  fuselage: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  cockpitBox: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 16
  },
  cockpitText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8
  },
  colGroup: {
    flexDirection: 'row',
    width: '42%',
    justifyContent: 'space-around'
  },
  colLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b'
  },
  aisleHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5
  },
  aisleBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowNumberLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  exitRowBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  exitRowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309'
  },
  aircraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4
  },
  seatTrio: {
    flexDirection: 'row',
    width: '42%',
    justifyContent: 'space-between'
  },
  seatSpacer: {
    width: 36,
    height: 44
  },
  airplaneSeat: {
    width: 36,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2
  },
  seatOccupied: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  seatFree: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  seatPaid: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  seatSelected: { borderColor: '#d97706', backgroundColor: '#d97706' },
  seatNumText: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  seatPriceBadge: { fontSize: 8, fontWeight: '700', color: '#475569', marginTop: 1 },
  textOccupied: { color: '#94a3b8' },
  textWhite: { color: '#ffffff' },

  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardSelected: {
    borderColor: THEME_COLOR,
    backgroundColor: '#f0f9ff'
  },
  cardInfo: { flex: 1, marginRight: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  cardDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: '#0ea5e9', marginTop: 4 },

  badgeVeg: { borderColor: '#16a34a', borderWidth: 1, padding: 2, marginRight: 8, borderRadius: 3 },
  badgeNonVeg: { borderColor: '#dc2626', borderWidth: 1, padding: 2, marginRight: 8, borderRadius: 3 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  dotVeg: { backgroundColor: '#16a34a' },
  dotNonVeg: { backgroundColor: '#dc2626' },

  addBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  addBtnSelected: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR
  },
  addBtnText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  addBtnTextSelected: { color: '#ffffff' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerSummary: { flexDirection: 'column' },
  totalLabel: { fontSize: 12, color: '#64748b', fontFamily: FONT_FAMILY },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  confirmBtn: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default AncillarySelection;
