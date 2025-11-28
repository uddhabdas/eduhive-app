import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, Linking, AppState, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Parse a UPI callback URL or query string into a lowercase-keyed map
function parseUPIResponse(input) {
  if (!input) return {};
  let query = input;
  const qIndex = input.indexOf('?');
  if (qIndex !== -1) {
    query = input.slice(qIndex + 1);
  }
  const params = {};
  query.split('&').forEach((part) => {
    if (!part) return;
    const [rawKey, rawValue = ''] = part.split('=');
    if (!rawKey) return;
    const key = decodeURIComponent(rawKey).toLowerCase();
    const value = decodeURIComponent(rawValue);
    params[key] = value;
  });
  return params;
}

export default function WalletTopUpScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { colors, spacing, radii, shadows } = useTheme();
  const appState = useRef(AppState.currentState);
  const upiIntentActive = useRef(false);
  const upiCallbackReceived = useRef(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [mode, setMode] = useState('razorpay');

  const UPI_ID = 'eduhive@ybl';
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const buildCheckoutHtml = ({ keyId, orderId, amount }) => {
    const displayAmount = Number(amount || 0).toFixed(2);
    const amountPaise = Math.round(Number(amount || 0) * 100);
    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="background:#0b132b;color:#fff;font-family:system-ui;margin:0;">
    <div style="padding:16px;">
      <h3 style="margin:0 0 8px">EduHive Wallet Top‑Up</h3>
      <div style="opacity:.8;margin-bottom:12px">Amount: ₹${displayAmount}</div>
      <button id="paybtn" style="background:#10b981;color:#fff;border:none;padding:12px 16px;border-radius:8px;font-size:16px">Pay with Razorpay</button>
    </div>
    <script>
      function post(data){try{window.ReactNativeWebView.postMessage(JSON.stringify(data));}catch(e){}}
      var options = {
        key: '${keyId}',
        ${orderId ? `order_id: '${orderId}',` : ''}
        ${orderId ? '' : `amount: ${amountPaise}, currency: 'INR',`}
        name: 'EduHive',
        description: 'Wallet Top‑Up',
        theme: { color: '#10b981' },
        handler: function(resp){
          post({event:'success', payload: resp});
        },
        modal: {
          ondismiss: function(){ post({event:'cancel'}); }
        }
      };
      document.getElementById('paybtn').onclick = function(){
        var rz = new Razorpay(options);
        rz.open();
      };
      setTimeout(function(){ document.getElementById('paybtn').click(); }, 300);
    </script>
  </body>
</html>`;
  };

  const startRazorpayTopUp = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Amount required', 'Please enter a valid amount before proceeding.');
      return;
    }
    try {
      setCreatingOrder(true);
      let orderId = null;
      let keyId = null;
      try {
        const res = await api.post('/api/payments/razorpay/create-order', { amount: amt });
        orderId = res.data?.orderId || null;
        keyId = res.data?.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || null;
      } catch {}

      if (!keyId) {
        keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || (__DEV__ ? 'rzp_test_RkqtRsC6fvtDe9' : null);
      }

      if (!keyId) {
        Alert.alert('Error', 'Razorpay Key ID missing. Set EXPO_PUBLIC_RAZORPAY_KEY_ID.');
        setCreatingOrder(false);
        return;
      }

      const html = buildCheckoutHtml({ keyId, orderId, amount: amt });
      setCheckoutHtml(html);
      setShowCheckout(true);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Listen for UPI callback URLs while this screen is mounted
  useEffect(() => {
    const handleUrl = async (event) => {
      const url = event?.url || '';
      if (!url || !url.startsWith('upi://pay')) return;

      console.log('[UPI] Callback URL:', url);
      const params = parseUPIResponse(url);
      console.log('[UPI] Callback params:', params);

      const rawStatus = params.status || params.Status || params.STATUS;
      const status = (rawStatus || '').toUpperCase();
      const vpa = (params.pa || params.payervpa || params.vpa || '').toLowerCase();

      upiCallbackReceived.current = true;
      upiIntentActive.current = false;

      if (status !== 'SUCCESS') {
        // Non-blocking error banner; do not credit wallet
        setError(
          'Payment failed due to a technical error from your UPI app or bank.\nIf money was debited, your bank should auto-refund it.'
        );
        console.log('[UPI] Payment status:', status || 'UNKNOWN');
        return;
      }

      if (vpa !== 'eduhive@ybl') {
        console.warn('[UPI] Success status but VPA mismatch:', vpa);
        setError(
          'Payment completed but did not reach the official EduHive UPI handle. Please contact support with your bank reference.'
        );
        return;
      }

      try {
        const paidAmount = parseFloat(params.am || params.amount || amount) || 0;
        if (!paidAmount || paidAmount <= 0) {
          console.warn('[UPI] Callback missing valid amount:', params);
        }

        // Call backend wallet credit endpoint and then show updated balance
        await api.post('/api/wallet/upi-credit', {
          amount: paidAmount,
          upiParams: params,
        });

        console.log('[UPI] Wallet credit successful for amount:', paidAmount);
        navigation.navigate('Wallet');
      } catch (e) {
        console.error('[UPI] Wallet credit API failed:', e?.response?.data || e);
        setError(
          'Payment was successful but we could not update your wallet automatically. Please contact support with your UPI reference.'
        );
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          handleUrl({ url: initialUrl });
        }
      })
      .catch((err) => {
        console.warn('[UPI] Failed to read initial URL:', err);
      });

    const handleAppStateChange = (nextAppState) => {
      const prev = appState.current;
      appState.current = nextAppState;
      if (prev?.match(/inactive|background/) && nextAppState === 'active') {
        if (upiIntentActive.current && !upiCallbackReceived.current) {
          console.log('[UPI] No callback received. User likely canceled or backed out.');
          setError('Payment was not completed. You may have canceled or closed the UPI app.');
          upiIntentActive.current = false;
        }
      }
    };

    const appSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      appSub.remove();
    };
  }, [amount, navigation]);

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
      // Note: If a manual payment to eduhive@ybl fails inside the UPI app,
      // that failure is on the bank/PSP side and not due to the EduHive app logic.
      await Clipboard.setStringAsync(UPI_ID);
      Alert.alert('Copied', 'UPI ID copied to clipboard');
    } catch (e) {
      Alert.alert('Error', 'Failed to copy UPI ID');
    }
  };

  const openUPI = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Amount required', 'Please enter a valid amount before opening the UPI app.');
      return;
    }

    // Minimal, stable UPI URL
    const pa = encodeURIComponent('eduhive@ybl');
    const pn = encodeURIComponent('EduHive');
    const am = amt.toFixed(2);
    const tn = encodeURIComponent('EduHive Wallet Top-Up');
    const upiUrl = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    console.log('[UPI] Final URL:', upiUrl);

    upiCallbackReceived.current = false;
    upiIntentActive.current = true;

    Linking.canOpenURL(upiUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(upiUrl)
            .then(() => {
              console.log('[UPI] Intent launched successfully');
            })
            .catch((err) => {
              console.error('[UPI] openURL failed:', err);
              Alert.alert('Error', 'Could not open UPI app');
              upiIntentActive.current = false;
            });
        }
        console.warn('[UPI] No UPI app available');
        Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm');
        upiIntentActive.current = false;
      })
      .catch((err) => {
        console.error('[UPI] canOpenURL check failed:', err);
        Alert.alert('Error', 'Could not open UPI app');
        upiIntentActive.current = false;
      });
  };

  return (
    <Screen>
      <TopBar variant="inner" title="Wallet Top-Up" onBack={() => navigation.goBack()} />
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
            <AppText variant="body" color="textSecondary">Use Razorpay or UPI to top up your wallet</AppText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Pressable
              onPress={() => setMode('razorpay')}
              style={{ minWidth: 120, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.full || 999, borderWidth: 1, borderColor: mode === 'razorpay' ? colors.brand : colors.border, backgroundColor: mode === 'razorpay' ? colors.brand : colors.surface, ...((mode === 'razorpay') ? shadows.sm : {}) }}
            >
              <AppText variant="body" weight="bold" style={{ textAlign: 'center', color: mode === 'razorpay' ? colors.onPrimary : colors.textPrimary }}>Razorpay</AppText>
            </Pressable>
            <Pressable
              onPress={() => setMode('upi')}
              style={{ minWidth: 120, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.full || 999, borderWidth: 1, borderColor: mode === 'upi' ? colors.brand : colors.border, backgroundColor: mode === 'upi' ? colors.brand : colors.surface, ...((mode === 'upi') ? shadows.sm : {}) }}
            >
              <AppText variant="body" weight="bold" style={{ textAlign: 'center', color: mode === 'upi' ? colors.onPrimary : colors.textPrimary }}>UPI</AppText>
            </Pressable>
          </View>

          <Card style={{ padding: spacing.lg, marginBottom: spacing.md }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.xs }}>Enter Amount</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>Select or enter the amount you want to add</AppText>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadows.md }}>
              <View className="items-center">
                <AppText variant="xxl" weight="extrabold" style={{ marginBottom: spacing.xs }}>₹</AppText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="text-neutral-900 dark:text-white"
                  placeholderTextColor={colors.textSecondary}
                  style={{ fontSize: 28, textAlign: 'center' }}
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

          {mode === 'razorpay' ? (
            <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
              <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.xs }}>Pay with Razorpay</AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>Quick online payment. Wallet is credited automatically on success.</AppText>
              <AppButton title={creatingOrder ? 'Starting...' : 'Pay via Razorpay'} onPress={startRazorpayTopUp} disabled={creatingOrder || !amount} />
            </Card>
          ) : (
            <>
              <Card style={{ padding: spacing.lg, marginBottom: spacing.lg, ...shadows.md }}>
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
            </>
          )}


          


          <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: spacing.md }}>
            <AppText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Cancel</AppText>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showCheckout} animationType="slide" onRequestClose={() => setShowCheckout(false)}>
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <TopBar variant="inner" title="Razorpay" onBack={() => setShowCheckout(false)} />
          {checkoutHtml ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html: checkoutHtml }}
              onMessage={async (evt) => {
                try {
                  const data = JSON.parse(evt.nativeEvent.data || '{}');
                  if (data.event === 'success' && data.payload) {
                    const p = data.payload;
                    try {
                      await api.post('/api/wallet/topup/razorpay/verify', {
                        orderId: p.razorpay_order_id || null,
                        paymentId: p.razorpay_payment_id,
                        signature: p.razorpay_signature || null,
                      });
                      setShowCheckout(false);
                      Alert.alert('Payment Successful', 'Wallet credited successfully.', [
                        { text: 'OK', onPress: () => navigation.navigate('Wallet') },
                      ]);
                    } catch (e) {
                      Alert.alert('Verification Failed', e?.response?.data?.error || 'Could not verify payment.');
                    }
                  } else if (data.event === 'cancel') {
                    setShowCheckout(false);
                    Alert.alert('Payment Canceled', 'You canceled the Razorpay payment.');
                  }
                } catch {}
              }}
            />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

