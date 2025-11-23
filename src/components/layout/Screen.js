import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function Screen({ children }) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {children}
      </View>
    </SafeAreaView>
  );
}