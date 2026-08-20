import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  onAdd: () => void;
};

export function QuantityStepper({ quantity, onChange, onAdd }: QuantityStepperProps) {
  if (quantity === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add to basket"
        onPress={onAdd}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-flame">
          <Ionicons name="add" size={20} color={Brand.paper} />
        </View>
      </Pressable>
    );
  }

  return (
    <View className="h-9 flex-row items-center gap-1 rounded-full bg-flame px-1">
      <Step icon="remove" label="Decrease quantity" onPress={() => onChange(quantity - 1)} />
      <Text className="min-w-6 text-center text-sm font-bold text-paper">{quantity}</Text>
      <Step icon="add" label="Increase quantity" onPress={() => onChange(quantity + 1)} />
    </View>
  );
}

function Step({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <View className="h-7 w-7 items-center justify-center rounded-full">
        <Ionicons name={icon} size={16} color={Brand.paper} />
      </View>
    </Pressable>
  );
}
