import React, { useState, useEffect } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import AppButton from '../../components/atoms/AppButton';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { useCart } from '../../store/CartContext';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CartScreen({ navigation }) {
  const { items, remove, clear } = useCart();
  const [walletBalance, setWalletBalance] = useState(0);
  const [processing, setProcessing] = useState(false);
  const { spacing, colors, radii } = useTheme();

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
              // Purchase each course
              for (const item of items) {
                try {
                  const response = await api.post(`/api/courses/${item._id}/purchase`);
                  if (response.status >= 200 && response.status < 300) {
                    successfulCourses.push(item.title);
                  } else {
                    failedCourses.push({ title: item.title, error: response.data?.error || 'Unknown error' });
                  }
                } catch (e) {
                  console.error(`Failed to purchase course ${item._id}:`, e);
                  const errorMsg = e.response?.data?.error || e.message || 'Purchase failed';
                  failedCourses.push({ title: item.title, error: errorMsg });
                }
              }

              // Refresh wallet balance
              await loadWalletBalance();
              
              // Show appropriate message based on results
              if (failedCourses.length === 0) {
                // All successful
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
                // Partial success
                Alert.alert(
                  'Partial Success',
                  `${successfulCourses.length} course(s) purchased successfully.\n\nFailed:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Remove successful courses from cart
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
                // All failed
                Alert.alert(
                  'Purchase Failed',
                  `Failed to purchase courses:\n${failedCourses.map(f => `• ${f.title}: ${f.error}`).join('\n')}`
                );
              }
            } catch (e) {
              console.error('Checkout error:', e);
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
      <TopBar onSearch={() => {}} onCart={() => {}} onProfile={() => navigation.navigate('Profile')} />
      <View style={{ flex: 1, paddingTop: spacing.lg }}>
        <AppText variant="pageTitle" weight="extrabold" style={{ marginBottom: spacing.md }}>Cart</AppText>
        
        {/* Wallet Balance */}
        <View style={{ backgroundColor: colors.success + '15', borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="caption" color="success" style={{ marginBottom: spacing.xs }}>Wallet Balance</AppText>
            <AppText variant="sectionTitle" weight="bold" color="success">₹{walletBalance.toFixed(2)}</AppText>
          </View>
          {!canPurchase && (
            <Pressable
              onPress={() => navigation.navigate('WalletTopUp')}
              style={{ backgroundColor: colors.success, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md }}
            >
              <AppText variant="body" weight="semibold" style={{ color: colors.onPrimary }}>Add Money</AppText>
            </Pressable>
          )}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
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
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <View className="flex-1 pr-3">
                <AppText variant="body" weight="semibold" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>₹{item.price?.toFixed(2) || '0.00'}</AppText>
              </View>
              <Pressable onPress={() => remove(item._id)} accessibilityLabel="Remove">
                <MaterialCommunityIcons name="delete-outline" size={22} color={colors.danger} />
              </Pressable>
            </Card>
          )}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
                <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
                  <View className="flex-row justify-between items-center mb-2">
                    <AppText variant="body" color="textSecondary">Subtotal</AppText>
                    <AppText variant="body" weight="semibold">₹{total.toFixed(2)}</AppText>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
                  <View className="flex-row justify-between items-center">
                    <AppText variant="sectionTitle" weight="bold">Total</AppText>
                    <AppText variant="sectionTitle" weight="bold" color="success">₹{total.toFixed(2)}</AppText>
                  </View>
                </Card>
                
                {!canPurchase && (
                  <View style={{ backgroundColor: colors.warning + '15', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg }}>
                    <AppText variant="caption" color="warning" style={{ textAlign: 'center' }}>Insufficient balance. Add ₹{(total - walletBalance).toFixed(2)} more to your wallet.</AppText>
                  </View>
                )}

                <AppButton title={processing ? 'Processing...' : `Purchase (₹${total.toFixed(2)})`} onPress={handleCheckout} disabled={processing || !canPurchase || items.length === 0} />
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
