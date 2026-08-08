import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type BottomTabType = 'Home' | 'Bookings' | 'Offers' | 'Help' | 'My Account';

interface BottomTabNavigationProps {
  activeTab: BottomTabType;
  onChangeTab: (tab: BottomTabType) => void;
}

const ACTIVE_COLOR = '#c5221f'; // Red
const INACTIVE_COLOR = '#5f6368'; // Grey

// Custom vector drawing components for the new design
const HomeIcon = ({ active }: { active: boolean }) => {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.houseRoof, { borderBottomColor: color }]} />
      <View style={[styles.houseBody, { backgroundColor: color }]}>
        <View style={styles.houseDoor} />
      </View>
    </View>
  );
};

const BookingsIcon = ({ active }: { active: boolean }) => {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View style={styles.iconContainer}>
      {/* 3 bullet lists */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { borderColor: color }]} />
          <View style={[styles.bulletLine, { backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
};

const OffersIcon = ({ active }: { active: boolean }) => {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View style={styles.offersIconContainer}>
      {/* New green tag */}
      <View style={styles.newTag}>
        <Text style={styles.newTagText}>New</Text>
      </View>
      <View style={[styles.percentBadge, { borderColor: color }]}>
        <Text style={[styles.percentText, { color }]}>%</Text>
      </View>
    </View>
  );
};

const HelpIcon = ({ active }: { active: boolean }) => {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.speechBubble, { borderColor: color }]}>
        <Text style={[styles.questionText, { color }]}>?</Text>
        <View style={[styles.speechBubbleTail, { borderTopColor: color }]} />
      </View>
    </View>
  );
};

const MyAccountIcon = ({ active }: { active: boolean }) => {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.userOuterCircle, { borderColor: color }]}>
        <View style={[styles.userHeadCircle, { backgroundColor: color }]} />
        <View style={[styles.userBodyShoulders, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

export default function BottomTabNavigation({ activeTab, onChangeTab }: BottomTabNavigationProps) {
  const tabs: { name: BottomTabType; renderIcon: (active: boolean) => React.ReactNode }[] = [
    { name: 'Home', renderIcon: (active) => <HomeIcon active={active} /> },
    { name: 'Bookings', renderIcon: (active) => <BookingsIcon active={active} /> },
    { name: 'Offers', renderIcon: (active) => <OffersIcon active={active} /> },
    { name: 'Help', renderIcon: (active) => <HelpIcon active={active} /> },
    { name: 'My Account', renderIcon: (active) => <MyAccountIcon active={active} /> },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => onChangeTab(tab.name)}
            activeOpacity={0.7}
          >
            {tab.renderIcon(isActive)}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5f6368',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#c5221f',
    fontWeight: '700',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBody: {
    width: 13,
    height: 9,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  houseDoor: {
    width: 5,
    height: 5,
    backgroundColor: '#ffffff',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 16,
    height: 6,
    marginVertical: 0.5,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1.5,
    marginRight: 3,
  },
  bulletLine: {
    width: 9,
    height: 1.5,
    borderRadius: 0.75,
  },
  offersIconContainer: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  newTag: {
    position: 'absolute',
    top: -4,
    backgroundColor: '#137333', // Green banner
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    zIndex: 10,
  },
  newTagText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  percentBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: -1,
  },
  speechBubble: {
    width: 17,
    height: 15,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  questionText: {
    fontSize: 9,
    fontWeight: '800',
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  userOuterCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userHeadCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  userBodyShoulders: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginTop: 1,
  },
});
