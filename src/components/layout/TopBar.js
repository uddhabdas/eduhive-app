import React from 'react';
import { View, Pressable, Image, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../../store/CartContext';
import { useTheme, useThemeMode } from '../../theme/ThemeProvider';

export default function TopBar({ onSearch, onProfile, onCart }) {
  const { items } = useCart?.() || { items: [] };
  const { effective } = useThemeMode();
  const { colors, spacing, radii } = useTheme();
  const count = Array.isArray(items) ? items.length : 0;
  const iconColor = effective === 'dark' ? colors.textPrimary : colors.textPrimary;
  return (
    <View style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minHeight: 52 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../../../assets/images/logo.jpg')} style={{ width: spacing.xxl * 2, height: spacing.xxl * 2, borderRadius: radii.md }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable style={{ paddingHorizontal: spacing.xs }} accessibilityLabel="Search" onPress={onSearch}>
            <MaterialCommunityIcons name="magnify" size={26} color={iconColor} />
          </Pressable>
          <Pressable style={{ paddingHorizontal: spacing.xs }} accessibilityLabel="Cart" onPress={onCart}>
            <View>
              <MaterialCommunityIcons name="cart-outline" size={24} color={iconColor} />
              {count > 0 && (
                <View style={{ position: 'absolute', right: -6, top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.onBrand, fontSize: 12, fontWeight: '700' }}>{count}</Text>
                </View>
              )}
            </View>
          </Pressable>
          <Pressable style={{ paddingHorizontal: spacing.xs }} accessibilityLabel="Profile" onPress={onProfile}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={iconColor} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}