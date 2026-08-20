import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { FoodTile } from '@/components/food-tile';
import { Brand } from '@/constants/theme';
import type { Store } from '@/data/catalog';
import { formatDistance, formatEta, formatUsd } from '@/lib/format';

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={{ pathname: '/store/[id]', params: { id: store.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={store.name}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        <View className="flex-row gap-4 rounded-3xl border border-stone bg-surface p-4">
          <View>
            <FoodTile emoji={store.emoji} accent={store.accent} size={84} radius={20} />
            {store.closed ? (
              <View className="absolute inset-0 items-center justify-center rounded-[20px] bg-ink/65">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-paper">
                  Closed
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-1 justify-center gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-base font-bold text-ink" numberOfLines={1}>
                {store.name}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={12} color={Brand.saffron} />
                <Text className="text-xs font-bold text-ink">{store.rating.toFixed(1)}</Text>
                <Text className="text-xs text-muted">({store.ratingCount.toLocaleString('en-US')})</Text>
              </View>
            </View>

            <Text className="text-xs text-muted" numberOfLines={1}>
              {store.tagline}
            </Text>

            <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <Meta icon="time-outline" text={formatEta(store.etaMinutes)} />
              <Meta icon="bicycle-outline" text={formatUsd(store.deliveryFeeUsd)} />
              <Meta icon="location-outline" text={formatDistance(store.distanceKm)} />
            </View>

            {store.promo ? (
              <View className="mt-1 self-start rounded-full bg-cedar/10 px-2 py-1">
                <Text className="text-[11px] font-bold text-cedar">{store.promo}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={12} color={Brand.muted} />
      <Text className="text-xs text-muted">{text}</Text>
    </View>
  );
}
