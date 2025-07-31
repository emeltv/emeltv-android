import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
// import { View } from 'react-native-reanimated/lib/typescript/Animated';



export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <div >This screen doesn't exist.</div>
        <Link href="/" style={styles.link}>
          <div >Go to home screen!</div>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
