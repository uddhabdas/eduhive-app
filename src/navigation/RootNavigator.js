import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { CartProvider } from '../store/CartContext';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ExploreScreen from '../screens/Home/ExploreScreen';
import CoursesScreen from '../screens/Courses/CoursesScreen';
import MyCoursesScreen from '../screens/Courses/MyCoursesScreen';
import CourseDetailScreen from '../screens/Courses/CourseDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CartScreen from '../screens/Cart/CartScreen';
import AboutCourseScreen from '../screens/Courses/AboutCourseScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import WalletTopUpScreen from '../screens/Wallet/WalletTopUpScreen';

const Stack = createNativeStackNavigator();

function StackRoutes() {
  const { token } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Explore" component={ExploreScreen} />
          <Stack.Screen name="Courses" component={CoursesScreen} />
          <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
          <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="AboutCourse" component={AboutCourseScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="WalletTopUp" component={WalletTopUpScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaProvider>
          <StackRoutes />
          <StatusBar />
        </SafeAreaProvider>
      </CartProvider>
    </AuthProvider>
  );
}