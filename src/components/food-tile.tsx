import { Text, View, type ViewStyle } from 'react-native';

type FoodTileProps = {
  emoji: string;
  accent?: string;
  size?: number;
  radius?: number;
  style?: ViewStyle;
};

/**
 * Stands in for photography until real store imagery is uploaded to Supabase
 * storage — a tinted plate with the dish glyph, so lists never look broken.
 */
export function FoodTile({ emoji, accent = '#E4572E', size = 72, radius = 18, style }: FoodTileProps) {
  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={[{ width: size, height: size, borderRadius: radius, backgroundColor: `${accent}1F` }, style]}>
      <View
        className="absolute"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: size,
          backgroundColor: `${accent}26`,
        }}
      />
      <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
    </View>
  );
}
