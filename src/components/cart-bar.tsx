import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, MaxContentWidth } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { formatUsd } from '@/lib/format';

/**
 * Floating basket summary. Renders nothing when the basket is empty so screens
 * can drop it in unconditionally.
 */
export function CartBar({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { itemCount, subtotalUsd, store } = useCart();

  if (itemCount === 0) return null;

  return (
    <View
      className="absolute inset-x-0 px-4"
      style={{ bottom: bottomOffset + Math.max(insets.bottom, 12) }}
      pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/cart')}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        })}>
        <View className="h-14 flex-row items-center gap-3 rounded-2xl bg-ink px-4 shadow-lg">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-flame">
            <Text className="text-sm font-bold text-paper">{itemCount}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-paper">View basket</Text>
            {store ? (
              <Text className="text-[11px] text-paper/60" numberOfLines={1}>
                {store.name}
              </Text>
            ) : null}
          </View>
          <Text className="text-base font-extrabold text-paper">{formatUsd(subtotalUsd)}</Text>
          <Ionicons name="chevron-forward" size={18} color={Brand.paper} />
        </View>
      </Pressable>
    </View>
  );
}
