import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartBar } from '@/components/cart-bar';
import { FoodTile } from '@/components/food-tile';
import { StoreCard } from '@/components/store-card';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { stores, type MenuItem, type Store } from '@/data/catalog';
import { useCart } from '@/lib/cart';
import { formatUsd } from '@/lib/format';

const SUGGESTIONS = ['Manoushe zaatar', 'Shawarma', 'Knefeh', 'Water gallon', 'Burger'];

type DishHit = { store: Store; item: MenuItem };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const { storeHits, dishHits } = useMemo(() => {
    if (trimmed.length < 2) return { storeHits: [], dishHits: [] as DishHit[] };

    const storeMatches = stores.filter((store) =>
      [store.name, store.tagline, store.area].some((field) =>
        field.toLowerCase().includes(trimmed),
      ),
    );

    const dishMatches: DishHit[] = stores.flatMap((store) =>
      store.menu
        .flatMap((section) => section.items)
        .filter((item) =>
          [item.name, item.description].some((field) => field.toLowerCase().includes(trimmed)),
        )
        .map((item) => ({ store, item })),
    );

    return { storeHits: storeMatches, dishHits: dishMatches };
  }, [trimmed]);

  const empty = trimmed.length >= 2 && storeHits.length === 0 && dishHits.length === 0;

  return (
    <View className="flex-1 bg-paper">
      <View
        className="border-b border-stone bg-paper px-4 pb-4"
        style={{ paddingTop: insets.top + 12 }}>
        <View
          className="w-full self-center"
          style={{ maxWidth: MaxContentWidth }}>
          <Text className="mb-3 text-2xl font-extrabold text-ink">Search</Text>
          <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-stone bg-surface px-4">
            <Ionicons name="search" size={18} color={Brand.muted} />
            <TextInput
              className="h-full flex-1 text-sm text-ink"
              value={query}
              onChangeText={setQuery}
              placeholder="Stores, dishes, groceries…"
              placeholderTextColor={Brand.muted}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={Brand.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: itemCount > 0 ? 96 : 24,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        {trimmed.length < 2 ? (
          <View className="px-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
              Popular searches
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => setQuery(suggestion)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <View className="rounded-full border border-stone bg-surface px-4 py-2">
                    <Text className="text-sm text-ink">{suggestion}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text className="mb-3 mt-8 text-xs font-bold uppercase tracking-wide text-muted">
              Browse all
            </Text>
            <View className="gap-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </View>
          </View>
        ) : empty ? (
          <View className="items-center px-10 pt-16">
            <Text className="text-5xl">🔍</Text>
            <Text className="mt-4 text-center text-base font-bold text-ink">
              Nothing matches “{query.trim()}”
            </Text>
            <Text className="mt-1 text-center text-sm text-muted">
              Try a dish name, a store, or a neighbourhood.
            </Text>
          </View>
        ) : (
          <View className="gap-3 px-4">
            {storeHits.length > 0 ? (
              <>
                <Text className="text-xs font-bold uppercase tracking-wide text-muted">Stores</Text>
                {storeHits.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </>
            ) : null}

            {dishHits.length > 0 ? (
              <>
                <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">
                  Dishes
                </Text>
                {dishHits.map(({ store, item }) => (
                  <Link
                    key={`${store.id}-${item.id}`}
                    href={{ pathname: '/store/[id]', params: { id: store.id } }}
                    asChild>
                    <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                      <View className="flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-3">
                        <FoodTile emoji={item.emoji} accent={store.accent} size={56} radius={14} />
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text className="text-xs text-muted" numberOfLines={1}>
                            {store.name} · {store.area}
                          </Text>
                        </View>
                        <Text className="text-sm font-extrabold text-ink">
                          {formatUsd(item.priceUsd)}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      <CartBar />
    </View>
  );
}
