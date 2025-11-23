import React, { useState } from 'react';
import { View, TextInput, Pressable, useColorScheme, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import ErrorBanner from '../../components/ErrorBanner';
import AppButton from '../../components/atoms/AppButton';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({ email: '', password: '' });
  const { spacing, colors } = useTheme();

  const validate = () => {
    const errs = { email: '', password: '' };
    if (!emailRx.test(email.trim())) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErr(errs);
    return !errs.email && !errs.password;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (e) {
      setError('Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TopBar onSearch={() => {}} onCart={() => {}} onProfile={() => {}} />
      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <Card style={{ padding: spacing.sm, marginBottom: spacing.sm }}>
          <Image source={require('../../../assets/images/logo.jpg')} style={{ width: 56, height: 56, borderRadius: 10 }} />
        </Card>
        <AppText variant="pageTitle" weight="extrabold">EDUHIVE</AppText>
      </View>
      <Card style={{ padding: spacing.lg }}>
        <AppText variant="sectionTitle" weight="bold" style={{ textAlign: 'center' }}>Welcome back</AppText>
        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>Log in to continue learning</AppText>
        <ErrorBanner message={error} />
        <View style={{ marginBottom: spacing.md }}>
          <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Email</AppText>
          <TextInput className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-neutral-900 dark:text-white" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="email-address" style={{ fontSize: 16 }} />
          {fieldErr.email ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.email}</AppText> : <View style={{ height: spacing.xs }} />}
        </View>
        <View style={{ marginBottom: spacing.lg }}>
          <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Password</AppText>
          <View style={{ position: 'relative' }}>
            <TextInput className="bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 dark:text-white" value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={colors.textSecondary} secureTextEntry={!showPassword} style={{ fontSize: 16 }} />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: 14 }}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          {fieldErr.password ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.password}</AppText> : <View style={{ height: spacing.xs }} />}
        </View>
        <AppButton title={loading ? 'Logging in...' : 'Login'} onPress={onSubmit} disabled={loading} />
        <View style={{ height: spacing.sm }} />
        <Pressable onPress={() => navigation.navigate('Register')} style={{ paddingVertical: spacing.sm }}>
          <AppText variant="body" weight="semibold" color="success" style={{ textAlign: 'center' }}>Create an account</AppText>
        </Pressable>
      </Card>
    </Screen>
  );
}
