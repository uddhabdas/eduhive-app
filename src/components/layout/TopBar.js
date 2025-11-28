import React from 'react';
import { View, Pressable, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '../atoms/AppText';
import { useCart } from '../../store/CartContext';
import { useTheme, useThemeMode } from '../../theme/ThemeProvider';

const defaultTitles = {
  search: 'Search',
  learning: 'My Learning',
  account: 'Account',
  inner: '',
  featured: '',
};

const defaultCartByVariant = {
  featured: true,
  search: false,
  learning: false,
  account: false,
  inner: false,
};

export default function TopBar({
  variant = 'featured',
  title,
  showCart,
  onBack,
  onCartPress,
  onCart,
  onSearchPress,
  onProfilePress,
}) {
  const { items } = useCart?.() || { items: [] };
  const { effective } = useThemeMode();
  const { colors, spacing, radii } = useTheme();
  const cartCount = Array.isArray(items) ? items.length : 0;
  const iconColor = effective === 'dark' ? colors.onSurface ?? colors.textPrimary : colors.textPrimary;
  const resolvedTitle = title ?? defaultTitles[variant] ?? '';
  const handleCartPress = typeof onCart === 'function' ? onCart : onCartPress;
  const resolvedShowCart = !!handleCartPress;

  const renderLogo = () => (
    <Image
      source={require('../../../assets/images/logo.jpg')}
      style={{ width: spacing.xxl * 2, height: spacing.xxl * 2, borderRadius: radii.md }}
      accessibilityLabel="EduHive"
    />
  );

  const renderBackButton = () => (
    <Pressable
      style={{ padding: spacing.xs, borderRadius: radii.full || 999 }}
      accessibilityLabel="Back"
      onPress={onBack}
      disabled={!onBack}
    >
      <MaterialCommunityIcons name="arrow-left" size={26} color={iconColor} />
    </Pressable>
  );

  const renderCartButton = () => {
    if (!resolvedShowCart) return null;
    return (
      <Pressable
        style={{ padding: 12, borderRadius: radii.full || 999 }}
        accessibilityLabel="Cart"
        onPress={handleCartPress}
        disabled={!handleCartPress}
      >
        <View>
          <MaterialCommunityIcons name="cart-outline" size={24} color={iconColor} />
          {cartCount > 0 && (
            <View
              style={{
                position: 'absolute',
                right: -6,
                top: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <AppText variant="caption" style={{ color: colors.onBrand, fontSize: 11, fontWeight: '700' }}>
                {cartCount}
              </AppText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSearchButton = () => {
    if (!onSearchPress) return null;
    return (
      <Pressable
        style={{ padding: 12, borderRadius: radii.full || 999 }}
        accessibilityLabel="Search"
        onPress={onSearchPress}
      >
        <MaterialCommunityIcons name="magnify" size={24} color={iconColor} />
      </Pressable>
    );
  };

  const renderProfileButton = () => null;

  const renderRightContent = () => {
    switch (variant) {
      case 'featured':
        return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{renderSearchButton()}{renderCartButton()}</View>;
      case 'inner':
      case 'learning':
        return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{renderCartButton()}</View>;
      case 'search':
        return <View style={{ width: spacing.lg }} />;
      default:
        return <View style={{ width: spacing.lg }} />;
    }
  };

  const renderLeftContent = () => {
    switch (variant) {
      case 'featured':
        return renderLogo();
      case 'account':
        return <View style={{ width: spacing.lg }} />;
      case 'learning':
        return onBack ? renderBackButton() : renderLogo();
      case 'search':
        return <View style={{ width: spacing.lg }} />;
      case 'inner':
        return renderBackButton();
      default:
        return renderLogo();
    }
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xs,
          minHeight: 56,
        }}
      >
        <View style={{ minWidth: 56 }}>{renderLeftContent()}</View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {resolvedTitle ? (
            <AppText variant="sectionTitle" weight="bold">
              {resolvedTitle}
            </AppText>
          ) : null}
        </View>
        <View style={{ minWidth: 56, alignItems: 'flex-end' }}>{renderRightContent()}</View>
      </View>
    </View>
  );
}
