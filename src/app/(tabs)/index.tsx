import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartBar } from '@/components/cart-bar';
import { FoodTile } from '@/components/food-tile';
import { StoreCard } from '@/components/store-card';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { categories, stores } from '@/data/catalog';
import { useCart } from '@/lib/cart';
import { formatEta } from '@/lib/format';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visibleStores = activeCategory
    ? stores.filter((store) => store.categoryIds.includes(activeCategory))
    : stores;

  const fastest = [...stores]
    .filter((store) => !store.closed)
    .sort((a, b) => a.etaMinutes - b.etaMinutes)
    .slice(0, 4);

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
        <View className="flex-row items-center justify-between px-4">
          <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flex: 1 })}>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Deliver to
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location" size={15} color={Brand.flame} />
              <Text className="text-base font-bold text-ink">Gemmayze, Beirut</Text>
              <Ionicons name="chevron-down" size={15} color={Brand.ink} />
            </View>
          </Pressable>

          <Link href="/cart" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Basket"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View className="h-11 w-11 items-center justify-center rounded-full border border-stone bg-surface">
                <Ionicons name="bag-handle-outline" size={20} color={Brand.ink} />
                {itemCount > 0 ? (
                  <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-flame px-1">
                    <Text className="text-[10px] font-bold text-paper">{itemCount}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </Link>
        </View>

        <Pressable
          className="mx-4 mt-4"
          accessibilityRole="search"
          accessibilityLabel="Search stores and dishes"
          onPress={() => router.push('/search')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-stone bg-surface px-4">
            <Ionicons name="search" size={18} color={Brand.muted} />
            <Text className="text-sm text-muted">Search for manakish, shawarma, pharmacy…</Text>
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {categories.map((category) => {
            const active = activeCategory === category.id;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={category.label}
                accessibilityState={{ selected: active }}
                onPress={() => setActiveCategory(active ? null : category.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View
                  className={`h-10 flex-row items-center gap-2 rounded-full border px-4 ${
                    active ? 'border-flame bg-flame' : 'border-stone bg-surface'
                  }`}>
                  <Text className="text-base">{category.emoji}</Text>
                  <Text
                    className={`text-sm font-bold ${active ? 'text-paper' : 'text-ink'}`}>
                    {category.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mx-4 mt-5 overflow-hidden rounded-3xl bg-flame p-5">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-paper/80">
            Ramadan kareem
          </Text>
          <Text className="mt-1 text-2xl font-extrabold leading-7 text-paper">
            Free delivery on{'\n'}iftar orders over $20
          </Text>
          <View className="mt-3 self-start rounded-full bg-paper px-3 py-1.5">
            <Text className="text-xs font-extrabold text-flame">Code IFTAR961</Text>
          </View>
          <Text className="absolute -bottom-3 -right-2 text-[110px] opacity-20">🌙</Text>
        </View>

        <SectionHeader title="Fastest near you" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {fastest.map((store) => (
            <Link
              key={store.id}
              href={{ pathname: '/store/[id]', params: { id: store.id } }}
              asChild>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                <View className="w-36 gap-2 rounded-3xl border border-stone bg-surface p-3">
                  <FoodTile emoji={store.emoji} accent={store.accent} size={112} radius={16} />
                  <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                    {store.name}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={12} color={Brand.muted} />
                    <Text className="text-[11px] text-muted">{formatEta(store.etaMinutes)}</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>

        <SectionHeader
          title={activeCategory ? categories.find((c) => c.id === activeCategory)!.label : 'All stores'}
          subtitle={`${visibleStores.filter((store) => !store.closed).length} open near you`}
        />
        <View className="gap-3 px-4">
          {visibleStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </View>
      </ScrollView>

      <CartBar />
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3 mt-7 px-4">
      <Text className="text-xl font-extrabold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
    </View>
  );
}
