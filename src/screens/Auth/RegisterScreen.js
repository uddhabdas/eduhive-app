import React, { useState } from 'react';
import { View, TextInput, Pressable, useColorScheme, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({ name: '', email: '', password: '', confirm: '' });
  const { spacing, colors, radii, shadows } = useTheme();

  const validate = () => {
    const errs = { name: '', email: '', password: '', confirm: '' };
    if (!name.trim()) errs.name = 'Name is required';
    if (!emailRx.test(email.trim())) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (confirm !== password) errs.confirm = 'Passwords do not match';
    setFieldErr(errs);
    return !errs.name && !errs.email && !errs.password && !errs.confirm;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError('Registration failed. Try a different email or check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TopBar onSearchPress={() => {}} onCartPress={() => {}} onProfilePress={() => {}} />
      <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.sm, marginBottom: spacing.sm }}>
            <Image source={require('../../../assets/images/logo.jpg')} style={{ width: 56, height: 56, borderRadius: radii.md }} />
          </Card>
          <AppText variant="pageTitle" weight="extrabold">EDUHIVE</AppText>
        </View>

        <Card style={{ padding: spacing.lg }}>
          <AppText variant="sectionTitle" weight="bold" style={{ textAlign: 'center' }}>Join EduHive</AppText>
          <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>Create your free account</AppText>

          {error ? (
            <View style={{ backgroundColor: colors.danger + '15', borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.md }}>
              <AppText variant="caption" color="danger">{error}</AppText>
            </View>
          ) : null}

          <View style={{ marginBottom: spacing.md }}>
            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Name</AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-4 py-3 text-neutral-900 dark:text-white"
              style={{ fontSize: 16, borderWidth: 1, borderColor: colors.border }}
              autoCapitalize="words"
            />
            {fieldErr.name ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.name}</AppText> : <View style={{ height: spacing.xs }} />}
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Email</AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-4 py-3 text-neutral-900 dark:text-white"
              style={{ fontSize: 16, borderWidth: 1, borderColor: colors.border }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {fieldErr.email ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.email}</AppText> : <View style={{ height: spacing.xs }} />}
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Password</AppText>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.textSecondary}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 dark:text-white"
                style={{ fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: spacing.md, top: spacing.md }}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            {fieldErr.password ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.password}</AppText> : <View style={{ height: spacing.xs }} />}
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: spacing.xs }}>Confirm Password</AppText>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textSecondary}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3.5 pr-12 text-neutral-900 dark:text-white"
                style={{ fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                secureTextEntry={!showConfirm}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: spacing.md, top: spacing.md }}>
                <MaterialCommunityIcons name={showConfirm ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            {fieldErr.confirm ? <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>{fieldErr.confirm}</AppText> : <View style={{ height: spacing.xs }} />}
          </View>

          <AppButton title={loading ? 'Creating...' : 'Register'} onPress={onSubmit} disabled={loading} />
        </Card>
      </View>
    </Screen>
  );
}
