import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function WalletTopUpScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { colors, spacing, radii, shadows } = useTheme();

  const UPI_ID = 'eduhive@ybl';
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!utrNumber || utrNumber.trim().length === 0) {
      setError('Please enter UTR number');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post('/api/wallet/topup', {
        amount: parseFloat(amount),
        utrNumber: utrNumber.trim(),
        description: description || `Wallet top-up - UTR: ${utrNumber.trim()}`,
      });

      Alert.alert(
        'Request Submitted',
        'Your wallet top-up request has been submitted. It will be processed after admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Refresh wallet screen if it exists
              if (navigation.getState()?.routes) {
                const walletRoute = navigation.getState().routes.find(r => r.name === 'Wallet');
                if (walletRoute) {
                  // Trigger refresh
                }
              }
            },
          },
        ]
      );
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyUPI = async () => {
    try {
      await Clipboard.setStringAsync(UPI_ID);
      Alert.alert('Copied!', 'UPI ID copied to clipboard');
    } catch (e) {
      Alert.alert('Error', 'Failed to copy UPI ID');
    }
  };

  const openUPI = () => {
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=EduHive&am=${amount || '0'}&cu=INR`;
    Linking.canOpenURL(upiUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(upiUrl);
        } else {
          Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm');
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Could not open UPI app');
      });
  };

  return (
    <Screen>
      <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      {error ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <View style={{ backgroundColor: colors.danger + '15', borderRadius: radii.md, padding: spacing.sm }}>
            <AppText variant="caption" color="danger">{error}</AppText>
          </View>
        </View>
      ) : null}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={{ marginBottom: spacing.lg }}>
            <AppText variant="pageTitle" weight="extrabold" style={{ marginBottom: spacing.xs }}>Add Money</AppText>
            <AppText variant="body" color="textSecondary">Top up your wallet using UPI payment</AppText>
          </View>

          <Card style={{ padding: spacing.lg, marginBottom: spacing.md }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.xs }}>Enter Amount</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>Select or enter the amount you want to add</AppText>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md }}>
              <View className="flex-row items-center">
                <AppText variant="xl" weight="bold" style={{ marginRight: spacing.sm }}>₹</AppText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1 text-neutral-900 dark:text-white"
                  placeholderTextColor={colors.textSecondary}
                  style={{ fontSize: 28 }}
                />
              </View>
            </View>

            <View>
              <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>Quick Select</AppText>
              <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
                {quickAmounts.map((amt) => (
                  <Pressable
                    key={amt}
                    onPress={() => setAmount(amt.toString())}
                    style={{
                      flex: 1,
                      minWidth: '30%',
                      borderRadius: radii.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      backgroundColor: amount === amt.toString() ? colors.brand : 'transparent',
                      borderWidth: 1,
                      borderColor: amount === amt.toString() ? colors.brand : colors.border,
                      ...(amount === amt.toString() ? shadows.sm : {}),
                    }}
                  >
                    <AppText variant="body" weight="bold" style={{ textAlign: 'center', color: amount === amt.toString() ? colors.onPrimary : colors.textPrimary }}>₹{amt}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: spacing.lg }}>
              <View className="flex-1">
                <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: spacing.xs }}>Pay to UPI ID</AppText>
                <View className="flex-row items-center">
                  <AppText variant="xl" weight="bold" style={{ marginRight: spacing.sm }}>{UPI_ID}</AppText>
                  <Pressable onPress={copyUPI} style={{ backgroundColor: colors.border, borderRadius: radii.full || 999, padding: spacing.xs }}>
                    <MaterialCommunityIcons name="content-copy" size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
              <View style={{ backgroundColor: colors.success + '20', borderRadius: radii.full || 999, padding: spacing.md }}>
                <MaterialCommunityIcons name="wallet" size={32} color={colors.success} />
              </View>
            </View>
            <AppButton title="Open UPI App" onPress={openUPI} />
          </Card>


          <Card style={{ padding: spacing.lg, marginBottom: spacing.md }}>
            <View className="flex-row items-center" style={{ marginBottom: spacing.xs }}>
              <AppText variant="lg" weight="bold">UTR Number</AppText>
              <AppText variant="caption" color="danger" style={{ marginLeft: spacing.xs }}>*</AppText>
            </View>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>Enter the UTR/Transaction ID from your payment receipt</AppText>
            <TextInput
              value={utrNumber}
              onChangeText={setUtrNumber}
              placeholder="Enter UTR number"
              className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
              style={{ borderWidth: 1, borderColor: colors.border }}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Card>

          <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <AppText variant="lg" weight="bold" style={{ marginBottom: spacing.xs }}>Description <AppText variant="caption" color="textSecondary">(Optional)</AppText></AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={3}
              className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
              style={{ borderWidth: 1, borderColor: colors.border }}
              placeholderTextColor={colors.textSecondary}
              textAlignVertical="top"
            />
          </Card>


          <View style={{ marginBottom: spacing.sm }}>
            <AppButton title={loading ? 'Submitting Request...' : 'Submit Request'} onPress={handleSubmit} disabled={loading || !amount || !utrNumber} />
          </View>

          <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: spacing.md }}>
            <AppText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Cancel</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

