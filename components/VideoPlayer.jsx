import React, { useRef, useState, useEffect } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Video } from 'react-native-video'

// Platform-specific imports


const CrossPlatformVideoPlayer = ({ uri, userAgent }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Web-specific HLS setup
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeHls = async () => {
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        
        hlsRef.current = hls;
        
        hls.loadSource(uri);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                initializeHls();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari mostly)
        videoRef.current.src = uri;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
        });
      }
    };

    initializeHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [uri, userAgent]);

  const handleLoad = (meta) => {
    setLoading(false);
    setDuration(meta.duration);
  };

  const handleProgress = (data) => {
    const currentTime = Platform.OS === 'web' 
      ? videoRef.current?.currentTime 
      : data.currentTime;
    const duration = Platform.OS === 'web'
      ? videoRef.current?.duration
      : this.duration;
    
    if (currentTime && duration) {
      setProgress(currentTime / duration);
    }
  };

  const handleEnd = () => {
    setPaused(true);
    if (Platform.OS === 'web') {
      videoRef.current.currentTime = 0;
    } else {
      videoRef.current?.seek(0);
    }
  };

  const togglePlayPause = () => {
    if (Platform.OS === 'web') {
      if (paused) {
        videoRef.current.play().catch(e => console.error('Play error:', e));
      } else {
        videoRef.current.pause();
      }
    }
    setPaused(!paused);
  };

  const toggleFullscreen = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(e => {
          console.error('Fullscreen error:', e);
        });
      } else {
        document.exitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  const seekForward = () => {
    if (Platform.OS === 'web') {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 15
      );
    } else {
      videoRef.current?.seek(Math.min(duration, (progress * duration) + 15));
    }
  };

  const seekBackward = () => {
    if (Platform.OS === 'web') {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - 15
      );
    } else {
      videoRef.current?.seek(Math.max(0, (progress * duration) - 15));
    }
  };

  // Web-specific event listeners
  useEffect(() => {
    if (Platform.OS !== 'web' || !videoRef.current) return;

    const video = videoRef.current;
    
    const handleTimeUpdate = () => handleProgress();
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnd);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnd);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreenContainer]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      
      {Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          style={fullscreen ? styles.fullscreenVideo : styles.video}
          playsInline
          preload="auto"
          onClick={togglePlayPause}
        />
      ) : (
        <Video
          ref={videoRef}
          source={{ uri, headers: { 'User-Agent': userAgent } }}
          style={fullscreen ? styles.fullscreenVideo : styles.video}
          paused={paused}
          resizeMode="contain"
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={(error) => console.error('Video error:', error)}
          controls={false}
          // Pass UA on Android TV via prop as well
          {...(Platform.OS === 'android' && userAgent ? { userAgent } : {})}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 30000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000
          }}
        />
      )}

      {/* Custom Controls */}
      <View style={styles.controlsOverlay}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={togglePlayPause}
        >
          <Icon 
            name={paused ? 'play-arrow' : 'pause'} 
            size={40} 
            color="white" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={seekBackward}
        >
          <Icon name="replay-10" size={30} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={seekForward}
        >
          <Icon name="forward-10" size={30} color="white" />
        </TouchableOpacity>
        
        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleFullscreen}
          >
            <Icon 
              name={fullscreen ? 'fullscreen-exit' : 'fullscreen'} 
              size={30} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  controlButton: {
    marginHorizontal: 10,
    padding: 10,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'red',
  },
});

export default CrossPlatformVideoPlayer;