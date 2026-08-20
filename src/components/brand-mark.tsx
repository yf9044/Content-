import { Text, View } from 'react-native';

type BrandMarkProps = {
  size?: number;
  showWordmark?: boolean;
  onDark?: boolean;
};

export function BrandMark({ size = 44, showWordmark = true, onDark = false }: BrandMarkProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="items-center justify-center rounded-2xl bg-flame"
        style={{ width: size, height: size }}>
        <Text style={{ fontSize: size * 0.5 }}>🛵</Text>
      </View>
      {showWordmark ? (
        <View>
          <Text className={`text-xl font-extrabold ${onDark ? 'text-paper' : 'text-ink'}`}>
            Yallatlob
          </Text>
          <Text className={`text-[11px] ${onDark ? 'text-paper/70' : 'text-muted'}`}>
            يلا تلب · delivered in Lebanon
          </Text>
        </View>
      ) : null}
    </View>
  );
}
