import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartBar } from '@/components/cart-bar';
import { FoodTile } from '@/components/food-tile';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { getStore, type MenuItem } from '@/data/catalog';
import { useCart } from '@/lib/cart';
import { formatDistance, formatEta, formatLbp, formatUsd } from '@/lib/format';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const store = getStore(id);

  if (!store) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-paper px-8">
        <Text className="text-5xl">🤷</Text>
        <Text className="text-center text-base font-bold text-ink">Store not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm font-bold text-flame">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: cart.itemCount > 0 ? 110 : 32,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <View
          className="items-center px-4 pb-6"
          style={{ paddingTop: insets.top + 12, backgroundColor: `${store.accent}1A` }}>
          <View className="w-full flex-row justify-start">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="chevron-back" size={20} color={Brand.ink} />
              </View>
            </Pressable>
          </View>

          <FoodTile emoji={store.emoji} accent={store.accent} size={96} radius={24} />
          <Text className="mt-3 text-center text-2xl font-extrabold text-ink">{store.name}</Text>
          <Text className="mt-1 text-center text-sm text-muted">{store.tagline}</Text>

          <View className="mt-4 w-full flex-row items-center justify-around rounded-2xl bg-surface px-3 py-3">
            <Stat icon="star" tint={Brand.saffron} value={store.rating.toFixed(1)} label={`${store.ratingCount} ratings`} />
            <Divider />
            <Stat icon="time-outline" value={formatEta(store.etaMinutes)} label="Delivery" />
            <Divider />
            <Stat icon="bicycle-outline" value={formatUsd(store.deliveryFeeUsd)} label="Fee" />
            <Divider />
            <Stat icon="location-outline" value={formatDistance(store.distanceKm)} label={store.area.split(',')[0]} />
          </View>

          {store.closed ? (
            <View className="mt-3 w-full flex-row items-center gap-2 rounded-2xl bg-ink px-4 py-3">
              <Ionicons name="moon-outline" size={16} color={Brand.paper} />
              <Text className="flex-1 text-xs text-paper">
                Closed right now — schedule an order for tomorrow at 9:00 AM.
              </Text>
            </View>
          ) : null}

          {store.promo ? (
            <View className="mt-3 w-full flex-row items-center gap-2 rounded-2xl bg-cedar/10 px-4 py-3">
              <Ionicons name="pricetag" size={14} color={Brand.cedar} />
              <Text className="text-xs font-bold text-cedar">{store.promo}</Text>
            </View>
          ) : null}
        </View>

        <Text className="px-4 pt-5 text-[11px] text-muted">
          Minimum order {formatUsd(store.minOrderUsd)} · prices in fresh USD
        </Text>

        {store.menu.map((section) => (
          <View key={section.id} className="mt-5">
            <Text className="px-4 pb-3 text-lg font-extrabold text-ink">{section.title}</Text>
            <View className="gap-3 px-4">
              {section.items.map((item) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  accent={store.accent}
                  quantity={cart.quantityOf(store.id, item.id)}
                  onAdd={() => cart.add(store.id, item)}
                  onChange={(quantity) => cart.setQuantity(item.id, quantity)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <CartBar />
    </View>
  );
}

function MenuRow({
  item,
  accent,
  quantity,
  onAdd,
  onChange,
}: {
  item: MenuItem;
  accent: string;
  quantity: number;
  onAdd: () => void;
  onChange: (quantity: number) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-3">
      <FoodTile emoji={item.emoji} accent={accent} size={64} radius={16} />

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-ink" numberOfLines={1}>
            {item.name}
          </Text>
          {item.popular ? (
            <View className="rounded-full bg-flame/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-flame">Popular</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs leading-4 text-muted" numberOfLines={2}>
          {item.description}
        </Text>
        <View className="mt-1 flex-row items-baseline gap-2">
          <Text className="text-sm font-extrabold text-ink">{formatUsd(item.priceUsd)}</Text>
          <Text className="text-[11px] text-muted">{formatLbp(item.priceUsd)}</Text>
        </View>
      </View>

      <QuantityStepper quantity={quantity} onAdd={onAdd} onChange={onChange} />
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
  tint = Brand.ink,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint?: string;
}) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Ionicons name={icon} size={14} color={tint} />
      <Text className="text-xs font-extrabold text-ink">{value}</Text>
      <Text className="text-[10px] text-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-8 w-px bg-stone" />;
}
