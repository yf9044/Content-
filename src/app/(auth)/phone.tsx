import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { isSupabaseConfigured, useSession } from '@/lib/session';

const SELLING_POINTS = [
  { icon: 'flash-outline', text: 'Manakish, shawarma and groceries in under 30 minutes' },
  { icon: 'cash-outline', text: 'Pay cash on delivery or card — prices in fresh USD and LL' },
  { icon: 'navigate-outline', text: 'Live courier tracking across Beirut and Mount Lebanon' },
] as const;

export default function PhoneEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestOtp, verifyOtp } = useSession();

  const [nationalNumber, setNationalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const digits = nationalNumber.replace(/\D/g, '');
  const phone = `+961${digits}`;
  const valid = digits.length >= 7;

  const handleContinue = async () => {
    setError('');
    if (!valid) {
      setError('Enter a valid Lebanese mobile number');
      return;
    }

    setLoading(true);
    try {
      await requestOtp(phone);
      router.push({ pathname: '/otp', params: { phone } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the code');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    try {
      await verifyOtp('+961000000', '000000');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start a guest session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled">
        <BrandMark size={52} />

        <View className="mt-10 gap-3">
          <Text className="text-[40px] font-extrabold leading-[44px] text-ink">
            Yalla,{'\n'}tlob.
          </Text>
          <Text className="text-base leading-6 text-muted">
            Lebanon&apos;s neighbourhood delivery app. Sign in with your phone number to get started.
          </Text>
        </View>

        <View className="mt-8 gap-3">
          {SELLING_POINTS.map((point) => (
            <View key={point.text} className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-flame/10">
                <Ionicons name={point.icon} size={17} color={Brand.flame} />
              </View>
              <Text className="flex-1 text-sm leading-5 text-ink/80">{point.text}</Text>
            </View>
          ))}
        </View>

        <View className="mt-auto pt-10">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
            Mobile number
          </Text>

          <View className="h-14 flex-row items-center overflow-hidden rounded-2xl border border-stone bg-surface">
            <View className="h-full flex-row items-center gap-2 border-r border-stone px-4">
              <Text className="text-base">🇱🇧</Text>
              <Text className="text-base font-bold text-ink">+961</Text>
            </View>
            <TextInput
              className="h-full flex-1 px-4 text-base text-ink"
              value={nationalNumber}
              onChangeText={setNationalNumber}
              keyboardType="phone-pad"
              placeholder="70 123 456"
              placeholderTextColor={Brand.muted}
              maxLength={12}
              autoFocus
              onSubmitEditing={handleContinue}
            />
          </View>

          {error ? <Text className="mt-2 text-sm text-danger">{error}</Text> : null}

          <View className="mt-4">
            <Button label="Continue" onPress={handleContinue} loading={loading} disabled={!valid} />
          </View>

          {isSupabaseConfigured ? null : (
            <View className="mt-4 rounded-2xl border border-stone bg-saffron/10 p-4">
              <Text className="text-xs leading-5 text-ink/80">
                <Text className="font-bold">Demo mode.</Text> No Supabase credentials found, so SMS
                is stubbed — any 6-digit code signs you in. Add
                <Text className="font-mono"> EXPO_PUBLIC_SUPABASE_URL </Text>
                and
                <Text className="font-mono"> EXPO_PUBLIC_SUPABASE_ANON_KEY </Text>
                to <Text className="font-mono">.env</Text> for real OTP.
              </Text>
              <Pressable
                onPress={handleGuest}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text className="mt-3 text-sm font-bold text-flame">Browse as a guest →</Text>
              </Pressable>
            </View>
          )}

          <Text className="mt-5 text-center text-[11px] leading-4 text-muted">
            By continuing you agree to the Yallatlob terms of service and privacy policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
