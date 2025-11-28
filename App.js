import 'react-native-gesture-handler';
import './tailwind.css';
import React from 'react';
import { Text, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import RootNavigator from './src/navigation/RootNavigator';



export default function App() {
  if (!Text.defaultProps) Text.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
  Text.defaultProps.maxFontSizeMultiplier = 1.2;
  if (!TextInput.defaultProps) TextInput.defaultProps = {};
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.maxFontSizeMultiplier = 1.2;
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
