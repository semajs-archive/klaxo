import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Uses clsx to build the string and tailwind-merge to dedupe
 * conflicting Tailwind utilities (later classes win).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}