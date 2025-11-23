import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { setColorScheme } from 'nativewind';
import { themeTokens } from './theme';

const ThemeContext = createContext(null);
const TokensContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system');
  const [resolved, setResolved] = useState(Appearance.getColorScheme?.() || 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener?.(({ colorScheme }) => setResolved(colorScheme || 'light'));
    (async () => {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) setMode(saved);
    })();
    return () => sub?.remove?.();
  }, []);

  const effective = mode === 'system' ? resolved : mode;

  const setTheme = async (next) => {
    setMode(next);
    await AsyncStorage.setItem('theme_mode', next);
    if (next !== 'system') {
      setResolved(next);
    }
  };

  useEffect(() => {
    try {
      setColorScheme(effective);
    } catch {}
  }, [effective]);

  const palette = effective === 'dark' ? themeTokens.colors.dark : themeTokens.colors.light;
  const value = useMemo(() => ({ mode, effective, setTheme }), [mode, effective]);
  const tokens = useMemo(() => ({
    colors: palette,
    spacing: themeTokens.spacing,
    radii: themeTokens.radii,
    typography: themeTokens.typography,
    shadows: themeTokens.shadows,
  }), [palette]);
  return (
    <ThemeContext.Provider value={value}>
      <TokensContext.Provider value={tokens}>{children}</TokensContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}

export function useTheme() {
  const ctx = useContext(TokensContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}