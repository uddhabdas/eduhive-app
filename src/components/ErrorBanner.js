// app/src/components/ErrorBanner.js
import React from 'react';
import Card from './atoms/Card';
import AppText from './atoms/AppText';
import { useTheme } from '../theme/ThemeProvider';

export default function ErrorBanner({ message, title = 'Something went wrong' }) {
  const { colors, spacing } = useTheme();

  if (!message) return null;

  return (
    <Card style={{ marginBottom: spacing.md, backgroundColor: '#FFF5F5' }}>
      <AppText variant="sectionTitle" color={colors.danger}>
        {title}
      </AppText>
      <AppText
        variant="caption"
        color={colors.textSecondary}
        style={{ marginTop: spacing.xs }}
      >
        {message}
      </AppText>
    </Card>
  );
}
