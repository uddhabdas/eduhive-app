import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function AppText({ children, variant = 'body', weight = 'regular', color = 'textPrimary', style, numberOfLines }) {
  const { typography, colors } = useTheme();
  const sizeKey = typography.variants[variant] || variant;
  const fontSize = typography.sizes[sizeKey] || typography.sizes.base;
  const fontWeight = typography.weights[weight] || typography.weights.regular;
  const colorValue = colors[color] || colors.textPrimary;
  return (
    <Text style={[{ fontSize, fontWeight, color: colorValue }, style]} numberOfLines={numberOfLines} allowFontScaling={false} maxFontSizeMultiplier={1.2}>
      {children}
    </Text>
  );
}
