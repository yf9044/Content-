import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from './supabase';

const DEMO_SESSION_KEY = 'yallatlob.demo-session';

export type SessionState = {
  ready: boolean;
  phone: string | null;
  signedIn: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restore() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (active) setPhone(sessionPhone(data.session));
      } else {
        const stored = await AsyncStorage.getItem(DEMO_SESSION_KEY);
        if (active) setPhone(stored);
      }
      if (active) setReady(true);
    }

    restore();

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      setPhone(sessionPhone(session));
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const requestOtp = useCallback(async (nextPhone: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ phone: nextPhone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (nextPhone: string, token: string) => {
    if (!supabase) {
      // Demo mode: any six digits get you in, so the rest of the app is reviewable.
      if (token.replace(/\D/g, '').length !== 6) {
        throw new Error('Enter the 6-digit code');
      }
      await AsyncStorage.setItem(DEMO_SESSION_KEY, nextPhone);
      setPhone(nextPhone);
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: nextPhone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    setPhone(sessionPhone(data.session));
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    }
    setPhone(null);
  }, []);

  const value = useMemo<SessionState>(
    () => ({ ready, phone, signedIn: phone !== null, requestOtp, verifyOtp, signOut }),
    [ready, phone, requestOtp, verifyOtp, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionState {
  const context = use(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}

export { isSupabaseConfigured };

function sessionPhone(session: Session | null): string | null {
  if (!session?.user) return null;
  return session.user.phone ? `+${session.user.phone.replace(/^\+/, '')}` : null;
}
