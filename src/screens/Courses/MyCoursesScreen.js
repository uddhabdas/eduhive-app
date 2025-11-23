import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ScrollView } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import CourseCard from '../../components/CourseCard';
import { api } from '../../services/client';
import { SkeletonCourseCard } from '../../components/Skeleton';
import Card from '../../components/atoms/Card';
import EmptyState from '../../components/EmptyState';

export default function MyCoursesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    setError(null);
    try {
      const purchasesRes = await api.get('/api/purchases');
      console.log('Purchases response:', purchasesRes.data);
      
      // The courseId is already populated by the server
      const purchasedCourses = purchasesRes.data
        .map((p) => {
          // If courseId is populated (object), use it directly
          if (p.courseId && typeof p.courseId === 'object') {
            return p.courseId;
          }
          // If courseId is just an ID string, we need to fetch it
          return p.courseId;
        })
        .filter(Boolean);
      
      if (purchasedCourses.length === 0) {
        setCourses([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch course details for courses that are just IDs
      const courseDetails = await Promise.all(
        purchasedCourses.map(async (course) => {
          // If it's already a full course object, return it
          if (course && typeof course === 'object' && course.title) {
            return course;
          }
          // Otherwise, fetch it
          try {
            const courseId = course._id || course;
            const res = await api.get(`/api/courses/${courseId}`);
            return res.data;
          } catch (e) {
            console.warn('Failed to fetch course:', course, e);
            return null;
          }
        })
      );

      const validCourses = courseDetails.filter(Boolean);
      console.log('Loaded courses:', validCourses.length);
      setCourses(validCourses);
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

  const { spacing, colors } = useTheme();
  if (loading) {
    return (
      <Screen>
        <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
        <View style={{ paddingTop: spacing.lg }}>
          <View className="flex-row gap-3">
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
      <TopBar onSearch={() => {}} onCart={() => navigation.navigate('Cart')} onProfile={() => navigation.navigate('Profile')} />
      {error ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Card style={{ backgroundColor: colors.danger + '15' }}>
            <AppText variant="caption" color="danger">{error}</AppText>
          </Card>
        </View>
      ) : null}
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <AppText variant="pageTitle" weight="extrabold">My Courses</AppText>
            <AppText variant="caption" color="textSecondary">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</AppText>
          </View>

          {courses.length === 0 ? (
            <EmptyState
              title="No courses yet"
              subtitle="Purchase courses to start learning"
              primaryText="Browse Courses"
              onPrimary={() => navigation.navigate('Courses')}
            />
          ) : (
            <FlatList
              numColumns={2}
              columnWrapperStyle={{ gap: spacing.md, marginBottom: spacing.md }}
              scrollEnabled={false}
              data={courses}
              keyExtractor={(item) => `mycourse-${item._id || Math.random()}`}
              renderItem={({ item }) => (
                <CourseCard
                  course={item}
                  onPress={() => navigation.navigate('CourseDetail', {
                    id: item._id,
                    title: item.title,
                    thumbnailUrl: item.thumbnailUrl,
                    description: item.description,
                    sourcePlaylistId: item.sourcePlaylistId,
                    price: item.price,
                    isPaid: item.isPaid,
                  })}
                />
              )}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

