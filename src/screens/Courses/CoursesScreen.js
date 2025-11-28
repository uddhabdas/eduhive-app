import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, ScrollView, useColorScheme, Pressable, Dimensions } from 'react-native';
import { api } from '../../services/client';
import CourseCard from '../../components/CourseCard';
import { SkeletonCourseCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import SearchBar from '../../components/SearchBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import { useTheme } from '../../theme/ThemeProvider';

export default function CoursesScreen({ navigation }) {
  const scheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [allRes, recRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/courses/recommended').catch(() => ({ data: [] })),
      ]);
      setCourses(allRes.data);
      setRecommended(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (e) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title?.toLowerCase().includes(q));
  }, [courses, debouncedQuery]);

  const recommendedToShow = useMemo(() => {
    const list = (recommended || []).filter((c) => !debouncedQuery || c.title?.toLowerCase().includes(debouncedQuery.toLowerCase()));
    return list.slice(0, 4);
  }, [recommended, debouncedQuery]);
  const allCourses = useMemo(() => filtered, [filtered]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await api.post('/api/seed/demo-courses');
      await load();
    } catch (e) {
      setError('Failed to load demo courses');
    } finally {
      setSeeding(false);
    }
  };

  const renderGridItem = ({ item }) => (
    <CourseCard
      course={item}
      width={gridItemWidth}
      onPress={async () => {
        try {
          const res = await api.get(`/api/courses/${item._id}/purchased`).catch(() => ({ data: { purchased: false } }));
          const purchased = !!res.data?.purchased;
          navigation.navigate('CourseDetail', {
            id: item._id,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            description: item.description,
            sourcePlaylistId: item.sourcePlaylistId,
            price: item.price,
            isPaid: item.isPaid,
            mode: purchased ? 'learn' : 'preview',
          });
        } catch {
          navigation.navigate('CourseDetail', {
            id: item._id,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            description: item.description,
            sourcePlaylistId: item.sourcePlaylistId,
            price: item.price,
            isPaid: item.isPaid,
            mode: 'preview',
          });
        }
      }}
    />
  );

  const { spacing, colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const gridItemWidth = Math.floor((screenWidth - spacing.lg * 2 - spacing.md) / 2);
  if (loading) {
    return (
      <Screen>
        <TopBar
          variant="featured"
          onCart={() => navigation.navigate('Cart')}
        />
        <View style={{ paddingTop: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <SkeletonCourseCard wide />
            <SkeletonCourseCard wide />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <SkeletonCourseCard />
            <SkeletonCourseCard />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar variant="featured" onCart={() => navigation.navigate('Cart')} />
      <ErrorBanner message={error} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Search Bar (toggled by header icon) */}
        {showSearch && (
          <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
            <SearchBar
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search courses..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}

        {allCourses.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl }}>
            <EmptyState
              title="No courses yet"
              subtitle="Seed demo data to get started."
              primaryText={seeding ? 'Loading...' : 'Load Demo Data'}
              onPrimary={handleSeedData}
            />
          </View>
        ) : (
          <>
            {/* Recommended Section */}
            {recommendedToShow.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                  <AppText variant="lg" weight="bold">Popular Courses</AppText>
                  <MaterialCommunityIcons name="star" size={18} color={colors.warning} />
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: spacing.lg }}
                  data={recommendedToShow}
                  keyExtractor={(item) => `rec-${item._id || Math.random()}`}
                  renderItem={({ item }) => (
                    <CourseCard
                      wide
                      course={item}
                      onPress={async () => {
                        try {
                          const res = await api.get(`/api/courses/${item._id}/purchased`).catch(() => ({ data: { purchased: false } }));
                          const purchased = !!res.data?.purchased;
                          navigation.navigate('CourseDetail', {
                            id: item._id,
                            title: item.title,
                            thumbnailUrl: item.thumbnailUrl,
                            description: item.description,
                            sourcePlaylistId: item.sourcePlaylistId,
                            price: item.price,
                            isPaid: item.isPaid,
                            mode: purchased ? 'learn' : 'preview',
                          });
                        } catch {
                          navigation.navigate('CourseDetail', {
                            id: item._id,
                            title: item.title,
                            thumbnailUrl: item.thumbnailUrl,
                            description: item.description,
                            sourcePlaylistId: item.sourcePlaylistId,
                            price: item.price,
                            isPaid: item.isPaid,
                            mode: 'preview',
                          });
                        }
                      }}
                    />
                  )}
                />
              </View>
            )}

            {/* All Courses Grid */}
            <View style={{ paddingBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <AppText variant="lg" weight="bold">All Courses</AppText>
                <AppText variant="xs" color="textSecondary">{allCourses.length} {allCourses.length === 1 ? 'course' : 'courses'}</AppText>
              </View>
              <FlatList
                numColumns={2}
                columnWrapperStyle={{ gap: spacing.md, marginBottom: spacing.md }}
                scrollEnabled={false}
                removeClippedSubviews={false}
                initialNumToRender={allCourses.length}
                data={allCourses}
                keyExtractor={(item, idx) => `grid-${item._id || idx}`}
                renderItem={renderGridItem}
                ListEmptyComponent={
                  <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="book-open-variant" size={48} color={colors.textSecondary} />
                    <AppText variant="sm" color="textSecondary">No courses found</AppText>
                  </View>
                }
              />
            </View>
          </>
        )}
        {/* FAB Refresh */}
        {!loading && (
          <Pressable
            onPress={() => { setRefreshing(true); load(); }}
            style={{ position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: spacing.xxl + spacing.xl, height: spacing.xxl + spacing.xl, backgroundColor: colors.brand, borderRadius: (spacing.xxl + spacing.xl) / 2, alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel="Refresh"
          >
            <MaterialCommunityIcons name="refresh" size={26} color={colors.onBrand} />
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
