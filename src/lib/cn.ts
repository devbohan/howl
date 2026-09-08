import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * The class merger Aceternity components are written against: clsx for
 * conditionals, tailwind-merge so a caller's `className` can override a
 * component's own utilities instead of both landing in the class list.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
