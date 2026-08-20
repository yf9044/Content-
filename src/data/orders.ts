export type OrderStatus = 'placed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  emoji: string;
  accent: string;
  status: OrderStatus;
  placedAt: string;
  itemSummary: string;
  totalUsd: number;
  courierName?: string;
  etaMinutes?: number;
};

export const ACTIVE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'placed', label: 'Order placed', icon: 'checkmark-circle' },
  { status: 'preparing', label: 'Being prepared', icon: 'restaurant' },
  { status: 'on_the_way', label: 'On the way', icon: 'bicycle' },
  { status: 'delivered', label: 'Delivered', icon: 'home' },
];

export const orders: Order[] = [
  {
    id: 'ord-1042',
    code: 'YT-1042',
    storeId: 'shawarma-street',
    storeName: 'Shawarma Street',
    emoji: '🌯',
    accent: '#E4572E',
    status: 'on_the_way',
    placedAt: 'Today, 8:12 PM',
    itemSummary: '2× Chicken shawarma, 1× Fattoush',
    totalUsd: 15.75,
    courierName: 'Rami',
    etaMinutes: 12,
  },
  {
    id: 'ord-1038',
    code: 'YT-1038',
    storeId: 'furn-al-sabaya',
    storeName: 'Furn al Sabaya',
    emoji: '🫓',
    accent: '#F4A259',
    status: 'delivered',
    placedAt: 'Yesterday, 9:04 AM',
    itemSummary: "3× Man'oushe zaatar, 1× Labneh plate",
    totalUsd: 9.0,
  },
  {
    id: 'ord-1021',
    code: 'YT-1021',
    storeId: 'beit-el-helo',
    storeName: 'Beit el Helo',
    emoji: '🍮',
    accent: '#C2410C',
    status: 'delivered',
    placedAt: 'Sat, 6:30 PM',
    itemSummary: '1× Knefeh bi jebneh, 1× Baklava box',
    totalUsd: 21.0,
  },
  {
    id: 'ord-1009',
    code: 'YT-1009',
    storeId: 'dekkaneh-24',
    storeName: 'Dekkaneh 24',
    emoji: '🛒',
    accent: '#1B7A43',
    status: 'cancelled',
    placedAt: 'Thu, 11:50 PM',
    itemSummary: '1× Water gallon 10L, 1× Candles pack',
    totalUsd: 6.5,
  },
];
