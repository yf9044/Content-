import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

import { getStore, type MenuItem, type Store } from '@/data/catalog';

export type CartLine = {
  itemId: string;
  name: string;
  emoji: string;
  unitPriceUsd: number;
  quantity: number;
};

export type CartState = {
  storeId: string | null;
  store: Store | null;
  lines: CartLine[];
  itemCount: number;
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  meetsMinimum: boolean;
  add: (storeId: string, item: MenuItem) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  quantityOf: (storeId: string, itemId: string) => number;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((nextStoreId: string, item: MenuItem) => {
    // One store per order — switching stores starts a fresh basket.
    setStoreId((current) => {
      if (current !== nextStoreId) setLines([]);
      return nextStoreId;
    });
    setLines((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        { itemId: item.id, name: item.name, emoji: item.emoji, unitPriceUsd: item.priceUsd, quantity: 1 },
      ];
    });
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((current) => {
      const next = current
        .map((line) => (line.itemId === itemId ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0);
      if (next.length === 0) setStoreId(null);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setStoreId(null);
  }, []);

  const value = useMemo<CartState>(() => {
    const store = storeId ? (getStore(storeId) ?? null) : null;
    const subtotalUsd = lines.reduce((total, line) => total + line.unitPriceUsd * line.quantity, 0);
    const deliveryFeeUsd = store && subtotalUsd > 0 ? store.deliveryFeeUsd : 0;

    return {
      storeId,
      store,
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalUsd,
      deliveryFeeUsd,
      totalUsd: subtotalUsd + deliveryFeeUsd,
      meetsMinimum: !store || subtotalUsd >= store.minOrderUsd,
      add,
      setQuantity,
      quantityOf: (queryStoreId, itemId) =>
        queryStoreId === storeId ? (lines.find((line) => line.itemId === itemId)?.quantity ?? 0) : 0,
      clear,
    };
  }, [storeId, lines, add, setQuantity, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartState {
  const context = use(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
