import * as Haptics from 'expo-haptics';

export type HapticIntent = 'selection' | 'success' | 'warning' | 'error';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export async function triggerHaptic(intent: HapticIntent): Promise<void> {
  if (!enabled) return;
  try {
    if (intent === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    const type = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[intent];
    await Haptics.notificationAsync(type);
  } catch {
    // Haptics are enhancement-only and must never block an action.
  }
}
