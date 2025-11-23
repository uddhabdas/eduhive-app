import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, FlatList, Pressable, Image, useColorScheme, TextInput } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import ErrorBanner from '../../components/ErrorBanner';
import Loading from '../../components/Loading';

export default function ExploreScreen({ navigation }) {
  const scheme = useColorScheme();
  const { spacing, colors, shadows } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const areas = ['Island', 'Province', 'Districts'];

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Load courses as institutions
      const coursesRes = await api.get('/api/courses');
      const allCourses = coursesRes.data || [];
      
      // Group courses by source or use as institutions
      const institutionsList = allCourses.map((course, index) => ({
        _id: course._id || `inst-${index}`,
        name: course.title || 'Institution',
        rating: 4.1 + (index % 3) * 0.2, // Mock rating
        reviewCount: 300 + index * 50,
        category: course.description?.split(' ')[0] || 'General',
        description: course.description || 'Educational institution offering quality courses.',
        thumbnailUrl: course.thumbnailUrl,
        area: areas[index % areas.length], // Mock area
      }));

      setCourses(institutionsList);
    } catch (e) {
      console.error('Failed to load explore data:', e);
      setError('Failed to load explore content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q)
      );
    }
    
    // Apply area filter
    if (selectedArea) {
      filtered = filtered.filter(course => course.area === selectedArea);
    }
    
    return filtered;
  }, [courses, searchQuery, selectedArea]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const renderCourseCard = ({ item }) => (
    <Pressable
      className="bg-white dark:bg-neutral-900 rounded-xl p-3 mb-3"
      style={{ 
        ...shadows.md,
      }}
      onPress={() => {
        if (item._id && item._id.startsWith('inst-') === false) {
          navigation.navigate('CourseDetail', {
            id: item._id,
            title: item.name,
            thumbnailUrl: item.thumbnailUrl,
            description: item.description,
          });
        }
      }}
    >
      <View className="flex-row">
        <View className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg items-center justify-center mr-3">
          {item.thumbnailUrl ? (
            <Image 
              source={{ uri: item.thumbnailUrl }} 
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="school" size={32} color={colors.textSecondary} />
          )}
        </View>
        <View className="flex-1">
          <AppText variant="body" weight="bold" style={{ marginBottom: 4 }} numberOfLines={1}>
            {item.name}
          </AppText>
          <View className="flex-row items-center mb-1">
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: spacing.xs }}>
              {item.rating.toFixed(1)} ({item.reviewCount})
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ marginBottom: spacing.xs }}>
            {item.category}
          </AppText>
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {item.description}
          </AppText>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <Screen>
        <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      <ErrorBanner message={error} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <AppText variant="sectionTitle" weight="bold">{getGreeting()}</AppText>
              <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>{user?.name || 'User'}</AppText>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success + '20' }}>
              <MaterialCommunityIcons name="account" size={20} color={colors.success} />
            </View>
          </View>

          <View className="flex-row items-center mb-5 gap-2">
            <View className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 flex-row items-center" style={{ ...shadows.sm }}>
              <TextInput
                className="flex-1 text-neutral-900 dark:text-white"
                placeholder="Search"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ fontSize: 15 }}
              />
            </View>
            <Pressable className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: colors.info }}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.onPrimary} />
            </Pressable>
            <Pressable className="w-11 h-11 bg-white dark:bg-neutral-900 rounded-full items-center justify-center">
              <MaterialCommunityIcons name="filter-variant" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {filteredCourses.length > 0 && (
            <View className="mb-5">
              <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>Popular Courses</AppText>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filteredCourses.slice(0, 5)}
                keyExtractor={(item) => `popular-${item._id}`}
                renderItem={({ item }) => (
                  <Pressable style={{ width: 180, marginRight: spacing.md }} onPress={() => {
                    if (item._id && !item._id.startsWith('inst-')) {
                      navigation.navigate('CourseDetail', {
                        id: item._id,
                        title: item.name,
                        thumbnailUrl: item.thumbnailUrl,
                        description: item.description,
                      });
                    }
                  }}>
                    <Card style={{ padding: 0 }}>
                      {item.thumbnailUrl ? (
                        <Image source={{ uri: item.thumbnailUrl }} className="w-full h-28 rounded-t-xl" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-28 rounded-t-xl items-center justify-center" style={{ backgroundColor: colors.border }}>
                          <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={{ padding: spacing.sm }}>
                        <AppText variant="body" weight="bold" style={{ marginBottom: spacing.xs }} numberOfLines={1}>{item.name}</AppText>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="star" size={12} color={colors.warning} />
                          <AppText variant="caption" color="textSecondary" style={{ marginLeft: spacing.xs }}>{item.rating.toFixed(1)}</AppText>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                )}
                contentContainerStyle={{ paddingRight: spacing.lg }}
              />
            </View>
          )}

          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <AppText variant="sectionTitle" weight="bold">All Courses</AppText>
              <Pressable onPress={() => setShowFilter(!showFilter)}>
                <MaterialCommunityIcons name="filter-variant" size={18} color={showFilter ? colors.info : colors.textSecondary} />
              </Pressable>
            </View>

            {showFilter && (
              <View className="mb-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                <AppText variant="caption" weight="bold">Area</AppText>
                <View className="flex-row flex-wrap gap-2">
                  {areas.map((area) => (
                    <Pressable key={area} onPress={() => { setSelectedArea(selectedArea === area ? null : area); }} className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900">
                      <AppText variant="caption" weight="semibold" style={{ color: selectedArea === area ? colors.info : colors.textPrimary }}>{area}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {filteredCourses.length === 0 ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                <MaterialCommunityIcons name="book-open-variant-outline" size={48} color={colors.textSecondary} />
                <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>No courses found</AppText>
              </View>
            ) : (
              <FlatList data={filteredCourses} keyExtractor={(item) => `course-${item._id}`} renderItem={renderCourseCard} scrollEnabled={false} />
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

