import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const financialPrivacyStorageKey = (userId: string) =>
  `@resolve-mei/financial-values-hidden:${userId}`;

export function useFinancialPrivacy(userId: string) {
  const [state, setState] = useState({ userId, hidden: true, hydrated: false });
  const current =
    state.userId === userId ? state : { userId, hidden: true, hydrated: false };

  useEffect(() => {
    let active = true;
    if (!userId) return () => undefined;
    void AsyncStorage.getItem(financialPrivacyStorageKey(userId))
      .then((stored) => {
        if (active)
          setState({ userId, hidden: stored !== 'false', hydrated: true });
      })
      .catch(() => {
        if (active) setState({ userId, hidden: true, hydrated: true });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const toggle = useCallback(async () => {
    if (!current.hydrated || !userId) return;
    const next = !current.hidden;
    setState({ userId, hidden: next, hydrated: true });
    await AsyncStorage.setItem(
      financialPrivacyStorageKey(userId),
      String(next),
    );
  }, [current.hidden, current.hydrated, userId]);

  return {
    hidden: current.hidden || !current.hydrated,
    hydrated: current.hydrated,
    toggle,
  };
}
