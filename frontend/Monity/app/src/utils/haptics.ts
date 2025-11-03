import * as Haptics from 'expo-haptics';

/**
 * Trigger haptic feedback for button presses
 * Uses ImpactFeedbackStyle.Light for standard button interactions
 */
export const triggerHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail if haptics are not available (e.g., on simulator)
    console.debug('Haptics not available:', error);
  }
};

/**
 * Trigger haptic feedback for important actions
 * Uses ImpactFeedbackStyle.Medium for more significant interactions
 */
export const triggerHapticMedium = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
};

/**
 * Trigger haptic feedback for critical actions
 * Uses ImpactFeedbackStyle.Heavy for very important interactions
 */
export const triggerHapticHeavy = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
};

/**
 * Trigger haptic feedback for selection
 * Uses SelectionFeedbackStyle for selection events
 */
export const triggerHapticSelection = () => {
  try {
    Haptics.selectionAsync();
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
};

