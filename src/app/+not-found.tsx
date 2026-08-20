import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-paper px-10">
      <Text className="text-6xl">🛵</Text>
      <Text className="text-center text-lg font-bold text-ink">This page took a wrong turn</Text>
      <Link href="/">
        <Text className="text-sm font-bold text-flame">Go to home</Text>
      </Link>
    </View>
  );
}
