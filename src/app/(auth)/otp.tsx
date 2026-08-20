import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { useSession } from '@/lib/session';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OtpVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { requestOtp, verifyOtp } = useSession();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = async (value: string = code) => {
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That code did not work');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    setError('');
    setSecondsLeft(RESEND_SECONDS);
    try {
      await requestOtp(phone);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend the code');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-paper">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}>
          <View className="h-10 w-10 items-center justify-center rounded-full border border-stone bg-surface">
            <Ionicons name="chevron-back" size={20} color={Brand.ink} />
          </View>
        </Pressable>

        <View className="mt-8 gap-2">
          <Text className="text-3xl font-extrabold text-ink">Verify your number</Text>
          <Text className="text-sm text-muted">
            We sent a {CODE_LENGTH}-digit code to <Text className="font-bold text-ink">{phone}</Text>
          </Text>
        </View>

        <Pressable className="mt-8" onPress={() => inputRef.current?.focus()}>
          <View className="flex-row justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const filled = index < code.length;
              const active = index === code.length;
              return (
                <View
                  key={index}
                  className={`h-16 flex-1 items-center justify-center rounded-2xl border bg-surface ${
                    active ? 'border-flame' : filled ? 'border-stone' : 'border-stone'
                  }`}>
                  <Text className="text-2xl font-extrabold text-ink">{code[index] ?? ''}</Text>
                </View>
              );
            })}
          </View>

          <TextInput
            ref={inputRef}
            className="absolute h-16 w-full opacity-0"
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            autoFocus
          />
        </Pressable>

        {error ? <Text className="mt-3 text-sm text-danger">{error}</Text> : null}

        <View className="mt-6 flex-row items-center justify-center gap-1">
          {secondsLeft > 0 ? (
            <Text className="text-sm text-muted">Resend code in {secondsLeft}s</Text>
          ) : (
            <Pressable onPress={handleResend} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Text className="text-sm font-bold text-flame">Resend code</Text>
            </Pressable>
          )}
        </View>

        <View className="mt-auto">
          <Button
            label="Verify"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={code.length !== CODE_LENGTH}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
