import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function Card({ children, style }) {
  const { radii, shadows, colors, spacing } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.md }, style]}>
      {children}
    </View>
  );
}