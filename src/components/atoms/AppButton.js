import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

export default function AppButton({ title, onPress, disabled }) {
  const { radii, spacing, shadows, colors, typography } = useTheme();
  const container = {
    borderRadius: radii.md,
    minHeight: spacing.xl * 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadows.lg,
  };
  const gradientStyle = {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  };
  return (
    <Pressable onPress={onPress} disabled={!!disabled} style={container} accessibilityRole="button">
      <LinearGradient
        colors={[colors.brandAlt, colors.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gradientStyle}
      >
        <Text style={{ color: colors.onBrand, fontWeight: typography.weights.bold, fontSize: typography.sizes.base }}>
          {title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}