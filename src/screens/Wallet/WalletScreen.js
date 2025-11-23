import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, Modal } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorBanner from '../../components/ErrorBanner';

export default function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const { colors, spacing, radii, shadows, typography } = useTheme();
  const loadData = async () => {
    try {
      setError(null);
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/api/wallet/balance'),
        api.get('/api/wallet/transactions'),
      ]);
      setBalance(balanceRes.data.balance || 0);
      setTransactions(transactionsRes.data || []);
    } catch (e) {
      console.error('Failed to load wallet data:', e);
      setError('Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <Screen>
      <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: spacing.xl, paddingBottom: spacing.xl }}>
          {/* Wallet Balance Card - Enhanced */}
          <View style={{ borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg, overflow: 'hidden', backgroundColor: colors.brand, ...shadows.lg }}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <AppText variant="sm" weight="medium" style={{ color: colors.onBrand, opacity: 0.9 }}>Available Balance</AppText>
                <AppText variant="display" weight="extrabold" style={{ color: colors.onBrand }}>₹{balance.toFixed(2)}</AppText>
              </View>
              <View 
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onBrand, opacity: 0.2 }}
              >
                <MaterialCommunityIcons name="wallet" size={32} color={colors.onBrand} />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('WalletTopUp')}
              style={{ backgroundColor: colors.surface, borderRadius: radii.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, ...shadows.sm }}
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="plus-circle" size={20} color={colors.success} />
                <AppText variant="base" weight="bold" style={{ color: colors.success, marginLeft: spacing.xs }}>Add Money</AppText>
              </View>
            </Pressable>
          </View>

          {/* Quick Actions - Enhanced */}
          <View className="mb-5">
            <AppText variant="base" weight="bold">Quick Actions</AppText>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => navigation.navigate('WalletTopUp')}
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', ...shadows.md }}
              >
                <View style={{ width: 56, height: 56, backgroundColor: colors.success + '20', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="plus-circle" size={28} color={colors.success} />
                </View>
                <AppText variant="base" weight="bold">Add Money</AppText>
                <AppText variant="xs" color="textSecondary" style={{ marginTop: spacing.xs }}>Top up wallet</AppText>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Courses')}
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', ...shadows.md }}
              >
                <View style={{ width: 56, height: 56, backgroundColor: colors.info + '20', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="book-open-variant" size={28} color={colors.info} />
                </View>
                <AppText variant="base" weight="bold">Browse</AppText>
                <AppText variant="xs" color="textSecondary" style={{ marginTop: spacing.xs }}>Explore courses</AppText>
              </Pressable>
            </View>
          </View>

          {/* Transaction History - Enhanced */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', ...shadows.md }}>
            <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
              <AppText variant="base" weight="bold">Transaction History</AppText>
              <AppText variant="xs" color="textSecondary" style={{ marginTop: spacing.xs }}>
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
              </AppText>
            </View>
            
            {loading ? (
              <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
                <MaterialCommunityIcons name="clock-outline" size={32} color={colors.textSecondary} />
                <AppText variant="sm" color="textSecondary" style={{ marginTop: spacing.lg }}>Loading transactions...</AppText>
              </View>
            ) : transactions.length === 0 ? (
              <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, backgroundColor: colors.border, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
                  <MaterialCommunityIcons name="wallet-outline" size={40} color={colors.textSecondary} />
                </View>
                <AppText variant="base" weight="semibold">No transactions yet</AppText>
                <AppText variant="sm" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>Add money to your wallet to start purchasing courses</AppText>
                <View style={{ marginTop: spacing.lg }}>
                  <AppButton title="Add Money Now" onPress={() => navigation.navigate('WalletTopUp')} />
                </View>
              </View>
            ) : (
              <View>
                {transactions.map((tx, index) => (
                  <Pressable
                    key={tx._id}
                    onPress={() => setSelectedTx(tx)}
                    style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: index < transactions.length - 1 ? colors.border : 'transparent', borderBottomWidth: index < transactions.length - 1 ? 1 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tx.status === 'pending' ? colors.warning + '15' : 'transparent' }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View
                        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg, backgroundColor: getStatusColor(tx.status) + '15' }}
                      >
                        <MaterialCommunityIcons
                          name={tx.type === 'credit' ? 'arrow-down-bold' : 'arrow-up-bold'}
                          size={22}
                          color={getStatusColor(tx.status)}
                        />
                      </View>
                      <View className="flex-1">
                        <AppText variant="sm" weight="bold">
                          {tx.type === 'credit' ? 'Money Added' : 'Course Purchase'}
                        </AppText>
                        <AppText variant="xs" color="textSecondary" style={{ marginTop: 2 }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </AppText>
                        {tx.status === 'pending' && tx.utrNumber && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                            <AppText variant="xs" color="textSecondary">UTR: <Text style={{ fontFamily: 'monospace', color: colors.textSecondary }}>{tx.utrNumber}</Text></AppText>
                          </View>
                        )}
                        <View className="flex-row items-center mt-2">
                          <MaterialCommunityIcons
                            name={getStatusIcon(tx.status)}
                            size={14}
                            color={getStatusColor(tx.status)}
                          />
                          <AppText variant="xs" weight="semibold" style={{ marginLeft: 6, textTransform: 'capitalize', color: getStatusColor(tx.status) }}>{tx.status}</AppText>
                        </View>
                      </View>
                    </View>
                    <View className="items-end ml-3">
                      <AppText variant="base" weight="bold" style={{ color: tx.type === 'credit' ? colors.success : colors.danger }}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Transaction details modal */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, ...shadows.md }}>
            {selectedTx && (
              <>
                <View className="items-center mb-4">
                  <View
                    style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, backgroundColor: getStatusColor(selectedTx.status) + '15' }}
                  >
                    <MaterialCommunityIcons
                      name={selectedTx.type === 'credit' ? 'arrow-down-bold' : 'arrow-up-bold'}
                      size={24}
                      color={getStatusColor(selectedTx.status)}
                    />
                  </View>
                  <AppText variant="xxl" weight="extrabold" style={{ color: selectedTx.type === 'credit' ? colors.success : colors.danger }}>
                    {selectedTx.type === 'credit' ? '+' : '-'}₹{selectedTx.amount.toFixed(2)}
                  </AppText>
                  <View className="mt-2 flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: getStatusColor(selectedTx.status) + '15' }}>
                    <MaterialCommunityIcons
                      name={getStatusIcon(selectedTx.status)}
                      size={14}
                      color={getStatusColor(selectedTx.status)}
                    />
                    <AppText variant="xs" weight="semibold" style={{ marginLeft: 6, textTransform: 'capitalize', color: getStatusColor(selectedTx.status) }}>{selectedTx.status}</AppText>
                  </View>
                </View>

                <View className="mb-3">
                  <AppText variant="xs" weight="semibold" color="textSecondary">TYPE</AppText>
                  <AppText variant="base" weight="semibold">{selectedTx.type === 'credit' ? 'Money Added' : 'Course Purchase'}</AppText>
                </View>

                <View className="mb-3">
                  <AppText variant="xs" weight="semibold" color="textSecondary">DATE & TIME</AppText>
                  <AppText variant="base">{new Date(selectedTx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</AppText>
                </View>

                {selectedTx.description ? (
                  <View className="mb-3">
                    <AppText variant="xs" weight="semibold" color="textSecondary">DESCRIPTION</AppText>
                    <AppText variant="base">{selectedTx.description}</AppText>
                  </View>
                ) : null}

                {selectedTx.utrNumber ? (
                  <View className="mb-3">
                    <AppText variant="xs" weight="semibold" color="textSecondary">UTR NUMBER</AppText>
                    <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.border }}>
                      <AppText variant="sm">{selectedTx.utrNumber}</AppText>
                    </View>
                  </View>
                ) : null}

                {selectedTx.transactionId ? (
                  <View className="mb-4">
                    <AppText variant="xs" weight="semibold" color="textSecondary">TRANSACTION ID</AppText>
                    <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.border }}>
                      <AppText variant="sm">{selectedTx.transactionId}</AppText>
                    </View>
                  </View>
                ) : null}

                <View style={{ marginTop: spacing.sm }}>
                  <AppButton title="Close" onPress={() => setSelectedTx(null)} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
