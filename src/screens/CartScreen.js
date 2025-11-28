import React, { useState, useEffect } from 'react';
import { View, FlatList, Pressable, Alert, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import Screen from '../components/layout/Screen';
import TopBar from '../components/layout/TopBar';
import AppText from '../components/atoms/AppText';
import AppButton from '../components/atoms/AppButton';
import Card from '../components/atoms/Card';
import { useTheme } from '../theme/ThemeProvider';
import { useCart } from '../store/CartContext';
import { api } from '../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CartScreen({ navigation }) {
  const { items, remove, clear } = useCart();
  const [walletBalance, setWalletBalance] = useState(0);
  const [processing, setProcessing] = useState(false);
  const { spacing, colors, radii, shadows } = useTheme();

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      const res = await api.get('/api/wallet/balance');
      setWalletBalance(res.data.balance || 0);
    } catch (e) {
      console.error('Failed to load wallet balance:', e);
    }
  };

  const resolveThumbUrl = (item) => {
    const base = api?.defaults?.baseURL || '';
    const u = item?.thumbnailUrl;
    if (u) {
      if (/^https?:\/\//.test(u)) return u;
      return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
    }
    return `${base}/course-images/placeholder.jpg`;
  };

  const total = items.reduce((sum, c) => sum + (c.price ?? 0), 0);
  const canPurchase = walletBalance >= total;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    if (!canPurchase) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${total.toFixed(2)} but only have ₹${walletBalance.toFixed(2)} in your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${items.length} course(s) for ₹${total.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setProcessing(true);
            const failedCourses = [];
            const successfulCourses = [];

            try {
              for (const item of items) {
                try {
                  const response = await api.post(`/api/courses/${item._id}/purchase`);
                  if (response.status >= 200 && response.status < 300) {
                    successfulCourses.push(item.title);
                  } else {
                    failedCourses.push({ title: item.title, error: response.data?.error || 'Unknown error' });
                  }
                } catch (e) {
                  const errorMsg = e.response?.data?.error || e.message || 'Purchase failed';
                  failedCourses.push({ title: item.title, error: errorMsg });
                }
              }

              await loadWalletBalance();

              if (failedCourses.length === 0) {
                Alert.alert('Success', 'All courses purchased successfully!', [
                  {
                    text: 'OK',
                    onPress: () => {
                      clear();
                      navigation.navigate('Courses');
                    },
                  },
                ]);
              } else if (successfulCourses.length > 0) {
                Alert.alert(
                  'Partial Success',
                  `${successfulCourses.length} course(s) purchased successfully.\n\nFailed:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        items.forEach(item => {
                          if (successfulCourses.includes(item.title)) {
                            remove(item._id);
                          }
                        });
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Purchase Failed',
                  `Failed to purchase courses:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`
                );
              }
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to complete purchase');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <TopBar variant="inner" title="Cart" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, paddingTop: spacing.lg }}>
        <Card style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.lg, marginBottom: spacing.md, ...shadows.sm }}>
          <View className="flex-row items-center justify-between">
            <View>
              <AppText variant="caption" color="textSecondary">Wallet Balance</AppText>
              <AppText variant="sectionTitle" weight="extrabold">₹{walletBalance.toFixed(2)}</AppText>
            </View>
            <Pressable onPress={() => navigation.navigate('WalletTopUp')} style={{ backgroundColor: colors.brand, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full || 999, ...shadows.md }}>
              <AppText variant="caption" weight="semibold" style={{ color: colors.onPrimary }}>Add Money</AppText>
            </Pressable>
          </View>
        </Card>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: spacing.xxl * 3 }}
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <MaterialCommunityIcons name="cart-outline" size={64} color={colors.textSecondary} />
              <AppText variant="sectionTitle" weight="bold" style={{ marginTop: spacing.lg }}>Your cart is empty</AppText>
              <View style={{ marginTop: spacing.lg }}>
                <AppButton title="Browse Courses" onPress={() => navigation.navigate('Courses')} />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface, ...shadows.md, borderRadius: radii.xl }}>
              <View style={{ width: 120, height: 80, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.border, marginRight: spacing.md }}>
                {(() => {
                  const uri = resolveThumbUrl(item);
                  return uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : null;
                })()}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="lg" weight="bold" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>Course</AppText>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: spacing.md }}>
                <View style={{ backgroundColor: colors.brand, borderRadius: radii.lg, paddingVertical: 6, paddingHorizontal: spacing.md, ...shadows.sm }}>
                  <AppText variant="body" weight="bold" style={{ color: colors.onBrand }}>₹{item.price?.toFixed(2) || '0.00'}</AppText>
                </View>
                <Pressable onPress={() => remove(item._id)} accessibilityLabel="Remove" style={{ marginTop: spacing.sm, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.danger + '15' }}>
                  <AppText variant="caption" weight="semibold" style={{ color: colors.danger }}>Remove</AppText>
                </Pressable>
              </View>
            </Card>
          )}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
                <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
                  <View className="flex-row items-center" style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <AppText variant="body" color="textSecondary">Subtotal</AppText>
                    <AppText variant="body" weight="semibold">₹{total.toFixed(2)}</AppText>
                  </View>
                  <View className="flex-row items-center" style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <AppText variant="body" color="textSecondary">Discounts</AppText>
                    <AppText variant="body" weight="semibold">₹0.00</AppText>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
                  <View className="flex-row items-center" style={{ justifyContent: 'space-between' }}>
                    <AppText variant="sectionTitle" weight="bold">Total</AppText>
                    <AppText variant="sectionTitle" weight="bold" color="success">₹{total.toFixed(2)}</AppText>
                  </View>
                </Card>
                {!canPurchase && (
                  <View style={{ backgroundColor: colors.warning + '15', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg }}>
                    <AppText variant="caption" color="warning" style={{ textAlign: 'center' }}>Insufficient balance. Add ₹{(total - walletBalance).toFixed(2)} more to your wallet.</AppText>
                  </View>
                )}
                
              </View>
            ) : null
          }
        />
        <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg }}>
          <BlurView intensity={40} tint="light" style={{ borderRadius: radii.xl, overflow: 'hidden', ...shadows.lg }}>
            <View style={{ padding: spacing.md, backgroundColor: colors.surface + 'EE' }}>
              {!canPurchase && (
                <AppText variant="caption" color="warning" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  Insufficient balance. Add ₹{(total - walletBalance).toFixed(2)} more.
                </AppText>
              )}
              <AppButton
                title={processing ? 'Processing…' : `Checkout (₹${total.toFixed(2)})`}
                onPress={handleCheckout}
                disabled={processing || items.length === 0 || !canPurchase}
              />
            </View>
          </BlurView>
        </View>
      </View>
    </Screen>
  );
} 
