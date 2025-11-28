import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, Pressable, Alert } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import Card from '../../components/atoms/Card';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { logout, user } = useAuth();
  const { spacing, colors, radii, shadows } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get user profile, wallet balance, and purchases
      const [profileRes, walletRes, purchasesRes] = await Promise.all([
        api.get('/api/me').catch(() => ({ data: {} })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
        api.get('/api/purchases').catch(() => ({ data: [] })),
      ]);

      const purchases = Array.isArray(purchasesRes.data) ? purchasesRes.data : [];
      const coursesEnrolled = purchases.length;

      // Aggregate watch time and completed lectures from per-course progress
      let totalWatchSeconds = 0;
      let completedLectures = 0;

      for (const p of purchases) {
        const courseId = p.courseId && typeof p.courseId === 'object' ? p.courseId._id : p.courseId;
        if (!courseId) continue;
        try {
          const progressRes = await api.get(`/api/progress/course/${courseId}`);
          const items = Array.isArray(progressRes.data?.items) ? progressRes.data.items : [];
          for (const it of items) {
            const duration = Number(it.duration || 0);
            const position = Number(it.position || 0);
            const clamped = duration > 0 ? Math.min(position, duration) : position;
            if (!Number.isNaN(clamped)) totalWatchSeconds += clamped;
            if (it.completed) completedLectures += 1;
          }
        } catch (err) {
          console.warn('Failed to load progress for course', courseId, err?.message || err);
        }
      }

      setProfile({
        ...(profileRes.data || {}),
        walletBalance: walletRes.data?.balance || 0,
        coursesEnrolled,
        totalWatchTime: totalWatchSeconds,
        completedLectures,
      });
    } catch (e) {
      console.error('Failed to load profile:', e);
      setError('Failed to load profile');
    }
  };

  const avatar = require('../../../assets/images/logo.jpg');

  return (
    <Screen>
      <TopBar variant="account" title="Account" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg }}>
          <Card style={{ padding: spacing.md, ...shadows.md }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Image source={avatar} style={{ width: 72, height: 72, borderRadius: 36, marginRight: spacing.md }} />
                <View className="flex-1">
                  <AppText variant="sectionTitle" weight="bold" numberOfLines={1}>{profile?.name || user?.name || 'User'}</AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={1}>{profile?.email || user?.email || ''}</AppText>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate('EditProfile')} style={{ padding: spacing.sm }}>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.success} />
              </Pressable>
            </View>
          </Card>

          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            style={{ marginTop: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, backgroundColor: colors.brand, ...shadows.lg }}
          >
            <View>
              <AppText variant="caption" weight="medium" style={{ color: colors.onBrand, marginBottom: spacing.xs }}>Wallet Balance</AppText>
              <AppText variant="sectionTitle" weight="extrabold" style={{ color: colors.onBrand }}>₹{profile?.walletBalance?.toFixed(2) || '0.00'}</AppText>
              <View style={{ marginTop: spacing.sm }}>
                <AppText variant="caption" style={{ color: colors.onBrand }}>Add Money / Manage Wallet</AppText>
              </View>
            </View>
          </Pressable>

          

          <Card style={{ marginTop: spacing.lg, overflow: 'hidden', ...shadows.md }}>
            {[
              { icon:'account', label:'View Profile', onPress: () => navigation.navigate('EditProfile') },
              { icon:'wallet', label:'My Wallet', onPress: () => navigation.navigate('Wallet') },
              { icon:'playlist-play', label:'My Courses', onPress: () => navigation.navigate('MyCourses') },
              { icon:'cog-outline', label:'Settings', onPress: () => navigation.navigate('Settings') },
            ].map((item, index) => (
              <Pressable 
                key={item.label}
                onPress={item.onPress}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomColor: index < 3 ? (colors.border) : 'transparent', borderBottomWidth: index < 3 ? 1 : 0 }}
              >
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.success} />
                <AppText variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>{item.label}</AppText>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
          </Card>

          <Pressable
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout }
                ]
              );
            }}
            style={{ marginTop: spacing.lg, borderWidth: 1, borderColor: colors.danger, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}
          >
            <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
            <AppText variant="body" weight="semibold" style={{ marginLeft: spacing.sm, color: colors.danger }}>Logout</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
