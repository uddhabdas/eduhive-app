import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, useColorScheme } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const scheme = useColorScheme();
  const { spacing, colors } = useTheme();
  const { clear } = useCart();
  const { logout } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              clear();
              await AsyncStorage.removeItem('cart_items');
              Alert.alert('Success', 'Cart cleared successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cart');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, danger = false }) => (
    <Card style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
      <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, backgroundColor: danger ? colors.danger + '20' : colors.success + '20' }}>
          <MaterialCommunityIcons name={icon} size={24} color={danger ? colors.danger : colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="bold" style={{ color: danger ? colors.danger : colors.textPrimary }}>{title}</AppText>
          {subtitle && <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{subtitle}</AppText>}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </Pressable>
    </Card>
  );

  return (
    <Screen>
      <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <AppText variant="pageTitle" weight="extrabold" style={{ marginBottom: spacing.xl }}>Settings</AppText>

          {/* General Settings */}
          <View style={{ marginBottom: spacing.xl }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>General</AppText>
            <SettingItem
              icon="theme-light-dark"
              title="Theme"
              subtitle="Use the theme toggle in the header to switch Light/Dark mode"
              onPress={() => {}}
            />
            <SettingItem
              icon="account-edit"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              icon="book-open-variant"
              title="My Courses"
              subtitle="View all your enrolled courses"
              onPress={() => navigation.navigate('MyCourses')}
            />
            <SettingItem
              icon="wallet"
              title="Wallet"
              subtitle="Manage your wallet balance and transactions"
              onPress={() => navigation.navigate('Wallet')}
            />
          </View>

          {/* Storage & Data */}
          <View style={{ marginBottom: spacing.xl }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>Storage & Data</AppText>
            <SettingItem
              icon="cart-off"
              title="Clear Cart"
              subtitle="Remove all items from your shopping cart"
              onPress={handleClearCart}
              danger={false}
            />
            <SettingItem
              icon="cached"
              title="Clear Cache"
              subtitle="Clear app cache and temporary data"
              onPress={async () => {
                Alert.alert(
                  'Clear Cache',
                  'This will clear all cached data. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      onPress: async () => {
                        try {
                          // Clear various cache items
                          await AsyncStorage.multiRemove([
                            'cart_items',
                            // Add other cache keys if needed
                          ]);
                          Alert.alert('Success', 'Cache cleared successfully');
                        } catch (e) {
                          Alert.alert('Error', 'Failed to clear cache');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </View>

          {/* About */}
          <View style={{ marginBottom: spacing.xl }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>About</AppText>
            <SettingItem
              icon="information"
              title="App Version"
              subtitle="EduHive v1.0.0"
              onPress={() => {}}
            />
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help with using the app"
              onPress={() => {
                Alert.alert('Help & Support', 'For support, please contact us at support@eduhive.com');
              }}
            />
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: spacing.xl }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>Account</AppText>
            <SettingItem
              icon="logout"
              title="Logout"
              subtitle="Sign out from your account"
              onPress={handleLogout}
              danger={true}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
