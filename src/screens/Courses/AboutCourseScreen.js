import React from 'react';
import { View, Image, ScrollView } from 'react-native';
import Screen from '../../components/layout/Screen';
import TopBar from '../../components/layout/TopBar';
import AppText from '../../components/atoms/AppText';
import { useTheme } from '../../theme/ThemeProvider';

export default function AboutCourseScreen({ route, navigation }) {
  const { title, description, thumbnailUrl, about, highlights } = route.params || {};
  const cleanTitle = (title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
  const { spacing, colors, radii } = useTheme();
  return (
    <Screen>
      <TopBar variant="inner" title={cleanTitle || 'Course'} onBack={() => navigation.goBack()} />
      <ScrollView className="flex-1">
        <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
          {thumbnailUrl ? (
            <Image 
              source={{ uri: thumbnailUrl }} 
              style={{ width: '100%', aspectRatio: 16/9, borderRadius: radii.lg }} 
              resizeMode="cover"
              defaultSource={require('../../../assets/images/logo.jpg')}
            />
          ) : (
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: radii.lg, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="caption" color="textSecondary">No thumbnail</AppText>
            </View>
          )}
          
          <AppText variant="pageTitle" weight="extrabold" style={{ marginTop: spacing.lg }}>{cleanTitle}</AppText>

          {description && (
            <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
              {description}
            </AppText>
          )}

          {about && (
            <View style={{ marginTop: spacing.lg }}>
              <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.sm }}>About this course</AppText>
              <AppText variant="body" color="textSecondary">{about}</AppText>
            </View>
          )}

          {highlights && Array.isArray(highlights) && highlights.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.md }}>What you’ll learn</AppText>
              {highlights.map((highlight, index) => (
                <View key={index} className="flex-row items-start" style={{ marginBottom: spacing.sm }}>
                  <AppText variant="body" color="success" style={{ marginRight: spacing.sm }}>•</AppText>
                  <AppText variant="body" color="textSecondary" style={{ flex: 1 }}>{highlight}</AppText>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.sm }}>Roadmap</AppText>
            <AppText variant="caption" color="textSecondary">Course roadmap and progression details are available in the lectures section.</AppText>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.sm }}>Lectures</AppText>
            <AppText variant="caption" color="textSecondary">Browse lectures from the course detail screen.</AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
