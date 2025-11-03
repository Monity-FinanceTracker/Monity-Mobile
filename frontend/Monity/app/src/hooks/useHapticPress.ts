import { useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

/**
 * Hook that wraps an onPress handler with haptic feedback
 * @param onPress - The original onPress handler
 * @returns A new handler that triggers haptics before calling the original handler
 */
export const useHapticPress = (onPress?: () => void) => {
  return useCallback(() => {
    if (onPress) {
      triggerHaptic();
      onPress();
    }
  }, [onPress]);
};

