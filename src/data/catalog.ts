/**
 * Seed catalogue used until the Supabase tables are populated. The shape mirrors
 * `supabase/schema.sql` one-to-one, so swapping this for live queries is a
 * matter of changing `src/lib/catalog.ts`.
 */

export type Category = {
  id: string;
  label: string;
  emoji: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  emoji: string;
  popular?: boolean;
};

export type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Store = {
  id: string;
  name: string;
  tagline: string;
  categoryIds: string[];
  area: string;
  emoji: string;
  accent: string;
  rating: number;
  ratingCount: number;
  etaMinutes: number;
  distanceKm: number;
  deliveryFeeUsd: number;
  minOrderUsd: number;
  promo?: string;
  closed?: boolean;
  menu: MenuSection[];
};

export const categories: Category[] = [
  { id: 'manakish', label: 'Manakish', emoji: '🫓' },
  { id: 'shawarma', label: 'Shawarma', emoji: '🌯' },
  { id: 'mashawi', label: 'Mashawi', emoji: '🍢' },
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'sweets', label: 'Sweets', emoji: '🍮' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'grocery', label: 'Grocery', emoji: '🛒' },
  { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
];

export const stores: Store[] = [
  {
    id: 'furn-al-sabaya',
    name: 'Furn al Sabaya',
    tagline: 'Wood-fired manakish since 1974',
    categoryIds: ['manakish', 'coffee'],
    area: 'Gemmayze, Beirut',
    emoji: '🫓',
    accent: '#F4A259',
    rating: 4.8,
    ratingCount: 1240,
    etaMinutes: 20,
    distanceKm: 1.2,
    deliveryFeeUsd: 1.5,
    minOrderUsd: 5,
    promo: 'Free delivery over $15',
    menu: [
      {
        id: 'saj',
        title: 'From the saj',
        items: [
          {
            id: 'zaatar',
            name: "Man'oushe zaatar",
            description: 'Thyme, sumac, olive oil, sesame',
            priceUsd: 1.5,
            emoji: '🫓',
            popular: true,
          },
          {
            id: 'jebneh',
            name: "Man'oushe jebneh",
            description: 'Akkawi cheese, nigella seeds',
            priceUsd: 2.75,
            emoji: '🧀',
            popular: true,
          },
          {
            id: 'lahm',
            name: 'Lahm bi ajin',
            description: 'Minced beef, tomato, pine nuts, pomegranate molasses',
            priceUsd: 3.25,
            emoji: '🥟',
          },
          {
            id: 'kishk',
            name: "Man'oushe kishk",
            description: 'Fermented yoghurt and bulgur, walnut, tomato',
            priceUsd: 2.5,
            emoji: '🫓',
          },
        ],
      },
      {
        id: 'sides',
        title: 'Sides & drinks',
        items: [
          {
            id: 'labneh',
            name: 'Labneh plate',
            description: 'Strained yoghurt, olives, mint, cucumber',
            priceUsd: 3.0,
            emoji: '🥣',
          },
          { id: 'ayran', name: 'Ayran', description: 'Salted yoghurt drink, 250ml', priceUsd: 1.25, emoji: '🥛' },
          { id: 'tea', name: 'Zaatar tea', description: 'Wild thyme infusion', priceUsd: 1.0, emoji: '🍵' },
        ],
      },
    ],
  },
  {
    id: 'shawarma-street',
    name: 'Shawarma Street',
    tagline: 'Beirut-style spits, carved to order',
    categoryIds: ['shawarma', 'mashawi'],
    area: 'Hamra, Beirut',
    emoji: '🌯',
    accent: '#E4572E',
    rating: 4.6,
    ratingCount: 3180,
    etaMinutes: 25,
    distanceKm: 2.4,
    deliveryFeeUsd: 2.0,
    minOrderUsd: 6,
    promo: '20% off first order',
    menu: [
      {
        id: 'sandwiches',
        title: 'Sandwiches',
        items: [
          {
            id: 'chicken-shawarma',
            name: 'Chicken shawarma',
            description: 'Toum, pickles, fries, saj bread',
            priceUsd: 4.5,
            emoji: '🌯',
            popular: true,
          },
          {
            id: 'beef-shawarma',
            name: 'Beef shawarma',
            description: 'Tahini, tomato, parsley, onion, sumac',
            priceUsd: 5.25,
            emoji: '🌯',
            popular: true,
          },
          {
            id: 'taouk',
            name: 'Shish taouk',
            description: 'Charcoal chicken skewer, garlic, pickles',
            priceUsd: 5.0,
            emoji: '🍢',
          },
        ],
      },
      {
        id: 'platters',
        title: 'Platters',
        items: [
          {
            id: 'mixed-grill',
            name: 'Mixed grill platter',
            description: 'Taouk, kafta and lahm meshwi with rice',
            priceUsd: 16.0,
            emoji: '🍽️',
          },
          {
            id: 'fattoush',
            name: 'Fattoush',
            description: 'Garden vegetables, sumac, toasted bread',
            priceUsd: 4.75,
            emoji: '🥗',
          },
        ],
      },
    ],
  },
  {
    id: 'beit-el-helo',
    name: 'Beit el Helo',
    tagline: 'Knefeh, baklava and ashta',
    categoryIds: ['sweets', 'coffee'],
    area: 'Achrafieh, Beirut',
    emoji: '🍮',
    accent: '#C2410C',
    rating: 4.9,
    ratingCount: 860,
    etaMinutes: 30,
    distanceKm: 3.1,
    deliveryFeeUsd: 2.5,
    minOrderUsd: 8,
    menu: [
      {
        id: 'sweets',
        title: 'Sweets',
        items: [
          {
            id: 'knefeh',
            name: 'Knefeh bi jebneh',
            description: 'Semolina, sweet cheese, kaak bread, syrup',
            priceUsd: 6.5,
            emoji: '🧆',
            popular: true,
          },
          {
            id: 'baklava',
            name: 'Baklava box (500g)',
            description: 'Pistachio, cashew and walnut assortment',
            priceUsd: 12.0,
            emoji: '🍯',
            popular: true,
          },
          {
            id: 'mafroukeh',
            name: 'Mafroukeh ashta',
            description: 'Semolina cream, clotted cream, pistachio',
            priceUsd: 7.25,
            emoji: '🍮',
          },
        ],
      },
      {
        id: 'hot',
        title: 'Hot drinks',
        items: [
          {
            id: 'arabic-coffee',
            name: 'Arabic coffee',
            description: 'Cardamom, served in a rakwe for two',
            priceUsd: 3.5,
            emoji: '☕',
          },
        ],
      },
    ],
  },
  {
    id: 'smash-beirut',
    name: 'Smash Beirut',
    tagline: 'Smashed patties and loaded fries',
    categoryIds: ['burgers'],
    area: 'Mar Mikhael, Beirut',
    emoji: '🍔',
    accent: '#1B7A43',
    rating: 4.4,
    ratingCount: 2010,
    etaMinutes: 35,
    distanceKm: 1.8,
    deliveryFeeUsd: 2.0,
    minOrderUsd: 7,
    menu: [
      {
        id: 'burgers',
        title: 'Burgers',
        items: [
          {
            id: 'classic-smash',
            name: 'Classic smash',
            description: 'Double patty, cheddar, pickles, house sauce',
            priceUsd: 8.5,
            emoji: '🍔',
            popular: true,
          },
          {
            id: 'spicy-smash',
            name: 'Beiruti spicy',
            description: 'Harissa mayo, jalapeño, crispy onion',
            priceUsd: 9.25,
            emoji: '🌶️',
          },
        ],
      },
      {
        id: 'sides',
        title: 'Sides',
        items: [
          { id: 'fries', name: 'Loaded fries', description: 'Cheese sauce, sumac onion', priceUsd: 5.0, emoji: '🍟' },
          { id: 'cola', name: 'Soft drink', description: 'Chilled can, 330ml', priceUsd: 1.5, emoji: '🥤' },
        ],
      },
    ],
  },
  {
    id: 'dekkaneh-24',
    name: 'Dekkaneh 24',
    tagline: 'Corner shop essentials, round the clock',
    categoryIds: ['grocery'],
    area: 'Badaro, Beirut',
    emoji: '🛒',
    accent: '#1B7A43',
    rating: 4.3,
    ratingCount: 540,
    etaMinutes: 15,
    distanceKm: 0.8,
    deliveryFeeUsd: 1.0,
    minOrderUsd: 4,
    promo: 'Open 24/7',
    menu: [
      {
        id: 'basics',
        title: 'Basics',
        items: [
          { id: 'bread', name: 'Arabic bread bundle', description: 'Large loaves, pack of 6', priceUsd: 1.2, emoji: '🥙' },
          { id: 'eggs', name: 'Eggs (tray of 30)', description: 'Farm fresh, medium', priceUsd: 6.0, emoji: '🥚' },
          { id: 'water', name: 'Water gallon 10L', description: 'Mineral water', priceUsd: 2.5, emoji: '💧' },
          { id: 'candles', name: 'Candles pack', description: 'For the cut, 12 pieces', priceUsd: 3.0, emoji: '🕯️' },
        ],
      },
    ],
  },
  {
    id: 'saydaliyet-nour',
    name: 'Saydaliyet Nour',
    tagline: 'Pharmacy delivery in under an hour',
    categoryIds: ['pharmacy'],
    area: 'Verdun, Beirut',
    emoji: '💊',
    accent: '#0369A1',
    rating: 4.7,
    ratingCount: 320,
    etaMinutes: 40,
    distanceKm: 4.2,
    deliveryFeeUsd: 3.0,
    minOrderUsd: 5,
    closed: true,
    menu: [
      {
        id: 'otc',
        title: 'Over the counter',
        items: [
          { id: 'panadol', name: 'Paracetamol 500mg', description: 'Box of 20 tablets', priceUsd: 2.5, emoji: '💊' },
          { id: 'vitc', name: 'Vitamin C 1000mg', description: 'Effervescent, 10 tablets', priceUsd: 4.0, emoji: '🍊' },
        ],
      },
    ],
  },
];

export function getStore(id: string): Store | undefined {
  return stores.find((store) => store.id === id);
}

export function getMenuItem(storeId: string, itemId: string): MenuItem | undefined {
  return getStore(storeId)
    ?.menu.flatMap((section) => section.items)
    .find((item) => item.id === itemId);
}
