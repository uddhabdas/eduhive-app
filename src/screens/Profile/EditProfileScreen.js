import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import AppButton from '../../components/atoms/AppButton';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { setAuthToken } from '../../services/client';

export default function EditProfileScreen({ navigation, route }) {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const { spacing, colors } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/api/me');
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating profile:', { name: formData.name.trim(), email: formData.email.trim() });
      const res = await api.put('/api/me', {
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      
      console.log('Profile update response:', res.data);
      
      // Update auth context
      if (updateUser) {
        await updateUser();
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      let errorMsg = 'Failed to update profile';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMsg = 'Profile endpoint not found. Please contact support.';
        } else if (status === 409) {
          errorMsg = data?.error || 'This email is already in use.';
        } else if (status === 400) {
          errorMsg = data?.error || 'Invalid data. Please check your input.';
        } else {
          errorMsg = data?.error || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        errorMsg = error.message || 'Network error. Please try again.';
      }
      
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <TopBar onSearch={() => {}} onProfile={() => {}} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar onSearch={() => {}} onProfile={() => {}} />
      <ScrollView>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>Personal Information</AppText>
            <View style={{ marginBottom: spacing.md }}>
              <AppText variant="caption" weight="medium" color="textSecondary" style={{ marginBottom: spacing.xs }}>Name</AppText>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-base border border-neutral-200 dark:border-neutral-700"
                autoCapitalize="words"
              />
            </View>
            <View style={{ marginBottom: spacing.md }}>
              <AppText variant="caption" weight="medium" color="textSecondary" style={{ marginBottom: spacing.xs }}>Email</AppText>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-base border border-neutral-200 dark:border-neutral-700"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </Card>
          <AppButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} />
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.md, backgroundColor: colors.border, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' }}>
            <AppText variant="body" weight="semibold" color="textSecondary">Cancel</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

