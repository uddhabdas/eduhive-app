import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
// Using expo-av for now (will migrate to expo-video in future SDK)
// Note: expo-av is deprecated but still works in current SDK
import { Video } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LocalVideoPlayer({ uri, start = 0, onTick, onEnded, onReady, style }) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSeekedInitially, setHasSeekedInitially] = useState(false);
  const [status, setStatus] = useState(null);

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
        onLoad={(s) => {
          setIsReady(true);
          // Seek once to saved progress when the video loads
          if (!hasSeekedInitially && start > 0 && videoRef.current) {
            try {
              videoRef.current.setPositionAsync(start * 1000);
            } catch {}
            setHasSeekedInitially(true);
          }
          setStatus(s);
          onReady && onReady(s);
        }}
        onPlaybackStatusUpdate={(s) => {
          setStatus(s);
          if (s.didJustFinish) {
            onEnded && onEnded({
              duration: s.durationMillis ? s.durationMillis / 1000 : 0,
            });
          }
        }}
      />

      {/* Custom controls overlay */}
      {isReady && status && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'rgba(0,0,0,0.45)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={async () => {
              const pos = status.positionMillis || 0;
              const next = Math.max(0, pos - 10000);
              try {
                await videoRef.current?.setPositionAsync(next);
              } catch {}
            }}
            style={{ padding: 6 }}
          >
            <MaterialCommunityIcons name="rewind-10" size={22} color="#FFF" />
          </Pressable>

          <Pressable
            onPress={async () => {
              try {
                if (status.isPlaying) {
                  await videoRef.current?.pauseAsync();
                } else {
                  await videoRef.current?.playAsync();
                }
              } catch {}
            }}
            style={{ padding: 6 }}
          >
            <MaterialCommunityIcons
              name={status.isPlaying ? 'pause-circle' : 'play-circle'}
              size={32}
              color="#FFF"
            />
          </Pressable>

          <Pressable
            onPress={async () => {
              const pos = status.positionMillis || 0;
              const dur = status.durationMillis || 0;
              const next = Math.min(dur, pos + 10000);
              try {
                await videoRef.current?.setPositionAsync(next);
              } catch {}
            }}
            style={{ padding: 6 }}
          >
            <MaterialCommunityIcons name="fast-forward-10" size={22} color="#FFF" />
          </Pressable>

          <Pressable
            onPress={() => videoRef.current?.presentFullscreenPlayer?.()}
            style={{ padding: 6 }}
            accessibilityLabel="Enter full screen"
          >
            <MaterialCommunityIcons name="fullscreen" size={22} color="#FFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
