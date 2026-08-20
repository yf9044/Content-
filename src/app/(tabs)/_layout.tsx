import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, MaxContentWidth } from '@/constants/theme';
import { useCart } from '@/lib/cart';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home', activeIcon: 'home' },
  { name: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { name: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt' },
  { name: 'account', label: 'Account', icon: 'person-outline', activeIcon: 'person' },
] as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function AppTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  return (
    <View
      className="border-t border-stone bg-surface"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      <View
        className="w-full flex-row items-center justify-around self-center px-2 pt-2"
        style={{ maxWidth: MaxContentWidth }}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((entry) => entry.name === route.name);
          if (!tab) return null;

          const focused = state.index === index;
          const showBadge = tab.name === 'orders' && itemCount > 0;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              className="flex-1"
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View className="items-center gap-1 py-1">
                <View>
                  <Ionicons
                    name={focused ? tab.activeIcon : tab.icon}
                    size={22}
                    color={focused ? Brand.flame : Brand.muted}
                  />
                  {showBadge ? (
                    <View className="absolute -right-2 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1">
                      <Text className="text-[10px] font-bold text-paper">{itemCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  className={`text-[11px] ${focused ? 'font-bold text-flame' : 'font-medium text-muted'}`}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
