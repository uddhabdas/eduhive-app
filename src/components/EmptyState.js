import React from 'react';
import { View } from 'react-native';
import AppText from './atoms/AppText';
import AppButton from './atoms/AppButton';
import { useTheme } from '../theme/ThemeProvider';

export default function EmptyState({ title, subtitle, onPrimary, onSecondary, primaryText, secondaryText }) {
  const { spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.lg, width: '100%' }}>
      <AppText variant="sectionTitle" weight="bold">{title}</AppText>
      {subtitle ? <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>{subtitle}</AppText> : null}
      <View style={{ marginTop: spacing.md, width: '100%' }}>
        {primaryText ? <AppButton title={primaryText} onPress={onPrimary} /> : null}
        {secondaryText ? <View style={{ marginTop: spacing.sm }}><AppButton title={secondaryText} onPress={onSecondary} /></View> : null}
      </View>
    </View>
  );
}
