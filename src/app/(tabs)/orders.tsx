import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartBar } from '@/components/cart-bar';
import { FoodTile } from '@/components/food-tile';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { ACTIVE_STEPS, orders, type Order } from '@/data/orders';
import { useCart } from '@/lib/cart';
import { formatUsd } from '@/lib/format';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  const active = orders.find((order) => order.status === 'on_the_way' || order.status === 'preparing');
  const past = orders.filter((order) => order !== active);

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: itemCount > 0 ? 96 : 24,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <Text className="px-4 text-2xl font-extrabold text-ink">Orders</Text>

        {active ? <ActiveOrderCard order={active} /> : null}

        <Text className="mb-3 mt-7 px-4 text-xs font-bold uppercase tracking-wide text-muted">
          Past orders
        </Text>

        <View className="gap-3 px-4">
          {past.map((order) => (
            <PastOrderRow key={order.id} order={order} />
          ))}
        </View>
      </ScrollView>

      <CartBar />
    </View>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const currentStep = ACTIVE_STEPS.findIndex((step) => step.status === order.status);

  return (
    <View className="mx-4 mt-4 overflow-hidden rounded-3xl border border-stone bg-surface">
      <View className="flex-row items-center gap-3 bg-cedar px-4 py-3">
        <Ionicons name="bicycle" size={18} color={Brand.paper} />
        <Text className="flex-1 text-sm font-bold text-paper">
          {order.courierName} is on the way
        </Text>
        <Text className="text-sm font-extrabold text-paper">{order.etaMinutes} min</Text>
      </View>

      <View className="flex-row items-center gap-3 p-4">
        <FoodTile emoji={order.emoji} accent={order.accent} size={56} radius={14} />
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{order.storeName}</Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {order.itemSummary}
          </Text>
        </View>
        <Text className="text-base font-extrabold text-ink">{formatUsd(order.totalUsd)}</Text>
      </View>

      <View className="flex-row px-4 pb-2">
        {ACTIVE_STEPS.map((step, index) => {
          const done = index <= currentStep;
          return (
            <View key={step.status} className="flex-1 items-center gap-1.5">
              <View className="w-full flex-row items-center">
                <View className={`h-0.5 flex-1 ${index === 0 ? 'bg-transparent' : done ? 'bg-cedar' : 'bg-stone'}`} />
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-cedar' : 'bg-stone'}`}>
                  <Ionicons
                    name={step.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={done ? Brand.paper : Brand.muted}
                  />
                </View>
                <View
                  className={`h-0.5 flex-1 ${
                    index === ACTIVE_STEPS.length - 1
                      ? 'bg-transparent'
                      : index < currentStep
                        ? 'bg-cedar'
                        : 'bg-stone'
                  }`}
                />
              </View>
              <Text
                className={`text-center text-[10px] leading-3 ${done ? 'font-bold text-ink' : 'text-muted'}`}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row gap-2 p-4 pt-3">
        <Pressable className="flex-1" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-stone">
            <Ionicons name="call-outline" size={15} color={Brand.ink} />
            <Text className="text-sm font-bold text-ink">Call courier</Text>
          </View>
        </Pressable>
        <Pressable className="flex-1" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View className="h-11 flex-row items-center justify-center gap-2 rounded-xl bg-ink">
            <Ionicons name="map-outline" size={15} color={Brand.paper} />
            <Text className="text-sm font-bold text-paper">Track live</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const STATUS_TONE: Record<string, { label: string; className: string }> = {
  delivered: { label: 'Delivered', className: 'bg-cedar/10 text-cedar' },
  cancelled: { label: 'Cancelled', className: 'bg-danger/10 text-danger' },
};

function PastOrderRow({ order }: { order: Order }) {
  const tone = STATUS_TONE[order.status];

  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-3">
      <FoodTile emoji={order.emoji} accent={order.accent} size={52} radius={14} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm font-bold text-ink" numberOfLines={1}>
            {order.storeName}
          </Text>
          {tone ? (
            <View className={`rounded-full px-2 py-0.5 ${tone.className.split(' ')[0]}`}>
              <Text className={`text-[10px] font-bold ${tone.className.split(' ')[1]}`}>
                {tone.label}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {order.itemSummary}
        </Text>
        <Text className="text-[11px] text-muted">
          {order.placedAt} · {order.code} · {formatUsd(order.totalUsd)}
        </Text>
      </View>
      <Link href={{ pathname: '/store/[id]', params: { id: order.storeId } }} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reorder from ${order.storeName}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View className="rounded-full border border-flame px-3 py-1.5">
            <Text className="text-xs font-bold text-flame">Reorder</Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
