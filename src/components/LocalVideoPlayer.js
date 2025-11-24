import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
// Using expo-av for now (will migrate to expo-video in future SDK)
// Note: expo-av is deprecated but still works in current SDK
import { Video } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LocalVideoPlayer({ uri, start = 0, onTick, onEnded, onReady, style }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSeekedInitially, setHasSeekedInitially] = useState(false);

  // Reset initial seek flag when source changes
  useEffect(() => {
    setHasSeekedInitially(false);
  }, [uri]);

  // Poll position periodically for progress tracking
  useEffect(() => {
    let interval;
    if (isReady && onTick) {
      interval = setInterval(async () => {
        try {
          const status = await videoRef.current?.getStatusAsync();
          if (status?.isLoaded) {
            onTick({
              position: status.positionMillis / 1000,
              duration: status.durationMillis ? status.durationMillis / 1000 : 0,
            });
          }
        } catch {}
      }, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [isReady, onTick]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!isReady && (
        <ActivityIndicator
          color="#10B981"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
        />
      )}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }, style]}
        resizeMode="contain"
        shouldPlay
        useNativeControls
        onLoad={(status) => {
          setIsReady(true);
          // Seek once to saved progress when the video loads
          if (!hasSeekedInitially && start > 0 && videoRef.current) {
            try {
              videoRef.current.setPositionAsync(start * 1000);
            } catch {}
            setHasSeekedInitially(true);
          }
          onReady && onReady(status);
        }}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            onEnded && onEnded({
              duration: status.durationMillis ? status.durationMillis / 1000 : 0,
            });
          }
        }}
      />
      {isReady && (
        <View style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 20 }}>
          <Pressable
            onPress={() => videoRef.current?.presentFullscreenPlayer?.()}
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 16,
              padding: 6,
            }}
            accessibilityLabel="Enter full screen"
          >
            <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
