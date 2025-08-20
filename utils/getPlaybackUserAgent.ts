import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export function getPlaybackUserAgent(): string {
  if (Platform.OS === 'web') {
    // Browser UA (cannot be overridden from JS)
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'web-unknown';
  }

  // For tvOS, prefer returning an AppleCoreMedia-style UA to match AVPlayer
  if (Platform.OS === 'ios' && (Platform as any).isTV) {
    const osVersion = Device.osVersion ?? 'unknown';
    const iosVersionForUA = typeof osVersion === 'string' ? osVersion.replace(/\./g, '_') : 'unknown';
    return `AppleCoreMedia/1.0 (Apple TV; U; CPU OS ${iosVersionForUA} like Mac OS X; en_us)`;
  }

  const platform = Platform.OS === 'ios' ? 'Apple' : 'Android';
  const appVersion = Constants.manifest2?.extra?.expoClient?.version
    || Constants.expoConfig?.version
    || Constants.nativeAppVersion
    || 'unknown';
  const osName = Device.osName ?? Platform.OS;
  const osVersion = Device.osVersion ?? 'unknown';
  const model = Device.modelName ?? 'unknown';

  // Stable UA we control and can reuse across requests and players
  return `EmelTV/${appVersion} (${platform}; ${osName}; ${osVersion}; ${model}; TV=${Platform.isTV ? '1' : '0'})`;
}

export function getBackendDeviceParam(): 'apple' | 'android' {
  // We only target tvOS and Android TV
  return Platform.OS === 'ios' ? 'apple' : 'android';
}


