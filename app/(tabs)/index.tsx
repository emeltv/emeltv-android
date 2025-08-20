import { StyleSheet, View, TouchableOpacity, Platform, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import * as Network from 'expo-network';
import { EventHandlingDemo } from '@/components/EventHandlingDemo';
import { useScale } from '@/hooks/useScale';
import VideoPlayer from '@/components/VideoPlayer';
import { getPlaybackUserAgent, getBackendDeviceParam } from '@/utils/getPlaybackUserAgent';

export default function FocusDemoScreen() {
  const styles = useFocusDemoScreenStyles();
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const scaleValue = useSharedValue(0.5);
  const opacityValue = useSharedValue(1);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamUrl = async () => {
      let ip = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData?.ip ?? '';
      } catch {
        try {
          ip = await Network.getIpAddressAsync();
        } catch {}
      }
      const device = getBackendDeviceParam();
      const ua = getPlaybackUserAgent();
      setUserAgent(ua);

      const headers: Record<string, string> = {
        'X-Client-IP': ip ?? '',
      };
      // Browsers block setting User-Agent; only set on native
      if (Platform.OS !== 'web') {
        headers['User-Agent'] = ua;
      }

      try {
        const response = await fetch(
          `https://emeltv-backend.vercel.app/stream-url?device=${device}`,
          {
            method: 'GET',
            headers,
          }
        );

        const data = await response.json();
        setStreamUrl(data.stream_url ?? null);
      } catch (err) {
        console.error('Failed to fetch stream URL:', err);
      }
    };

    fetchStreamUrl();
  }, []);
  useEffect(() => {
    // Animacija za logo mozemo staviti malo duze ako treba
    scaleValue.value = withTiming(2, {
      duration: 2000,
      easing: Easing.out(Easing.exp)
    });
    

    setTimeout(() => {
      opacityValue.value = withTiming(0, {
        duration: 1000,
        easing: Easing.out(Easing.exp),
      }, (finished) => {
        if (finished) {
          runOnJS(setShowSplash)(false);
          runOnJS(setIsVideoReady)(true);
          runOnJS(setIsPaused)(false);
        }
      });
    }, 2000);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value
    };
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[animatedStyle]}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <VideoPlayer 
          uri={streamUrl}
          userAgent={userAgent}
        />
      </View>
      {/* <EventHandlingDemo /> */}
    </>
  );
}

const useFocusDemoScreenStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    splashContainer: {
      flex: 1,
      backgroundColor: '#6AA658',
      justifyContent: 'center',
      alignItems: 'center',
    },
    splashImage: {
      width: 200 * scale,
      height: 200 * scale,
    },
    headerImage: {
      color: '#808080',
      bottom: -45 * scale,
      left: 0,
      position: 'absolute',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8 * scale,
    },
    container: { 
      flex: 1, 
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backgroundVideo: { 
      flex: 1,
      width: '100%',
    },
    playButton: {
      padding: 20 * scale,
      backgroundColor: '#333',
      borderRadius: 5 * scale,
    },
    playButtonText: {
      color: 'white',
      fontSize: 16 * scale,
    },
    errorContainer: {
      padding: 20 * scale,
      backgroundColor: '#ffebee',
      borderRadius: 5 * scale,
    },
    errorText: {
      color: '#c62828',
      fontSize: 16 * scale,
    },
    bufferingContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -50 }, { translateY: -50 }],
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 20 * scale,
      borderRadius: 10 * scale,
      zIndex: 10,
    },
    bufferingText: {
      color: 'white',
      fontSize: 16 * scale,
    },
  });
};