import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Image, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../services/client';
import LocalVideoPlayer from '../../components/LocalVideoPlayer';
import TopBar from '../../components/layout/TopBar';
import AppButton from '../../components/atoms/AppButton';
import AppText from '../../components/atoms/AppText';
import Card from '../../components/atoms/Card';
import { useTheme } from '../../theme/ThemeProvider';
import ErrorBanner from '../../components/ErrorBanner';
import Loading from '../../components/Loading';
import { formatDuration, useDebounce } from '../../utils/helpers';
import { getCourseMeta } from '../../data/courseMeta';
import { useCart } from '../../store/CartContext';

function ProgressRing({ percent, size = 60, colors }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percent, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.success}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text className="text-xs font-bold text-neutral-900 dark:text-white">
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}
function LectureListItem({ item, index, onPress, progress, colors }) {
  const isCompleted = !!(progress && progress.completed);
  const hasProgress = !!(progress && progress.position > 0 && progress.duration > 0);
  const percent = hasProgress ? Math.min(1, Math.max(0, (progress.position / progress.duration))) : 0;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 border-b border-neutral-200 dark:border-neutral-800`}
    >
      <Text className="w-6 text-xs text-neutral-500 dark:text-neutral-400">{index + 1}.</Text>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={2}>
            {item.title}
          </Text>
          <View className="flex-row items-center ml-3">
            {item.duration ? (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mr-2">
                {formatDuration(Number(item.duration) || 0)}
              </Text>
            ) : null}
            {isCompleted ? (
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            ) : null}
          </View>
        </View>
        {item.type ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{item.type}</Text>
        ) : null}
        {hasProgress ? (
          <View style={{ marginTop: 6, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View style={{ width: `${percent * 100}%`, height: '100%', backgroundColor: colors.brand }} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function CourseDetailScreen({ route, navigation }) {
  const { id, title, thumbnailUrl, description, sourcePlaylistId, mode: routeMode } = route.params;
  const cleanTitle = title || '';
  const { add } = useCart();
  const { colors, spacing, shadows } = useTheme();
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressItems, setProgressItems] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [autoSkipTries, setAutoSkipTries] = useState(0);
  const [courseDetails, setCourseDetails] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const progressRes = await api.get(`/api/progress/course/${id}`);
      setProgressSummary(progressRes.data.summary);
      setProgressItems(progressRes.data.items);
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      // Try to get full course details from admin API (if available) or use basic info
      const [courseRes, purchasedRes, walletRes] = await Promise.all([
        api.get(`/api/courses/${id}`).catch((err) => {
          console.warn('Failed to load course details:', err);
          return { data: null };
        }),
        api.get(`/api/courses/${id}/purchased`).catch(() => ({ data: { purchased: false } })),
        api.get('/api/wallet/balance').catch(() => ({ data: { balance: 0 } })),
      ]);
      
      if (courseRes.data) {
        setCourseDetails(courseRes.data);
      } else {
        // Fallback to route params if API fails
        setCourseDetails({
          _id: id,
          title: title,
          description: description,
          thumbnailUrl: thumbnailUrl,
          isPaid: false,
          price: 0,
        });
      }
      setPurchased(purchasedRes.data.purchased || false);
      setWalletBalance(walletRes.data.balance || 0);
    } catch (e) {
      console.error('Failed to load course details:', e);
    }
  };

  const handlePurchase = async () => {
    if (purchasing) return;

    if (!courseDetails) {
      Alert.alert('Error', 'Course details not loaded. Please try again.');
      return;
    }

    // Free course – enroll directly without wallet/cart
    if (!courseDetails.isPaid || courseDetails.price <= 0) {
      try {
        setPurchasing(true);
        await api.post(`/api/courses/${id}/purchase`);
        await loadCourseDetails();
        Alert.alert('Enrolled', 'This free course has been added to My Courses.');
      } catch (e) {
        const msg = e?.response?.data?.error || 'Failed to enroll in free course';
        Alert.alert('Enrollment Failed', msg);
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // Re-check purchased status before attempting purchase
    try {
      const purchasedCheck = await api.get(`/api/courses/${id}/purchased`);
      if (purchasedCheck.data?.purchased) {
        Alert.alert('Already Purchased', 'You have already purchased this course.');
        await loadCourseDetails(); // Refresh UI
        return;
      }
    } catch (e) {
      console.warn('Failed to check purchase status:', e);
    }

    if (purchased) {
      Alert.alert('Already Purchased', 'You have already purchased this course.');
      return;
    }

    // Re-check wallet balance
    try {
      const walletRes = await api.get('/api/wallet/balance');
      const currentBalance = walletRes.data?.balance || 0;
      if (currentBalance < courseDetails.price) {
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${courseDetails.price.toFixed(2)} but only have ₹${currentBalance.toFixed(2)} in your wallet.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
          ]
        );
        return;
      }
    } catch (e) {
      console.warn('Failed to check wallet balance:', e);
    }

    if (walletBalance < courseDetails.price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${courseDetails.price.toFixed(2)} but only have ₹${walletBalance.toFixed(2)} in your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('WalletTopUp') },
        ]
      );
      return;
    }

    Alert.alert(
      'Purchase Course',
      `Purchase "${cleanTitle || title}" for ₹${courseDetails.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            // Prevent double-clicking
            if (purchasing) {
              return;
            }
            
            setPurchasing(true);
            try {
              console.log('Attempting purchase for course:', id);
              const response = await api.post(`/api/courses/${id}/purchase`);
              
              // Explicitly check response status
              if (response.status >= 200 && response.status < 300) {
                // Success - reload course details and show success
                console.log('Purchase successful:', response.data);
                // Immediately update purchased state
                setPurchased(true);
                // Update wallet balance from response
                if (response.data?.newBalance !== undefined) {
                  setWalletBalance(response.data.newBalance);
                }
                await loadCourseDetails();
                Alert.alert('Success', 'Course purchased successfully!');
              } else {
                // Unexpected status code
                const errorMsg = response.data?.error || 'Purchase failed. Please try again.';
                console.error('Unexpected status:', response.status, response.data);
                Alert.alert('Purchase Failed', errorMsg);
              }
            } catch (e) {
              console.error('Purchase error:', e);
              console.error('Error response:', e.response?.data);
              console.error('Error status:', e.response?.status);
              console.error('Error config:', e.config);
              
              // Handle different error types
              let errorMsg = 'Failed to purchase course';
              
              if (e.response) {
                // Server responded with error
                const status = e.response.status;
                const data = e.response.data;
                
                if (status === 400) {
                  // Specific 400 error messages
                  errorMsg = data?.error || 'Purchase failed. Please check your wallet balance or if the course is already purchased.';
                } else if (status === 404) {
                  errorMsg = data?.error || 'Course or user not found.';
                } else {
                  errorMsg = data?.error || `Server error (${status})`;
                }
              } else if (e.request) {
                // Request made but no response
                errorMsg = 'No response from server. Please check your connection.';
              } else {
                // Error setting up request
                errorMsg = e.message || 'Network error. Please try again.';
              }
              
              Alert.alert('Purchase Failed', errorMsg);
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const loadLectures = async () => {
    setError(null);
    try {
      const lecRes = await api.get(`/api/courses/${id}/lectures`);
      setLectures(lecRes.data);
      
      // Load progress
      await loadProgress();

      // If no lectures and has playlist, we'll sync on first play via onReady
      if (lecRes.data.length === 0 && sourcePlaylistId) {
        // no-op; player will sync once ready
      } else if (lecRes.data.length > 0) {
        // Try to get next lecture
        try {
          const nextRes = await api.get(`/api/progress/next/${id}`);
          const nextLecture = lecRes.data.find((l) => l._id === nextRes.data.lectureId);
          setSelected(nextLecture || lecRes.data[0]);
        } catch {
          setSelected(lecRes.data[0]);
        }
      }
    } catch (e) {
      if (e.response?.status === 403) {
        setError('You need to purchase this course to access lectures');
        setLectures([]);
      } else {
        setError('Failed to load course');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistReady = useCallback(async ({ videoId, duration, playlist }) => {
    // Sync playlist to server
    if (playlist && playlist.length > 0 && !syncing) {
      setSyncing(true);
      try {
        const items = playlist.map((vid, idx) => ({
          videoId: vid,
          title: `Video ${idx + 1}`,
          orderIndex: idx + 1,
          duration: idx === 0 ? duration : 0,
        }));

        await api.post(`/api/courses/${id}/sync-from-player`, {
          playlistId: sourcePlaylistId,
          items,
        });

        // Reload lectures
        const lecRes = await api.get(`/api/courses/${id}/lectures`);
        setLectures(lecRes.data);
        if (lecRes.data.length > 0) {
          setSelected(lecRes.data[0]);
        }
      } catch (e) {
        console.error('Failed to sync playlist:', e);
      } finally {
        setSyncing(false);
      }
    }
  }, [id, sourcePlaylistId, syncing]);

  const handleTick = useCallback(async ({ position, duration, videoId }) => {
    if (!selected) return;
    
    try {
      await api.post('/api/progress/upsert', {
        courseId: id,
        lectureId: selected._id,
        videoId,
        position,
        duration,
      });
      
      // Reload progress
      await loadProgress();
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [selected, id, loadProgress]);

  const debouncedHandleTick = useDebounce(handleTick, 2000);

  const handleEnded = useCallback(async ({ videoId, duration }) => {
    if (!selected) return;

    try {
      await api.post('/api/progress/upsert', {
        courseId: id,
        lectureId: selected._id,
        videoId,
        position: duration,
        duration,
      });

      await loadProgress();

      // Auto-advance to next lecture
      try {
        const nextRes = await api.get(`/api/progress/next/${id}`);
        const nextLecture = lectures.find((l) => l._id === nextRes.data.lectureId);
        if (nextLecture) setSelected(nextLecture);
      } catch {}
    } catch (e) {
      console.error('Failed to mark as complete:', e);
    }
  }, [selected, id, loadProgress, lectures]);

  const handleContinueWatching = useCallback(async () => {
    try {
      const nextRes = await api.get(`/api/progress/next/${id}`);
      const nextLecture = lectures.find((l) => l._id === nextRes.data.lectureId);
      if (nextLecture) {
        setSelected(nextLecture);
      }
    } catch (e) {
      console.error('Failed to get next lecture:', e);
    }
  }, [id, lectures]);

  useEffect(() => {
    loadCourseDetails();
    if (routeMode === 'learn') {
      loadLectures();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, routeMode]);

  const getProgressForLecture = useCallback((lectureId) => {
    const target = typeof lectureId === 'string' ? lectureId : (lectureId && lectureId.toString());
    return progressItems.find((p) => (typeof p.lectureId === 'string' ? p.lectureId : p.lectureId?.toString()) === target);
  }, [progressItems]);

  if (loading) return <Loading />;

  const meta = getCourseMeta({ id, title });
  if (!meta && __DEV__) {
    console.warn(
      `[courseMeta] Missing entry for course "${cleanTitle || title}" (${id}). ` +
      `Add one in app/src/data/courseMeta.js, for example:\n` +
      `  '${id}': { about: '...', highlights: ['...'], audience: '...' }`
    );
  }
  const aboutText = meta?.about || description || `Master the fundamentals of ${cleanTitle || title}. Learn by doing with practical examples and clear explanations.`;
  const highlights = Array.isArray(meta?.highlights) ? meta.highlights : [
    'Clear, structured lessons focused on outcomes',
    'Hands‑on practice and guided examples',
    'Best practices you can apply immediately',
  ];
  const audience = meta?.audience || 'Beginners and intermediates looking for a fast, curated path.';

  if (routeMode === 'preview') {
    const price = Number(courseDetails?.price || 0);
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark">
        <TopBar variant="inner" title={cleanTitle || 'Course'} onBack={() => navigation.goBack()} onCart={() => navigation.navigate('Cart')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View className="px-4 pt-4 pb-2">
            <View className="rounded-2xl overflow-hidden" style={{ aspectRatio: 16/9, ...shadows.md }}>
              {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }}>
                  <MaterialCommunityIcons name="book-open-variant" size={40} color={colors.textSecondary} />
                </View>
              )}
              <LinearGradient colors={["transparent","rgba(0,0,0,0.35)"]} style={{ position:'absolute', left:0, right:0, bottom:0, height:60 }} />
            </View>
          </View>
          <View className="px-4">
            <AppText variant="pageTitle" weight="extrabold">{cleanTitle}</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.sm, lineHeight: 20 }}>{aboutText}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg }}>
              <View style={{ backgroundColor: price > 0 ? colors.brand : colors.success, borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...shadows.sm }}>
                <AppText variant="body" weight="bold" style={{ color: colors.onBrand }}>{price > 0 ? `₹${price.toFixed(2)}` : 'Free'}</AppText>
              </View>
              <View style={{ width: spacing.md }} />
              <Pressable onPress={() => add({ ...(courseDetails || { _id: id, title, thumbnailUrl }), price })} style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, ...shadows.sm }}>
                <AppText variant="body" weight="semibold">Add to Cart</AppText>
              </Pressable>
              <View style={{ width: spacing.sm }} />
              <Pressable onPress={handlePurchase} style={{ backgroundColor: colors.brand, borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, ...shadows.md }}>
                <AppText variant="body" weight="semibold" style={{ color: colors.onBrand }}>Buy Now</AppText>
              </Pressable>
            </View>
          </View>
          <View className="px-4" style={{ marginTop: spacing.md }}>
            <Card style={{ padding: spacing.md }}>
              <AppText variant="caption" color="textSecondary">Purchase this course to unlock lectures</AppText>
            </Card>
          </View>
          <View className="px-4" style={{ marginTop: spacing.xl }}>
            <AppText variant="lg" weight="bold">Highlights</AppText>
            {highlights.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                <AppText variant="body" style={{ marginLeft: spacing.sm }}>{h}</AppText>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <TopBar variant="inner" title={cleanTitle || 'Course details'} onBack={() => navigation.goBack()} onCart={() => navigation.navigate('Cart')} />
      {purchased && routeMode === 'learn' && !!error ? <ErrorBanner message={error} /> : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View className="px-4 pt-4 pb-2">
          <View className="rounded-2xl overflow-hidden" style={{ aspectRatio: 16/9, ...shadows.md }}>
            {selected?.videoUrl ? (
              <LocalVideoPlayer
                uri={selected.videoUrl}
                start={(getProgressForLecture(selected._id)?.position) || 0}
                onReady={() => {}}
                onTick={debouncedHandleTick}
                onEnded={handleEnded}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }}>
                <MaterialCommunityIcons name="play-circle" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>
        </View>
        <View className="px-4 pb-2">
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12 }}>
            <Pressable style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center' }}>
              <AppText variant="body" weight="semibold">Lectures</AppText>
            </Pressable>
            <Pressable style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center' }}>
              <AppText variant="body" color="textSecondary">More</AppText>
            </Pressable>
          </View>
        </View>
        <View className="px-4 pb-4">
          <AppText variant="sectionTitle" weight="extrabold" style={{ marginBottom: spacing.sm }}>
            Lectures ({lectures.length})
          </AppText>
          <Card style={{ overflow: 'hidden' }}>
            {lectures.map((item, idx) => (
              <LectureListItem
                key={item._id}
                item={item}
                index={idx}
                onPress={() => {
                  const firstIncomplete = progressItems.find((p) => !p.completed);
                  if (firstIncomplete) {
                    const targetIdx = lectures.findIndex((l) => l._id === item._id);
                    const firstIdx = lectures.findIndex((l) => l._id === firstIncomplete.lectureId);
                    if (targetIdx > firstIdx) {
                      const { Alert } = require('react-native');
                      Alert.alert('Locked', 'Finish the current stage (watch 90%) to unlock next.');
                      return;
                    }
                  }
                  setSelected(item);
                }}
                progress={getProgressForLecture(item._id)}
                colors={colors}
              />
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
