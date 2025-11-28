import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, TextInput, Pressable, Image } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { api } from '../../services/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorBanner from '../../components/ErrorBanner';

export default function SearchScreen({ navigation }) {
  const { spacing, colors, shadows } = useTheme();
  const handleBack = navigation.canGoBack() ? () => navigation.goBack() : undefined;
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load search data:', e);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }, [courses, query]);

  const renderItem = ({ item }) => (
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
        })
      }
    >
      <Card
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 90,
            height: 60,
            borderRadius: spacing.xs,
            overflow: 'hidden',
            backgroundColor: colors.border,
            marginRight: spacing.md,
          }}
        >
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="semibold" numberOfLines={2}>
            {item.title}
          </AppText>
          {item.description ? (
            <AppText
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={{ marginTop: spacing.xs }}
            >
              {item.description}
            </AppText>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <TopBar variant="search" title="Search" onBack={handleBack} />
      <ErrorBanner message={error} />
      <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg, flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: spacing.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              ...shadows.sm,
            }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textSecondary}
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              style={{ flex: 1, color: colors.textPrimary }}
              placeholder="Search for courses"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      </View>
    </Screen>
  );
}
