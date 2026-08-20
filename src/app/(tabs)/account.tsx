import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { formatPhone, LBP_PER_USD } from '@/lib/format';
import { isSupabaseConfigured, useSession } from '@/lib/session';

const ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string }[] = [
  { icon: 'location-outline', label: 'Addresses', detail: 'Gemmayze · Achrafieh' },
  { icon: 'card-outline', label: 'Payment', detail: 'Cash on delivery' },
  { icon: 'language-outline', label: 'Language', detail: 'English · العربية' },
  { icon: 'notifications-outline', label: 'Notifications', detail: 'On' },
  { icon: 'help-circle-outline', label: 'Help centre', detail: '' },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { phone, signOut } = useSession();

  const isGuest = phone === '+961000000';

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 32,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <Text className="px-4 text-2xl font-extrabold text-ink">Account</Text>

        <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-3xl border border-stone bg-surface p-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-flame/10">
            <Ionicons name="person" size={24} color={Brand.flame} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">
              {isGuest ? 'Guest' : 'Yallatlob customer'}
            </Text>
            <Text className="text-xs text-muted">
              {isGuest ? 'Not signed in' : phone ? formatPhone(phone) : ''}
            </Text>
          </View>
          <View className="rounded-full bg-saffron/20 px-3 py-1.5">
            <Text className="text-[11px] font-bold text-ember">Gold · 12 orders</Text>
          </View>
        </View>

        <View className="mx-4 mt-4 overflow-hidden rounded-3xl border border-stone bg-surface">
          {ROWS.map((row, index) => (
            <Pressable key={row.label} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View
                className={`flex-row items-center gap-3 px-4 py-4 ${
                  index === 0 ? '' : 'border-t border-stone'
                }`}>
                <Ionicons name={row.icon} size={19} color={Brand.ink} />
                <Text className="flex-1 text-sm font-medium text-ink">{row.label}</Text>
                {row.detail ? <Text className="text-xs text-muted">{row.detail}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={Brand.muted} />
              </View>
            </Pressable>
          ))}
        </View>

        <View className="mx-4 mt-4 rounded-3xl border border-stone bg-surface p-4">
          <Text className="text-xs font-bold uppercase tracking-wide text-muted">Backend</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View
              className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-cedar' : 'bg-saffron'}`}
            />
            <Text className="text-sm text-ink">
              {isSupabaseConfigured
                ? 'Supabase connected'
                : 'Demo mode — no Supabase credentials set'}
            </Text>
          </View>
          <Text className="mt-2 text-xs text-muted">
            Exchange rate {LBP_PER_USD.toLocaleString('en-US')} LL / $1
          </Text>
        </View>

        <Pressable
          className="mx-4 mt-4"
          accessibilityRole="button"
          onPress={signOut}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/5">
            <Ionicons name="log-out-outline" size={17} color={Brand.danger} />
            <Text className="text-sm font-bold text-danger">Sign out</Text>
          </View>
        </Pressable>

        <View className="mt-8 items-center gap-2 opacity-60">
          <BrandMark size={36} showWordmark={false} />
          <Text className="text-[11px] text-muted">Yallatlob v0.1.0 · Made in Beirut</Text>
        </View>
      </ScrollView>
    </View>
  );
}
