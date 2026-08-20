import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodTile } from '@/components/food-tile';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { formatEta, formatLbp, formatUsd } from '@/lib/format';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash on delivery', icon: 'cash-outline' },
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'whish', label: 'Whish Money', icon: 'phone-portrait-outline' },
] as const;

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const [payment, setPayment] = useState<string>('cash');
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return <OrderPlaced onDone={() => router.dismissTo('/')} />;
  }

  return (
    <View className="flex-1 bg-paper">
      <View
        className="flex-row items-center gap-3 border-b border-stone px-4 pb-3"
        style={{ paddingTop: insets.top + 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close basket"
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View className="h-10 w-10 items-center justify-center rounded-full border border-stone bg-surface">
            <Ionicons name="close" size={20} color={Brand.ink} />
          </View>
        </Pressable>
        <Text className="text-xl font-extrabold text-ink">Your basket</Text>
        {cart.itemCount > 0 ? (
          <Pressable
            className="ml-auto"
            accessibilityRole="button"
            onPress={cart.clear}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text className="text-sm font-bold text-danger">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {cart.itemCount === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Text className="text-6xl">🛵</Text>
          <Text className="text-center text-lg font-bold text-ink">Your basket is empty</Text>
          <Text className="text-center text-sm text-muted">
            Add something from a store near you and it will show up here.
          </Text>
          <View className="mt-2 w-full">
            <Button label="Browse stores" onPress={() => router.dismissTo('/')} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 24,
              maxWidth: MaxContentWidth,
              width: '100%',
              alignSelf: 'center',
            }}>
            {cart.store ? (
              <View className="mx-4 flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-3">
                <FoodTile emoji={cart.store.emoji} accent={cart.store.accent} size={48} radius={12} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">{cart.store.name}</Text>
                  <Text className="text-xs text-muted">
                    {cart.store.area} · {formatEta(cart.store.etaMinutes)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="mt-4 gap-3 px-4">
              {cart.lines.map((line) => (
                <View
                  key={line.itemId}
                  className="flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-3">
                  <FoodTile
                    emoji={line.emoji}
                    accent={cart.store?.accent ?? Brand.flame}
                    size={52}
                    radius={13}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                      {line.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatUsd(line.unitPriceUsd)} each
                    </Text>
                  </View>
                  <Text className="text-sm font-extrabold text-ink">
                    {formatUsd(line.unitPriceUsd * line.quantity)}
                  </Text>
                  <QuantityStepper
                    quantity={line.quantity}
                    onAdd={() => cart.setQuantity(line.itemId, 1)}
                    onChange={(quantity) => cart.setQuantity(line.itemId, quantity)}
                  />
                </View>
              ))}
            </View>

            <Text className="px-4 pb-2 pt-7 text-xs font-bold uppercase tracking-wide text-muted">
              Payment
            </Text>
            <View className="mx-4 overflow-hidden rounded-3xl border border-stone bg-surface">
              {PAYMENT_METHODS.map((method, index) => {
                const active = payment === method.id;
                return (
                  <Pressable
                    key={method.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPayment(method.id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <View
                      className={`flex-row items-center gap-3 px-4 py-4 ${
                        index === 0 ? '' : 'border-t border-stone'
                      }`}>
                      <Ionicons name={method.icon} size={18} color={Brand.ink} />
                      <Text className="flex-1 text-sm text-ink">{method.label}</Text>
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={active ? Brand.flame : Brand.muted}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View className="mx-4 mt-5 gap-2 rounded-3xl border border-stone bg-surface p-4">
              <Row label="Subtotal" value={formatUsd(cart.subtotalUsd)} />
              <Row label="Delivery fee" value={formatUsd(cart.deliveryFeeUsd)} />
              <View className="my-1 h-px bg-stone" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-ink">Total</Text>
                <View className="items-end">
                  <Text className="text-base font-extrabold text-ink">
                    {formatUsd(cart.totalUsd)}
                  </Text>
                  <Text className="text-[11px] text-muted">{formatLbp(cart.totalUsd)}</Text>
                </View>
              </View>
            </View>

            {!cart.meetsMinimum && cart.store ? (
              <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-2xl bg-saffron/15 px-4 py-3">
                <Ionicons name="alert-circle-outline" size={16} color={Brand.ember} />
                <Text className="flex-1 text-xs text-ink/80">
                  Add {formatUsd(cart.store.minOrderUsd - cart.subtotalUsd)} more to reach the{' '}
                  {formatUsd(cart.store.minOrderUsd)} minimum.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View
            className="border-t border-stone bg-surface px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="w-full self-center" style={{ maxWidth: MaxContentWidth }}>
              <Button
                label="Place order"
                trailing={`· ${formatUsd(cart.totalUsd)}`}
                disabled={!cart.meetsMinimum}
                onPress={() => setPlaced(true)}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-ink">{value}</Text>
    </View>
  );
}

function OrderPlaced({ onDone }: { onDone: () => void }) {
  const cart = useCart();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-paper px-10">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-cedar/10">
        <Ionicons name="checkmark" size={40} color={Brand.cedar} />
      </View>
      <Text className="text-center text-2xl font-extrabold text-ink">Order placed</Text>
      <Text className="text-center text-sm leading-5 text-muted">
        {cart.store?.name} is preparing your order. You&apos;ll get an SMS when the courier picks it
        up.
      </Text>
      <View className="mt-4 w-full">
        <Button
          label="Back to home"
          onPress={() => {
            cart.clear();
            onDone();
          }}
        />
      </View>
    </View>
  );
}
