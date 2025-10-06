/**
 * Utility functions for working with organization positions
 */

/**
 * Convert positions array from settings to dropdown options format
 * Used by personnel forms and other components that need position options
 */
export function positionsToOptions(positions: string[]) {
  return positions.map((position) => ({
    value: position,
    label: position,
  }));
}

/**
 * Convert dropdown options back to positions array
 * Used when saving position changes
 */
export function optionsToPositions(options: { value: string; label: string }[]) {
  return options.map((option) => option.value);
}

/**
 * Get default positions if none are configured
 */
export function getDefaultPositions(): string[] {
  return ["Domare", "Tränare", "Admin", "Kassör"];
}