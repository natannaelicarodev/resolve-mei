import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

/**
 * Intercepta qualquer remoção da rota (cabeçalho, gesto ou botão físico) até
 * que o usuário confirme o descarte. A navegação após salvar pode ser liberada
 * explicitamente sem exibir o diálogo.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const navigation = useNavigation();
  const allowNavigation = useRef(false);
  const pendingAction = useRef<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!isDirty || allowNavigation.current) return;
      event.preventDefault();
      pendingAction.current = event.data.action;
      setVisible(true);
    });
  }, [isDirty, navigation]);

  const cancelDiscard = () => {
    pendingAction.current = null;
    setVisible(false);
  };

  const confirmDiscard = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    allowNavigation.current = true;
    setVisible(false);
    if (action) navigation.dispatch(action);
  };

  const allowNextNavigation = () => {
    allowNavigation.current = true;
  };

  return { visible, cancelDiscard, confirmDiscard, allowNextNavigation };
}
