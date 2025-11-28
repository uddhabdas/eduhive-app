import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, FlatList, RefreshControl, Image, Pressable } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import AppButton from '../../components/atoms/AppButton';
import Card from '../../components/atoms/Card';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';

export default function MyCoursesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const { spacing, colors, radii } = useTheme();
  const handleBack = navigation.canGoBack() ? () => navigation.goBack() : undefined;

  const loadCourses = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const purchasesRes = await api.get('/api/purchases');
      const purchased = Array.isArray(purchasesRes.data) ? purchasesRes.data : [];

      const purchasedCourses = purchased
        .map((p) => {
          if (p.courseId && typeof p.courseId === 'object') return p.courseId;
          return p.courseId;
        })
        .filter(Boolean);

      if (purchasedCourses.length === 0) {
        setCourses([]);
        return;
      }

      const courseDetails = await Promise.all(
        purchasedCourses.map(async (course) => {
          if (course && typeof course === 'object' && course.title) return course;
          try {
            const courseId = course._id || course;
            const res = await api.get(`/api/courses/${courseId}`);
            return res.data;
          } catch (e) {
            console.warn('Failed to fetch course:', course, e?.message || e);
            return null;
          }
        })
      );

      const validCourses = courseDetails.filter(Boolean);

      // Fetch per-course progress summaries
      const withProgress = await Promise.all(
        validCourses.map(async (course) => {
          try {
            const res = await api.get(`/api/progress/course/${course._id}`);
            return { ...course, _progress: res.data?.summary || null };
          } catch (e) {
            console.warn('Failed to load progress for course', course._id, e?.message || e);
            return { ...course, _progress: null };
          }
        })
      );

      setCourses(withProgress);
    } catch (e) {
      console.error('Failed to load purchased courses:', e);
      console.error('Error details:', e.response?.data);
      setError('Failed to load your courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const totalCount = courses.length;

  const renderCourseItem = ({ item }) => {
    const summary = item._progress || {};
    const percent = Math.max(0, Math.min(1, summary.percent ?? 0));
    const percentText = `${Math.round(percent * 100)}%`;
    const instructor = item.instructor || item.author || 'Instructor';

    return (
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <Pressable
          onPress={() =>
            navigation.navigate('CourseDetail', {
              id: item._id,
              title: item.title,
              thumbnailUrl: item.thumbnailUrl,
              description: item.description,
              sourcePlaylistId: item.sourcePlaylistId,
              price: item.price,
              isPaid: item.isPaid,
              mode: 'learn',
            })
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 90, height: 60, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.border, marginRight: spacing.md }}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="semibold" numberOfLines={2}>{item.title}</AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{instructor}</AppText>
              <View style={{ marginTop: spacing.xs, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
                <View style={{ width: `${percent * 100}%`, height: '100%', backgroundColor: colors.brand }} />
              </View>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{percent > 0 ? `${percentText} complete` : 'Not started'}</AppText>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <TopBar variant="learning" title="My Learning" onBack={handleBack} />
        <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg }}>
          <AppText variant="pageTitle" weight="extrabold" style={{ marginBottom: spacing.md }}>
            My Learning
          </AppText>
          {/* Simple loading skeletons */}
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              style={{
                height: 80,
                marginBottom: spacing.md,
                backgroundColor: colors.border,
              }}
            />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar variant="learning" title="My Learning" onBack={handleBack} />
      <ErrorBanner message={error} />
      <FlatList
        data={courses}
        keyExtractor={(item) => `mycourse-${item._id || Math.random()}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={<View style={{ height: spacing.lg }} />}
        renderItem={renderCourseItem}
        ListEmptyComponent={
          totalCount === 0 ? (
            <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
              <EmptyState
                title="No courses yet"
                subtitle="Purchase courses to start learning"
                primaryText="Browse Courses"
                onPrimary={() => navigation.navigate('Courses')}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </Screen>
  );
}
