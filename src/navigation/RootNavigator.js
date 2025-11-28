import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Loading from '../components/Loading';
import { useTheme } from '../theme/ThemeProvider';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { CartProvider } from '../store/CartContext';
import HomeScreen from '../screens/Home/HomeScreen';
import CoursesScreen from '../screens/Courses/CoursesScreen';
import CourseDetailScreen from '../screens/Courses/CourseDetailScreen';
import MyCoursesScreen from '../screens/Courses/MyCoursesScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import WalletTopUpScreen from '../screens/Wallet/WalletTopUpScreen';
import CartScreen from '../screens/CartScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Home: 'home-outline',
            Courses: 'playlist-play',
            MyCourses: 'book-open-variant',
            Search: 'magnify',
            Account: 'account-circle-outline',
          };
          const name = map[route.name] || 'circle-outline';
          return <MaterialCommunityIcons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={CoursesScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: 'My Learning' }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="WalletTopUp" component={WalletTopUpScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={ProfileScreen} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function InnerRoot() {
  const { loading, token } = useAuth();
  if (loading) return <Loading text="Loading" />;
  return token ? <AppStack /> : <AuthStack />;
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <CartProvider>
        <InnerRoot />
      </CartProvider>
    </AuthProvider>
  );
}

