import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

import { Brand } from '@/constants/theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  trailing?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

const surface = {
  primary: 'bg-flame',
  secondary: 'bg-surface border border-stone',
  ghost: 'bg-transparent',
};

const labelTone = {
  primary: 'text-paper',
  secondary: 'text-ink',
  ghost: 'text-flame',
};

export function Button({
  label,
  trailing,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => ({ opacity: inactive ? 0.55 : pressed ? 0.8 : 1 })}
      {...rest}>
      <View
        className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${surface[variant]}`}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? Brand.paper : Brand.flame} />
        ) : (
          <>
            <Text className={`text-base font-bold ${labelTone[variant]}`}>{label}</Text>
            {trailing ? (
              <Text className={`text-base font-bold ${labelTone[variant]} opacity-80`}>
                {trailing}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}
