import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from 'react-native';

const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

interface FilterScreenProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: string;
  setSelectedSort: (val: string) => void;
  selectedPrice: string;
  setSelectedPrice: (val: string) => void;
  selectedRating: string;
  setSelectedRating: (val: string) => void;
  selectedStars: string;
  setSelectedStars: (val: string) => void;
  onApply: () => void;
}

export default function FilterScreen({
  visible,
  onClose,
  selectedSort,
  setSelectedSort,
  selectedPrice,
  setSelectedPrice,
  selectedRating,
  setSelectedRating,
  selectedStars,
  setSelectedStars,
  onApply,
}: FilterScreenProps) {
  const [filterCategory, setFilterCategory] = useState<string>('Sort');

  const clearAllFilters = () => {
    setSelectedSort('popularity');
    setSelectedPrice('all');
    setSelectedRating('all');
    setSelectedStars('all');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.filterModalContainer}>
        {/* Header Row */}
        <View style={styles.filterModalHeader}>
          <Text style={styles.filterModalHeaderTitle}>Filter</Text>
          <TouchableOpacity 
            style={styles.filterModalCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.filterModalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Core Body Container (2 columns layout) */}
        <View style={styles.filterModalBody}>
          {/* Left Column Navigation Panel */}
          <View style={styles.leftNavPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'Sort', label: 'Sort' },
                { key: 'Price', label: 'Price' },
                { key: 'Customer Rating', label: 'Customer Rating' },
                { key: 'Star Rating', label: 'Star Rating' },
                { key: 'Deals', label: 'Deals' },
                { key: 'Meal Preference', label: 'Meal Preference' },
                { key: 'Amenities', label: 'Amenities' },
                { key: 'Room Amenities', label: 'Room Amenities' },
                { key: 'Property type', label: 'Property type' },
                { key: 'Hotel Chains', label: 'Hotel Chains' },
                { key: 'Hotel Policies', label: 'Hotel Policies' },
                { key: 'Location', label: 'Location' },
              ].map((item) => {
                const isActive = filterCategory === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.leftNavItem,
                      isActive && styles.leftNavItemActive
                    ]}
                    onPress={() => setFilterCategory(item.key)}
                    activeOpacity={0.8}
                  >
                    {isActive && <View style={styles.activeLeftIndicatorBar} />}
                    <Text style={[
                      styles.leftNavItemText,
                      isActive && styles.leftNavItemTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Column Options Settings panel */}
          <View style={styles.rightOptionsPanel}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rightOptionsScroll}>
              {filterCategory === 'Sort' && (
                <View>
                  {[
                    { id: 'popularity', label: 'popularity' },
                    { id: 'rating-high', label: 'Customer Rating: Highest First' },
                    { id: 'price-low', label: 'Price: Lowest first' },
                    { id: 'best-value', label: 'Lowest Price & Best Rated' },
                  ].map((opt) => {
                    const isSelected = selectedSort === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={styles.radioOptionRow}
                        onPress={() => setSelectedSort(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.radioLabel}>{opt.label}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioCenterDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {filterCategory === 'Price' && (
                <View>
                  {[
                    { id: 'all', label: 'All prices' },
                    { id: 'under-3k', label: 'Under ₹3,000' },
                    { id: 'under-5k', label: '₹3,000 - ₹5,000' },
                    { id: '5k-10k', label: '₹5,000 - ₹10,000' },
                    { id: 'above-10k', label: 'Above ₹10,000' },
                  ].map((opt) => {
                    const isSelected = selectedPrice === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={styles.radioOptionRow}
                        onPress={() => setSelectedPrice(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.radioLabel}>{opt.label}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioCenterDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {filterCategory === 'Customer Rating' && (
                <View>
                  {[
                    { id: 'all', label: 'Any Rating' },
                    { id: '4.5plus', label: 'Excellent: 4.5+' },
                    { id: '4plus', label: 'Very Good: 4.0+' },
                    { id: '3plus', label: 'Good: 3.0+' },
                  ].map((opt) => {
                    const isSelected = selectedRating === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={styles.radioOptionRow}
                        onPress={() => setSelectedRating(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.radioLabel}>{opt.label}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioCenterDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {filterCategory === 'Star Rating' && (
                <View>
                  {[
                    { id: 'all', label: 'All Star Ratings' },
                    { id: '5star', label: '5 Star properties' },
                    { id: '4star', label: '4 Star properties' },
                    { id: '3star', label: '3 Star properties' },
                  ].map((opt) => {
                    const isSelected = selectedStars === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={styles.radioOptionRow}
                        onPress={() => setSelectedStars(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.radioLabel}>{opt.label}</Text>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioCenterDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Placeholders for remaining categories */}
              {!['Sort', 'Price', 'Customer Rating', 'Star Rating'].includes(filterCategory) && (
                <View style={styles.placeholderColumnContent}>
                  <Text style={styles.placeholderEmoji}>🛎️</Text>
                  <Text style={styles.placeholderHeading}>Options list</Text>
                  <Text style={styles.placeholderSubText}>No active options are currently configured for {filterCategory}.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Footer Action buttons row */}
        <View style={styles.filterModalFooter}>
          <TouchableOpacity 
            style={styles.clearAllBtn}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllBtnText}>Clear all</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.applyBtn}
            onPress={onApply}
            activeOpacity={0.9}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterModalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  filterModalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalCloseText: {
    fontSize: 22,
    color: '#64748b',
    fontWeight: '600',
  },
  filterModalBody: {
    flex: 1,
    flexDirection: 'row',
  },
  leftNavPanel: {
    width: '40%',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  leftNavItem: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  leftNavItemActive: {
    backgroundColor: '#ffffff',
  },
  activeLeftIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0b2e66',
  },
  leftNavItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  leftNavItemTextActive: {
    color: '#0b2e66',
  },
  rightOptionsPanel: {
    width: '60%',
    backgroundColor: '#ffffff',
  },
  rightOptionsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginRight: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0b2e66',
  },
  radioCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0b2e66',
  },
  placeholderColumnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  placeholderSubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontFamily: FONT_FAMILY,
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  clearAllBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.2,
    borderColor: '#0f172a',
    borderRadius: 24,
  },
  clearAllBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  applyBtn: {
    backgroundColor: '#0b2e66',
    paddingVertical: 12,
    paddingHorizontal: 44,
    borderRadius: 24,
    flex: 1,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
});
