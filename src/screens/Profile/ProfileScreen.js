import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, Pressable, Alert } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { logout, user } = useAuth();
  const { spacing, colors, radii } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get user profile and wallet balance
      const [profileRes, walletRes] = await Promise.all([
        api.get('/api/me').catch(() => ({ data: {} })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
      ]);
      setProfile({
        ...(profileRes.data || {}),
        walletBalance: walletRes.data?.balance || 0,
      });
    } catch (e) {
      console.error('Failed to load profile:', e);
      setError('Failed to load profile');
    }
  };

  const avatar = require('../../../assets/images/logo.jpg');

  return (
    <Screen>
      <TopBar onSearch={() => {}} onProfile={() => {}} />
      <ScrollView>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1">
              <Image source={avatar} style={{ width: 72, height: 72, borderRadius: 36, marginRight: spacing.md }} />
              <View className="flex-1">
                <AppText variant="sectionTitle" weight="bold" numberOfLines={1}>{profile?.name || user?.name || 'User'}</AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>{profile?.email || user?.email || ''}</AppText>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('EditProfile')}
              style={{ marginLeft: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.full || 999, ...{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:4, elevation:2 } }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.success} />
            </Pressable>
          </View>

          {/* Wallet Balance Card */}
          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            style={{ marginTop: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, backgroundColor: colors.brand }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <AppText variant="caption" weight="medium" style={{ color: colors.onBrand, marginBottom: spacing.xs }}>Wallet Balance</AppText>
                <AppText variant="xl" weight="bold" style={{ color: colors.onBrand }}>₹{profile?.walletBalance?.toFixed(2) || '0.00'}</AppText>
              </View>
              <MaterialCommunityIcons name="wallet" size={40} color={colors.onBrand} />
            </View>
            <View className="mt-4 flex-row items-center">
              <AppText variant="caption" style={{ color: colors.onBrand, opacity: 0.9, marginRight: spacing.sm }}>Tap to manage wallet</AppText>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onBrand} />
            </View>
          </Pressable>

          {/* Stats */}
          <Card style={{ marginTop: spacing.lg }}>
            <View className="flex-row items-center justify-between">
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="book-open-outline" size={22} color={colors.textPrimary} />
                <AppText variant="body" weight="bold" style={{ marginTop: spacing.xs }}>{profile?.coursesEnrolled ?? 0}</AppText>
                <AppText variant="caption" color="textSecondary">Courses</AppText>
              </View>
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="clock-outline" size={22} color={colors.textPrimary} />
                <AppText variant="body" weight="bold" style={{ marginTop: spacing.xs }}>{Math.round((profile?.totalWatchTime ?? 0)/60)}m</AppText>
                <AppText variant="caption" color="textSecondary">Watch time</AppText>
              </View>
              <View className="items-center flex-1">
                <MaterialCommunityIcons name="check-circle-outline" size={22} color={colors.textPrimary} />
                <AppText variant="body" weight="bold" style={{ marginTop: spacing.xs }}>{profile?.completedLectures ?? 0}</AppText>
                <AppText variant="caption" color="textSecondary">Completed</AppText>
              </View>
            </View>
          </Card>

          {/* Links */}
          <Card style={{ marginTop: spacing.lg, overflow: 'hidden' }}>
            {[
              { icon:'account', label:'View Profile', onPress: () => navigation.navigate('EditProfile') },
              { icon:'wallet', label:'My Wallet', onPress: () => navigation.navigate('Wallet') },
              { icon:'playlist-play', label:'My Courses', onPress: () => navigation.navigate('MyCourses') },
              { icon:'cog-outline', label:'Settings', onPress: () => navigation.navigate('Settings') },
            ].map((item, index) => (
              <Pressable 
                key={item.label} 
                onPress={item.onPress} 
                className={`flex-row items-center p-4 ${index < 3 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}
              >
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.success} />
                <AppText variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>{item.label}</AppText>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
          </Card>

          {/* Logout Button */}
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
            style={{ marginTop: spacing.md, backgroundColor: colors.danger + '15', borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
            <AppText variant="body" weight="semibold" style={{ marginLeft: spacing.sm, color: colors.danger }}>Logout</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
