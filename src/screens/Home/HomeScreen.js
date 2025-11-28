import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { spacing } = useTheme();
  return (
    <Screen>
      <TopBar variant="featured" onCart={() => navigation?.navigate?.('Cart')} />
      <View style={{ paddingTop: spacing.lg }}>
        <AppText variant="xl" weight="extrabold">Welcome</AppText>
        {user ? (
          <AppText variant="base" weight="medium" color="textSecondary">Logged in as: {user.email}</AppText>
        ) : (
          <AppText variant="base" weight="medium" color="textSecondary">Fetching user...</AppText>
        )}
        <View style={{ height: spacing.lg }} />
        <AppButton title="Logout" onPress={logout} />
      </View>
    </Screen>
  );
}
